import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { easeInOutCubic, getScroll, smoothstep } from "../../../lib/scroll";
import { sceneSkyLocalProgress } from "../../../lib/pageBounds";
import { palette } from "../../../lib/palette";

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
  // Procedural skyline silhouette (clustered boxes) — placeholder NYC
  // -------------------------------------------------------------------
  const skyline = useMemo(() => {
    type Box = { x: number; y: number; z: number; w: number; h: number; d: number };
    const buildings: Box[] = [];
    const windows: { x: number; y: number; z: number }[] = [];

    // Two parallax rows: a near band and a far band
    const rows = [
      { z: -100, count: 24, hMin: 10, hMax: 38, spreadX: 220, opacity: 1.0 },
      { z: -150, count: 18, hMin: 18, hMax: 60, spreadX: 280, opacity: 0.85 },
      { z: -200, count: 14, hMin: 28, hMax: 80, spreadX: 340, opacity: 0.7 }
    ];

    rows.forEach((row, ri) => {
      for (let i = 0; i < row.count; i++) {
        const w = 4 + Math.random() * 7;
        const h = row.hMin + Math.random() * (row.hMax - row.hMin);
        const d = 4 + Math.random() * 6;
        const x = -row.spreadX / 2 + (i / (row.count - 1)) * row.spreadX + (Math.random() - 0.5) * 6;
        const y = h / 2;
        const z = row.z + (Math.random() - 0.5) * 18;
        buildings.push({ x, y, z, w, h, d });

        // Sprinkle a few lit windows on the front face
        const winCols = Math.max(2, Math.floor(w / 1.4));
        const winRows = Math.max(3, Math.floor(h / 2.4));
        for (let cy = 0; cy < winRows; cy++) {
          for (let cx = 0; cx < winCols; cx++) {
            if (ri === 0 && Math.random() < 0.4) continue;
            if (ri === 1 && Math.random() < 0.6) continue;
            if (ri === 2 && Math.random() < 0.78) continue;
            windows.push({
              x: x - w / 2 + (cx + 0.5) * (w / winCols),
              y: 0.6 + cy * (h / winRows),
              z: z + d / 2 + 0.02
            });
          }
        }
      }
    });

    return { buildings, windows };
  }, []);

  const skylineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x070b18,
    metalness: 0.15,
    roughness: 0.95
  }), []);
  const windowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#e6b35e"),
    transparent: true,
    opacity: 0.85
  }), []);

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

    // Skyline fade-in
    if (skylineRef.current) {
      const v = smoothstep(0.45, 0.85, localRaw);
      skylineRef.current.children.forEach((mesh) => {
        const m = (mesh as THREE.Mesh).material as THREE.Material;
        if ("opacity" in m) {
          (m as THREE.MeshStandardMaterial).transparent = true;
          (m as THREE.MeshStandardMaterial).opacity = v;
        }
      });
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      skyMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      skylineMat.dispose();
      windowMat.dispose();
      cloudMaterial.dispose();
      cloudTexture.dispose();
    };
  }, [skyMaterial, particleGeometry, particleMaterial, skylineMat, windowMat, cloudMaterial, cloudTexture]);

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

      {/* Skyline silhouette */}
      <group ref={skylineRef}>
        {skyline.buildings.map((b, i) => (
          <mesh
            key={`b-${i}`}
            position={[b.x, b.y, b.z]}
            material={skylineMat}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
        ))}
        {skyline.windows.map((w, i) => (
          <mesh
            key={`w-${i}`}
            position={[w.x, w.y, w.z]}
            material={windowMat}
          >
            <planeGeometry args={[0.6, 0.6]} />
          </mesh>
        ))}
        {/* Subtle horizon ground plane to anchor the skyline */}
        <mesh position={[0, -0.5, -150]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[900, 900]} />
          <meshStandardMaterial color="#040711" roughness={1} />
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
