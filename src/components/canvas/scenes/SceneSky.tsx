import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { easeInOutCubic, getScroll, smoothstep } from "../../../lib/scroll";
import { sceneSkyLocalProgress } from "../../../lib/pageBounds";
import { palette } from "../../../lib/palette";
import VegasLandmarks from "./VegasLandmarks";

const TOWER_URL = `${import.meta.env.BASE_URL}models/tower.glb`;
useGLTF.preload(TOWER_URL);

/** Procedural soft-cloud texture (radial fall-off) — generated on the
 *  client, no asset fetch, no CORS issues. */
function makeCloudTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.00, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(220,225,240,0.55)");
  g.addColorStop(0.65, "rgba(180,190,215,0.18)");
  g.addColorStop(1.00, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type CloudSpec = { x: number; y: number; z: number; w: number; h: number; rot: number; opacity: number };

/** Hero tower — Blender-generated luxury condo tower. */
function HeroTower({ position, scale = 1, opacity = 1 }: { position: [number, number, number]; scale?: number; opacity?: number }) {
  const { scene } = useGLTF(TOWER_URL);
  // Clone so each instance has independent transforms but shares geometry
  const clone = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        // Allow per-instance opacity by cloning material on transparent instances
        if (opacity < 1) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mesh.material = mats.map((m) => {
            const cm = (m as THREE.MeshStandardMaterial).clone();
            cm.transparent = true;
            cm.opacity = opacity;
            return cm;
          });
        }
      }
    });
  }, [clone, opacity]);

  return <primitive object={clone} position={position} scale={scale} />;
}

/**
 * Scene 1 — Sky intro / hero.
 *
 * Owns the first 100vh of scroll. As the user scrolls, the camera
 * descends from upper atmosphere down through wispy clouds toward a
 * procedural NYC-style skyline. Horizon glow strengthens toward the end.
 *
 * The 2D copy overlay (HeroOverlay.tsx) reads the same scroll progress
 * and reveals copy in sync.
 */
export default function SceneSky() {
  const { camera } = useThree();

  // Refs
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const horizonGlowRef = useRef<THREE.Mesh>(null);
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const skylineRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  // -------------------------------------------------------------------
  // Sky shader: vertical gradient + warm horizon that strengthens with scroll
  // -------------------------------------------------------------------
  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(palette.skyTop) },
        uBottom: { value: new THREE.Color(palette.skyBottom) },
        uHorizon: { value: new THREE.Color(palette.brass) },
        uHorizonStrength: { value: 0.0 }
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vWorldPos;
        uniform vec3 uTop;
        uniform vec3 uBottom;
        uniform vec3 uHorizon;
        uniform float uHorizonStrength;
        void main() {
          // Normalize Y of world position to a 0..1 vertical gradient
          float h = clamp((vWorldPos.y + 200.0) / 600.0, 0.0, 1.0);
          vec3 sky = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
          // Warm horizon glow, peaks near h≈0.18
          float band = smoothstep(0.45, 0.0, h) * smoothstep(-0.1, 0.05, h);
          sky = mix(sky, uHorizon, band * uHorizonStrength * 0.55);
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
  }, []);

  // -------------------------------------------------------------------
  // Gold dust particles (drifting slowly upward)
  // -------------------------------------------------------------------
  const particleCount = 280;
  const particleGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 220; // x
      positions[i * 3 + 1] = Math.random() * 220 - 20;    // y
      positions[i * 3 + 2] = -Math.random() * 220 - 10;   // z
      speeds[i] = 0.04 + Math.random() * 0.06;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));
    return geom;
  }, []);

  const particleMaterial = useMemo(() => new THREE.PointsMaterial({
    color: new THREE.Color(palette.brass),
    size: 0.45,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  }), []);

  // -------------------------------------------------------------------
  // Procedural Vegas-style backdrop — buildings that match the front
  // landmarks in detail level. Each building gets:
  //   - a material variant from a palette (cream casino, bronze tower,
  //     dark glass condo, white resort, green mid-tier hotel)
  //   - slab trim between floors (horizontal banding)
  //   - a crown variant (flat / stepped / antenna / sign-panel)
  //   - window style (grid or vertical curtain wall)
  //   - optional low podium for casinos
  // -------------------------------------------------------------------
  type WinStyle = "grid" | "curtain";
  type CrownStyle = "flat" | "stepped" | "antenna" | "sign";
  type BuildingSpec = {
    x: number; y: number; z: number;
    w: number; h: number; d: number;
    matIdx: number;          // 0..4 — facade material variant
    winStyle: WinStyle;
    winMatIdx: number;       // 0..1 — warm or cool window
    skipRate: number;
    crown: CrownStyle;
    crownColor?: string;     // for "sign" crown
    podium: boolean;
  };

  const skyline = useMemo(() => {
    const buildings: BuildingSpec[] = [];

    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

    const rows = [
      { z: -150, count: 16, lowH: [10, 22], tallH: [26, 48], spreadX: 320 },
      { z: -210, count: 12, lowH: [14, 26], tallH: [34, 64], spreadX: 400 }
    ];

    const signColors = ["#ff2a6d", "#5cd6ff", "#c560ff", "#ff8f30", "#3cffaf", "#ffd040"];

    rows.forEach((row) => {
      for (let i = 0; i < row.count; i++) {
        const isTall = rand() < 0.45;
        let w, h, d;
        if (isTall) {
          w = 3.2 + rand() * 3.5;
          h = row.tallH[0] + rand() * (row.tallH[1] - row.tallH[0]);
          d = 3.2 + rand() * 3.5;
        } else {
          w = 7 + rand() * 9;
          h = row.lowH[0] + rand() * (row.lowH[1] - row.lowH[0]);
          d = 5 + rand() * 6;
        }
        const x = -row.spreadX / 2 + (i / (row.count - 1)) * row.spreadX + (rand() - 0.5) * 6;
        const y = h / 2;
        const z = row.z + (rand() - 0.5) * 22;

        buildings.push({
          x, y, z, w, h, d,
          matIdx: Math.floor(rand() * 5),
          winStyle: isTall && rand() > 0.4 ? "curtain" : "grid",
          winMatIdx: rand() > 0.4 ? 0 : 1,
          skipRate: 0.18 + rand() * 0.22,
          crown: pick<CrownStyle>(
            isTall
              ? ["antenna", "sign", "stepped", "flat"]
              : ["sign", "flat", "stepped", "flat"]
          ),
          crownColor: signColors[Math.floor(rand() * signColors.length)],
          podium: !isTall && rand() > 0.45
        });
      }
    });

    return buildings;
  }, []);

  // 5 facade material variants
  const facadeMats = useMemo(() => [
    // 0: cream casino (Bellagio-adjacent)
    new THREE.MeshStandardMaterial({
      color: 0xb9a280, metalness: 0.05, roughness: 0.75,
      emissive: new THREE.Color("#4a3a22"), emissiveIntensity: 0.7
    }),
    // 1: bronze hotel tower (Wynn-adjacent)
    new THREE.MeshStandardMaterial({
      color: 0x6a4a18, metalness: 0.85, roughness: 0.28,
      emissive: new THREE.Color("#a87830"), emissiveIntensity: 1.0
    }),
    // 2: dark glass modern condo (Aria-adjacent)
    new THREE.MeshStandardMaterial({
      color: 0x162030, metalness: 0.9, roughness: 0.16,
      emissive: new THREE.Color("#1a2640"), emissiveIntensity: 0.35
    }),
    // 3: warm stone resort (Paris/Caesars-adjacent)
    new THREE.MeshStandardMaterial({
      color: 0x7e5630, metalness: 0.1, roughness: 0.7,
      emissive: new THREE.Color("#3e2810"), emissiveIntensity: 0.85
    }),
    // 4: cool slate hotel
    new THREE.MeshStandardMaterial({
      color: 0x2a3040, metalness: 0.55, roughness: 0.4,
      emissive: new THREE.Color("#1a2436"), emissiveIntensity: 0.55
    })
  ], []);

  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x141420, metalness: 0.4, roughness: 0.5,
    emissive: new THREE.Color("#0a0a14"), emissiveIntensity: 0.3
  }), []);
  const crownMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4a3622, metalness: 0.85, roughness: 0.3,
    emissive: new THREE.Color("#8a6020"), emissiveIntensity: 1.2
  }), []);
  const antennaMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x52525a, metalness: 0.8, roughness: 0.3
  }), []);

  // Window materials — warm + cool
  const windowMats = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#f0c46a"), transparent: true, opacity: 0.93 }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#a8d0ff"), transparent: true, opacity: 0.85 })
  ], []);

  // Neon strip accents — a handful of saturated colored window lights
  // sprinkled into the front rows so the skyline reads Vegas, not NYC.
  const neonAccents = useMemo(() => {
    type Neon = { x: number; y: number; z: number; color: string };
    const out: Neon[] = [];
    let s = 19;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const palette = ["#ff5070", "#5cc8ff", "#c560ff", "#ffaf3a"];
    for (let i = 0; i < 28; i++) {
      out.push({
        x: -100 + r() * 200,
        y: 1.5 + r() * 18,
        z: -85 + r() * 12,
        color: palette[Math.floor(r() * palette.length)]
      });
    }
    return out;
  }, []);

  const mountainMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x141422,
    metalness: 0.0,
    roughness: 1.0,
    transparent: true,
    opacity: 0.85
  }), []);
  const desertGroundMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0c0c14,
    roughness: 1.0
  }), []);

  // Procedural mountain silhouette ridge — sample heights along a line
  const mountainRidge = useMemo(() => {
    const ridge: { x: number; h: number; w: number }[] = [];
    let s = 13;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const COUNT = 22;
    const SPREAD = 520;
    for (let i = 0; i < COUNT; i++) {
      const x = -SPREAD / 2 + (i / (COUNT - 1)) * SPREAD;
      const h = 22 + r() * 36;
      const w = 28 + r() * 22;
      ridge.push({ x, h, w });
    }
    return ridge;
  }, []);

  // -------------------------------------------------------------------
  // Procedural clouds (no CDN texture)
  // -------------------------------------------------------------------
  const cloudTexture = useMemo(() => makeCloudTexture(), []);
  const cloudMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    color: new THREE.Color("#aab4d4"),
    side: THREE.DoubleSide
  }), [cloudTexture]);

  const cloudSpecs = useMemo<CloudSpec[]>(() => [
    { x: -40, y: 145, z: -20, w: 90, h: 36, rot:  0.05, opacity: 0.55 },
    { x:  50, y: 132, z: -10, w: 110, h: 42, rot: -0.04, opacity: 0.50 },
    { x: -55, y: 108, z: -30, w: 80, h: 30, rot:  0.07, opacity: 0.45 },
    { x:  15, y: 158, z: -45, w: 130, h: 48, rot: -0.02, opacity: 0.60 },
    { x:  70, y: 95,  z: -25, w: 70, h: 26, rot:  0.10, opacity: 0.42 }
  ], []);
  // -------------------------------------------------------------------
  // Per-frame update — pulls scroll progress, drives everything.
  // -------------------------------------------------------------------
  const camStart = useMemo(() => new THREE.Vector3(0, 200, 0), []);
  const camEnd = useMemo(() => new THREE.Vector3(0, 80, 30), []);
  const lookStart = useMemo(() => new THREE.Vector3(0, 150, -200), []);
  const lookEnd = useMemo(() => new THREE.Vector3(0, 30, -150), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const { scrollY, vh } = getScroll();
    const localRaw = sceneSkyLocalProgress(scrollY, vh);
    const local = easeInOutCubic(localRaw);

    // Camera descends along the rail
    tmpVec.lerpVectors(camStart, camEnd, local);
    tmpLook.lerpVectors(lookStart, lookEnd, local);
    camera.position.copy(tmpVec);
    camera.lookAt(tmpLook);

    if (skyMatRef.current) {
      const u = skyMatRef.current.uniforms.uHorizonStrength;
      u.value = smoothstep(0.3, 0.95, localRaw);
    }

    // Cloud drift + visibility
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.children.forEach((c, i) => {
        c.position.x += (i % 2 === 0 ? 1 : -1) * delta * 0.3;
        // wrap
        if (c.position.x > 140) c.position.x = -140;
        if (c.position.x < -140) c.position.x = 140;
      });
      cloudsGroupRef.current.visible = localRaw < 0.85;
    }

    // Gold particles drift upward, wrap at top
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const speeds = particlesRef.current.geometry.attributes.speed as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const y = pos.getY(i) + speeds.getX(i) * delta * 10;
        pos.setY(i, y > 200 ? -10 : y);
      }
      pos.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).opacity =
        0.35 + smoothstep(0.6, 1.0, localRaw) * 0.45;
    }

    // Skyline fade-in — only affect direct procedural meshes; the
    // tower models below are GLTF primitives and self-manage opacity.
    if (skylineRef.current) {
      const v = smoothstep(0.45, 0.85, localRaw);
      skylineRef.current.children.forEach((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const m = (child as THREE.Mesh).material as THREE.Material | undefined;
        if (!m || !("opacity" in m)) return;
        const std = m as THREE.MeshStandardMaterial;
        std.transparent = true;
        std.opacity = v;
      });
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      skyMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      facadeMats.forEach((m) => m.dispose());
      windowMats.forEach((m) => m.dispose());
      slabMat.dispose();
      crownMat.dispose();
      antennaMat.dispose();
      mountainMat.dispose();
      desertGroundMat.dispose();
      cloudMaterial.dispose();
      cloudTexture.dispose();
    };
  }, [
    skyMaterial, particleGeometry, particleMaterial,
    facadeMats, windowMats, slabMat, crownMat, antennaMat,
    mountainMat, desertGroundMat,
    cloudMaterial, cloudTexture
  ]);

  return (
    <group>
      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[600, 32, 32]} />
        <primitive object={skyMaterial} ref={skyMatRef} attach="material" />
      </mesh>

      {/* Lights */}
      <ambientLight ref={ambientRef} color={palette.ambient} intensity={0.15} />
      <directionalLight color={palette.moon} intensity={0.8} position={[-200, 250, -50]} />
      <hemisphereLight ref={hemiRef} args={[palette.skyBottom, palette.groundDim, 0.4]} />
      <fog attach="fog" args={[palette.skyBottom, 50, 400]} />

      {/* Stars */}
      <Stars radius={400} depth={120} count={150} factor={3} saturation={0} fade speed={0.3} />

      {/* Clouds — procedural soft sprites, no asset fetch */}
      <group ref={cloudsGroupRef}>
        {cloudSpecs.map((c, i) => (
          <mesh key={`cloud-${i}`} position={[c.x, c.y, c.z]} rotation={[0, 0, c.rot]} material={cloudMaterial}>
            <planeGeometry args={[c.w, c.h]} />
          </mesh>
        ))}
      </group>

      {/* Gold dust */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />

      {/* Skyline silhouette — Las Vegas Strip */}
      <group ref={skylineRef}>
        {/* Mountain silhouettes behind everything (Spring Mountains) */}
        {mountainRidge.map((m, i) => (
          <mesh
            key={`mt-${i}`}
            position={[m.x, m.h / 2 - 2, -260]}
            material={mountainMat}
          >
            <coneGeometry args={[m.w / 2, m.h, 4]} />
          </mesh>
        ))}

        {/* Procedural Vegas backdrop buildings — each with slab trim,
            crown variant, optional podium, and varied facade material */}
        {skyline.map((b, i) => {
          const facade = facadeMats[b.matIdx];
          const winMat = windowMats[b.winMatIdx];
          // Slab trim every ~5 floors for tall buildings
          const slabCount = b.h > 24 ? Math.floor(b.h / 5) : 0;
          // Window grid dimensions
          const winCols = Math.max(2, Math.floor(b.w / 1.2));
          const winRows = Math.max(2, Math.floor(b.h / 1.8));
          return (
            <group key={`bldg-${i}`} position={[b.x, 0, b.z]}>
              {/* Main mass */}
              <mesh position={[0, b.h / 2, 0]} material={facade}>
                <boxGeometry args={[b.w, b.h, b.d]} />
              </mesh>

              {/* Podium (lower wider base) */}
              {b.podium && (
                <mesh position={[0, 1.6, 0.4]} material={facade}>
                  <boxGeometry args={[b.w * 1.18, 3.2, b.d * 1.2]} />
                </mesh>
              )}

              {/* Horizontal slab trim every ~5 floors */}
              {Array.from({ length: slabCount }).map((_, s) => (
                <mesh
                  key={`slab-${i}-${s}`}
                  position={[0, (s + 1) * (b.h / (slabCount + 1)), 0]}
                  material={slabMat}
                >
                  <boxGeometry args={[b.w + 0.08, 0.18, b.d + 0.08]} />
                </mesh>
              ))}

              {/* Windows — grid OR curtain wall */}
              {b.winStyle === "grid" &&
                Array.from({ length: winRows }).map((_, cy) =>
                  Array.from({ length: winCols }).map((__, cx) => {
                    if ((cx + cy + i) % 7 === 0) return null;
                    if (((cx * 13 + cy * 7 + i) % 100) / 100 < b.skipRate) return null;
                    return (
                      <mesh
                        key={`w-${i}-${cy}-${cx}`}
                        position={[
                          -b.w / 2 + (cx + 0.5) * (b.w / winCols),
                          0.6 + cy * (b.h / winRows),
                          b.d / 2 + 0.02
                        ]}
                        material={winMat}
                      >
                        <planeGeometry args={[0.55, 0.55]} />
                      </mesh>
                    );
                  })
                )}
              {b.winStyle === "curtain" &&
                Array.from({ length: winCols }).map((_, cx) =>
                  Array.from({ length: Math.max(2, Math.floor(b.h / 2.4)) }).map((__, cy) => {
                    if (((cx * 7 + cy * 11 + i) % 100) / 100 < b.skipRate) return null;
                    return (
                      <mesh
                        key={`cw-${i}-${cy}-${cx}`}
                        position={[
                          -b.w / 2 + (cx + 0.5) * (b.w / winCols),
                          1.2 + cy * 2.4,
                          b.d / 2 + 0.02
                        ]}
                        material={winMat}
                      >
                        <planeGeometry args={[0.45, 1.6]} />
                      </mesh>
                    );
                  })
                )}

              {/* Crown variant */}
              {b.crown === "flat" && (
                <mesh position={[0, b.h + 0.2, 0]} material={crownMat}>
                  <boxGeometry args={[b.w + 0.2, 0.4, b.d + 0.2]} />
                </mesh>
              )}
              {b.crown === "stepped" && (
                <>
                  <mesh position={[0, b.h + 0.4, 0]} material={facade}>
                    <boxGeometry args={[b.w * 0.85, 0.9, b.d * 0.85]} />
                  </mesh>
                  <mesh position={[0, b.h + 1.2, 0]} material={crownMat}>
                    <boxGeometry args={[b.w * 0.65, 0.6, b.d * 0.65]} />
                  </mesh>
                </>
              )}
              {b.crown === "antenna" && (
                <>
                  <mesh position={[0, b.h + 0.25, 0]} material={crownMat}>
                    <boxGeometry args={[b.w + 0.15, 0.5, b.d + 0.15]} />
                  </mesh>
                  <mesh position={[0, b.h + 3.5, 0]} material={antennaMat}>
                    <cylinderGeometry args={[0.08, 0.15, 6.0, 8]} />
                  </mesh>
                  <mesh position={[0, b.h + 6.6, 0]}>
                    <sphereGeometry args={[0.22, 8, 8]} />
                    <meshBasicMaterial color="#ff5050" />
                  </mesh>
                </>
              )}
              {b.crown === "sign" && (
                <>
                  <mesh position={[0, b.h + 0.4, 0]} material={crownMat}>
                    <boxGeometry args={[b.w + 0.2, 0.8, b.d + 0.2]} />
                  </mesh>
                  {/* Glowing sign panel */}
                  <mesh position={[0, b.h + 1.4, b.d / 2 + 0.05]}>
                    <planeGeometry args={[b.w * 0.9, 1.2]} />
                    <meshBasicMaterial
                      color={b.crownColor}
                      transparent
                      opacity={0.95}
                      blending={THREE.AdditiveBlending}
                      depthWrite={false}
                    />
                  </mesh>
                </>
              )}
            </group>
          );
        })}

        {/* Real Blender tower — featured property + two flanking */}
        {/* Distant background luxury towers — slim hotel towers behind */}
        <HeroTower position={[-46, 0, -160]} scale={0.7} opacity={0.85} />
        <HeroTower position={[34, 0, -170]} scale={0.65} opacity={0.8} />

        {/* Named Vegas landmarks (Bellagio, Caesars, Eiffel, Paris, balloon,
            High Roller, mountains, Strip road) */}
        <VegasLandmarks />

        {/* Desert valley floor */}
        <mesh position={[0, -0.5, -150]} rotation={[-Math.PI / 2, 0, 0]} material={desertGroundMat}>
          <planeGeometry args={[900, 900]} />
        </mesh>
      </group>

      {/* Horizon glow billboard (subtle) */}
      <mesh ref={horizonGlowRef} position={[0, 6, -198]}>
        <planeGeometry args={[700, 80]} />
        <meshBasicMaterial
          color={palette.brass}
          transparent
          opacity={0.0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
