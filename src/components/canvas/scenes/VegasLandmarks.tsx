import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Las Vegas Strip — procedural Three.js landmarks matching the reference
 * photo (Bellagio + fountains, Caesars, Eiffel Tower replica, Paris
 * Hotel + balloon, Wynn/Encore gold tower, High Roller wheel,
 * neon-lit Strip signs, Spring Mountains).
 *
 * All landmarks are positioned so the Scene 1 camera end-frame (looking
 * from ~[0, 80, 30] toward [0, 30, -150]) reads as a "cinematic Strip
 * shot from above" — Bellagio left, Eiffel center-right, balloon
 * foreground, High Roller far right, Caesars + Wynn back.
 */
export default function VegasLandmarks() {
  return (
    <group>
      <Mountains />
      <StripRoad />
      <NeonSigns />
      <Bellagio       position={[-26, 0, -82]} />
      <BellagioFountains position={[-12, 0, -68]} />
      <Caesars        position={[-8,  0, -112]} />
      <WynnTower      position={[-38, 0, -125]} />
      <EiffelTower    position={[12,  0, -80]} scale={1.5} />
      <ParisHotel     position={[26,  0, -98]} />
      <ParisBalloon   position={[10,  10, -55]} scale={1.15} />
      <HighRoller     position={[42,  0, -110]} scale={1.2} />
      <MGMTower       position={[36,  0, -150]} />
    </group>
  );
}

/* ========================================================================
   Mountains — distant ridge silhouette
   ====================================================================== */
function Mountains() {
  const peaks = useMemo(() => {
    const out: { x: number; h: number; w: number; z: number }[] = [];
    let s = 23;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const COUNT = 28;
    const SPREAD = 700;
    for (let i = 0; i < COUNT; i++) {
      const x = -SPREAD / 2 + (i / (COUNT - 1)) * SPREAD;
      out.push({
        x,
        h: 30 + r() * 50,
        w: 38 + r() * 30,
        z: -260 - r() * 30
      });
    }
    return out;
  }, []);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x171829,
    roughness: 1.0,
    metalness: 0,
    transparent: true,
    opacity: 0.92
  }), []);

  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={`mt-${i}`} position={[p.x, p.h / 2 - 3, p.z]} material={mat} rotation={[0, Math.PI / 5, 0]}>
          <coneGeometry args={[p.w / 2, p.h, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/* ========================================================================
   The Strip — illuminated road down the center with car-light streaks
   ====================================================================== */
function StripRoad() {
  const asphalt = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x18181f,
    roughness: 0.55,
    metalness: 0.2,
    emissive: new THREE.Color("#1a1812"),
    emissiveIntensity: 0.18
  }), []);
  // Warm "headlight" lane (going away from camera)
  const headlights = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffd680",
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);
  // Red "taillight" lane (coming toward camera)
  const taillights = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ff4030",
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  return (
    <group>
      {/* Asphalt */}
      <mesh position={[0, 0.04, -120]} rotation={[-Math.PI / 2, 0, 0]} material={asphalt}>
        <planeGeometry args={[18, 260]} />
      </mesh>
      {/* Two lanes of streaks */}
      <mesh position={[-2.2, 0.07, -120]} rotation={[-Math.PI / 2, 0, 0]} material={headlights}>
        <planeGeometry args={[1.4, 240]} />
      </mesh>
      <mesh position={[2.2, 0.07, -120]} rotation={[-Math.PI / 2, 0, 0]} material={taillights}>
        <planeGeometry args={[1.4, 240]} />
      </mesh>
    </group>
  );
}

/* ========================================================================
   Neon ground signs along the Strip
   ====================================================================== */
function NeonSigns() {
  // Each sign is a small rectangle plate of intense color, positioned
  // close to the camera-side of buildings to read as neon marquees.
  const signs = useMemo(() => ([
    { x: -22, y: 3, z: -62,  w: 4, h: 1.6, color: "#ff2a6d" },  // hot pink
    { x: -10, y: 2.4, z: -55, w: 3.2, h: 1.2, color: "#5cd6ff" }, // cyan
    { x: 6,   y: 3.8, z: -58, w: 4.5, h: 1.8, color: "#c560ff" }, // purple
    { x: 22,  y: 2.6, z: -64, w: 3.6, h: 1.3, color: "#ff8f30" }, // orange
    { x: 32,  y: 4.5, z: -80, w: 5,   h: 2.2, color: "#3cffaf" }, // green
    { x: -34, y: 3.2, z: -75, w: 3.6, h: 1.4, color: "#ffd040" }, // yellow
    { x: 18,  y: 5.5, z: -72, w: 4.0, h: 2.0, color: "#ff5a7a" }  // pink
  ]), []);

  return (
    <group>
      {signs.map((s, i) => (
        <mesh key={`ns-${i}`} position={[s.x, s.y, s.z]}>
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* A handful of low scattered point-light dots — distant neon signs */}
      {Array.from({ length: 36 }).map((_, i) => {
        const x = -90 + Math.random() * 180;
        const y = 1 + Math.random() * 6;
        const z = -55 - Math.random() * 90;
        const colors = ["#ff2a6d", "#5cd6ff", "#c560ff", "#ff8f30", "#3cffaf", "#ffd040"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <mesh key={`np-${i}`} position={[x, y, z]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ========================================================================
   Bellagio — cream Italian-style curved hotel, lit window grid
   ====================================================================== */
function Bellagio({ position }: { position: [number, number, number] }) {
  // Approximate the curved front with a series of slightly rotated slabs
  const segments = useMemo(() => {
    const out: { x: number; rot: number; w: number; h: number; d: number; z: number }[] = [];
    const N = 11;
    const arcWidth = 36;
    const radius = 90;
    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1) - 0.5) * 2;
      const x = t * (arcWidth / 2);
      const z = -Math.sqrt(Math.max(0, radius * radius - x * x)) + radius - 0.6;
      const rot = -Math.atan2(x, radius);
      // Center segments are taller (main tower mass)
      const h = 22 + (1 - Math.abs(t)) * 8;
      out.push({ x, rot, w: 4.8, h, d: 7, z });
    }
    return out;
  }, []);

  // Cream / warm-beige hotel facade
  const facadeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xb9a280,
    metalness: 0.05,
    roughness: 0.75,
    emissive: new THREE.Color("#5a4a2e"),
    emissiveIntensity: 0.85
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffd684", transparent: true, opacity: 0.95
  }), []);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4a3220,
    metalness: 0.4,
    roughness: 0.5,
    emissive: new THREE.Color("#2a1d10"),
    emissiveIntensity: 0.3
  }), []);

  return (
    <group position={position}>
      {segments.map((s, i) => (
        <group key={`bg-${i}`} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
          {/* Main slab */}
          <mesh position={[0, s.h / 2, 0]} material={facadeMat}>
            <boxGeometry args={[s.w, s.h, s.d]} />
          </mesh>
          {/* Sloped roof element */}
          <mesh position={[0, s.h + 0.4, 0]} material={roofMat}>
            <boxGeometry args={[s.w * 1.04, 0.8, s.d * 1.04]} />
          </mesh>
          {/* Window grid on the front face */}
          {Array.from({ length: Math.floor(s.h / 1.8) }).map((_, row) =>
            Array.from({ length: 5 }).map((__, col) => {
              if ((row + col + i) % 6 === 0) return null;
              return (
                <mesh
                  key={`w-${row}-${col}`}
                  position={[(col - 2) * 0.9, 1.5 + row * 1.7, s.d / 2 + 0.02]}
                  material={winMat}
                >
                  <planeGeometry args={[0.55, 0.55]} />
                </mesh>
              );
            })
          )}
        </group>
      ))}
    </group>
  );
}

/* ========================================================================
   Bellagio fountains — vertical animated water jets, cycling underlights
   ====================================================================== */
function BellagioFountains({ position }: { position: [number, number, number] }) {
  const jetsRef = useRef<THREE.Group>(null);
  const poolLightRef = useRef<THREE.MeshStandardMaterial>(null);

  const jetSpecs = useMemo(() => {
    const out: { x: number; z: number; baseHeight: number; phase: number }[] = [];
    // Tall center jet
    out.push({ x: 0, z: 0, baseHeight: 18, phase: 0 });
    // Inner ring
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      out.push({
        x: Math.cos(angle) * 3.0,
        z: Math.sin(angle) * 1.6,
        baseHeight: 8 + (i % 3) * 3,
        phase: i * 0.4
      });
    }
    // Outer ring
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + 0.2;
      out.push({
        x: Math.cos(angle) * 5.5,
        z: Math.sin(angle) * 2.6,
        baseHeight: 5 + (i % 4) * 2,
        phase: i * 0.32 + 1.2
      });
    }
    return out;
  }, []);

  const waterMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#f0f8ff",
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  const poolMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0c2240,
    metalness: 0.9,
    roughness: 0.08,
    emissive: new THREE.Color("#2c70b0"),
    emissiveIntensity: 0.8
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (jetsRef.current) {
      jetsRef.current.children.forEach((jet, i) => {
        const spec = jetSpecs[i];
        if (!spec) return;
        const factor = 0.45 + 0.55 * Math.sin(t * 1.6 + spec.phase);
        jet.scale.y = factor;
      });
    }
    if (poolLightRef.current) {
      // Cycle pool light color across cyan → magenta → gold
      const h = (Math.sin(t * 0.25) + 1) * 0.5 * 0.3 + 0.55;
      poolLightRef.current.emissive.setHSL(h, 0.7, 0.4);
    }
  });

  return (
    <group position={position}>
      {/* Glowing pool */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <primitive object={poolMat} ref={poolLightRef} attach="material" />
      </mesh>

      {/* Water jets */}
      <group ref={jetsRef}>
        {jetSpecs.map((s, i) => (
          <group key={`jet-${i}`} position={[s.x, 0, s.z]}>
            <mesh position={[0, s.baseHeight / 2, 0]} material={waterMat}>
              <cylinderGeometry args={[0.2, 0.4, s.baseHeight, 8]} />
            </mesh>
            <mesh position={[0, s.baseHeight + 0.3, 0]} material={waterMat}>
              <sphereGeometry args={[0.65, 10, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ========================================================================
   Caesars Palace — bright white classical facade
   ====================================================================== */
function Caesars({ position }: { position: [number, number, number] }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a6f5a,
    metalness: 0.05,
    roughness: 0.7,
    emissive: new THREE.Color("#3a3020"),
    emissiveIntensity: 1.1
  }), []);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xc6a878,
    metalness: 0.4,
    roughness: 0.35,
    emissive: new THREE.Color("#5a4424"),
    emissiveIntensity: 1.6
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#f4d590", transparent: true, opacity: 0.95
  }), []);

  return (
    <group position={position}>
      {/* Main building mass */}
      <mesh position={[0, 14, 0]} material={stoneMat}>
        <boxGeometry args={[26, 28, 10]} />
      </mesh>
      {/* Side wings */}
      <mesh position={[-16, 8, 1]} material={stoneMat}>
        <boxGeometry args={[10, 16, 7]} />
      </mesh>
      <mesh position={[16, 8, 1]} material={stoneMat}>
        <boxGeometry args={[10, 16, 7]} />
      </mesh>
      {/* Front column row */}
      {[-9, -3, 3, 9].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 5, 5.1]} material={accentMat}>
          <cylinderGeometry args={[0.7, 0.7, 10, 12]} />
        </mesh>
      ))}
      {/* Crown */}
      <mesh position={[0, 28.5, 0]} material={accentMat}>
        <boxGeometry args={[28, 1.0, 11]} />
      </mesh>
      {/* Dome on top */}
      <mesh position={[0, 30.8, 0]} material={accentMat}>
        <sphereGeometry args={[2.4, 16, 12]} />
      </mesh>
      {/* Lit windows */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          if ((row + col) % 5 === 0) return null;
          return (
            <mesh
              key={`cw-${row}-${col}`}
              position={[(col - 3.5) * 2.6, 16 + row * 1.5, 5.05]}
              material={winMat}
            >
              <planeGeometry args={[0.7, 0.7]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ========================================================================
   Wynn / Encore — slim gold-bronze tower with curved front
   ====================================================================== */
function WynnTower({ position }: { position: [number, number, number] }) {
  const bronzeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6a4a18,
    metalness: 0.85,
    roughness: 0.25,
    emissive: new THREE.Color("#c08a32"),
    emissiveIntensity: 1.6
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffd070", transparent: true, opacity: 0.92
  }), []);

  return (
    <group position={position}>
      <mesh position={[0, 22, 0]} material={bronzeMat}>
        <boxGeometry args={[7, 44, 8]} />
      </mesh>
      {/* Subtle curved front via two slimmer slabs */}
      <mesh position={[-4, 22, 1]} material={bronzeMat} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[3, 44, 4]} />
      </mesh>
      <mesh position={[4, 22, 1]} material={bronzeMat} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[3, 44, 4]} />
      </mesh>
      {/* Window grid */}
      {Array.from({ length: 18 }).map((_, row) =>
        Array.from({ length: 3 }).map((__, col) => {
          if ((row + col) % 4 === 0) return null;
          return (
            <mesh
              key={`ww-${row}-${col}`}
              position={[(col - 1) * 1.8, 3 + row * 2.2, 4.05]}
              material={winMat}
            >
              <planeGeometry args={[0.65, 0.65]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ========================================================================
   MGM Grand — back-of-shot tall green-tinged tower
   ====================================================================== */
function MGMTower({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1c3a2a,
    metalness: 0.65,
    roughness: 0.3,
    emissive: new THREE.Color("#2a7c4c"),
    emissiveIntensity: 1.1
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#a8f0d0", transparent: true, opacity: 0.85
  }), []);
  return (
    <group position={position}>
      <mesh position={[0, 24, 0]} material={mat}>
        <boxGeometry args={[10, 48, 9]} />
      </mesh>
      {Array.from({ length: 14 }).map((_, row) =>
        Array.from({ length: 4 }).map((__, col) => {
          if ((row + col) % 3 === 0) return null;
          return (
            <mesh
              key={`mw-${row}-${col}`}
              position={[(col - 1.5) * 2.2, 4 + row * 3, 4.55]}
              material={winMat}
            >
              <planeGeometry args={[0.8, 0.8]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ========================================================================
   Eiffel Tower replica — 4 converging legs, decks, spire
   ====================================================================== */
function EiffelTower({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x8a6a28,
    metalness: 0.85,
    roughness: 0.35,
    emissive: new THREE.Color("#ffc868"),
    emissiveIntensity: 2.2
  }), []);
  const goldBright = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xf0bf60,
    metalness: 0.9,
    roughness: 0.2,
    emissive: new THREE.Color("#ffd080"),
    emissiveIntensity: 3.0
  }), []);
  const TOWER_H = 32;
  const stages = [
    { y: 0,           halfW: 3.8 },
    { y: TOWER_H * 0.30, halfW: 1.8 },
    { y: TOWER_H * 0.65, halfW: 0.85 },
    { y: TOWER_H * 0.92, halfW: 0.40 }
  ];
  const legs: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  for (let leg = 0; leg < 4; leg++) {
    const sx = leg < 2 ? 1 : -1;
    const sz = (leg % 2 === 0) ? 1 : -1;
    for (let i = 0; i < stages.length - 1; i++) {
      const a = stages[i], b = stages[i + 1];
      legs.push({
        from: new THREE.Vector3(sx * a.halfW, a.y, sz * a.halfW),
        to: new THREE.Vector3(sx * b.halfW, b.y, sz * b.halfW)
      });
    }
  }
  function Beam({ from, to, thickness = 0.18, mat }: { from: THREE.Vector3; to: THREE.Vector3; thickness?: number; mat: THREE.Material }) {
    const length = from.distanceTo(to);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dir = to.clone().sub(from).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return (
      <mesh position={mid.toArray()} quaternion={quat} material={mat}>
        <cylinderGeometry args={[thickness, thickness, length, 6]} />
      </mesh>
    );
  }
  return (
    <group position={position} scale={scale}>
      {/* Legs */}
      {legs.map((l, i) => (
        <Beam key={`leg-${i}`} from={l.from} to={l.to} thickness={0.26} mat={goldMat} />
      ))}
      {/* Observation decks */}
      <mesh position={[0, stages[1].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[1].halfW * 2.8, 0.55, stages[1].halfW * 2.8]} />
      </mesh>
      <mesh position={[0, stages[2].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[2].halfW * 2.6, 0.45, stages[2].halfW * 2.6]} />
      </mesh>
      <mesh position={[0, stages[3].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[3].halfW * 2.4, 0.35, stages[3].halfW * 2.4]} />
      </mesh>
      {/* Horizontal bracing arches */}
      {stages.slice(0, -1).map((s, i) => (
        <group key={`brace-${i}`} position={[0, s.y + 0.05, 0]}>
          <mesh material={goldMat}>
            <torusGeometry args={[s.halfW * 1.1, 0.14, 4, 14]} />
          </mesh>
        </group>
      ))}
      {/* Spire */}
      <mesh position={[0, TOWER_H, 0]} material={goldBright}>
        <coneGeometry args={[0.22, 5.0, 8]} />
      </mesh>
      <mesh position={[0, TOWER_H + 3.0, 0]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshBasicMaterial color="#fff2b0" />
      </mesh>
    </group>
  );
}

/* ========================================================================
   Paris Las Vegas hotel — warm-lit facade with mansard roof
   ====================================================================== */
function ParisHotel({ position }: { position: [number, number, number] }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7e5630,
    metalness: 0.1,
    roughness: 0.75,
    emissive: new THREE.Color("#4a2810"),
    emissiveIntensity: 0.95
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffd080", transparent: true, opacity: 0.93
  }), []);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2a1810,
    metalness: 0.5,
    roughness: 0.5,
    emissive: new THREE.Color("#1a0e08"),
    emissiveIntensity: 0.4
  }), []);
  return (
    <group position={position}>
      {/* Main hotel mass */}
      <mesh position={[0, 14, 0]} material={stoneMat}>
        <boxGeometry args={[16, 28, 8]} />
      </mesh>
      {/* Mansard roof */}
      <mesh position={[0, 28.8, 0]} material={roofMat}>
        <boxGeometry args={[16.6, 1.8, 8.6]} />
      </mesh>
      {/* Tons of warm-lit windows */}
      {Array.from({ length: 13 }).map((_, row) =>
        Array.from({ length: 7 }).map((__, col) => {
          if ((row + col) % 6 === 0) return null;
          return (
            <mesh
              key={`pw-${row}-${col}`}
              position={[(col - 3) * 2.0, 3 + row * 1.8, 4.05]}
              material={winMat}
            >
              <planeGeometry args={[0.7, 0.7]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ========================================================================
   Paris hot-air balloon decoration — colorful sphere with basket
   ====================================================================== */
function ParisBalloon({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  // Animate gentle bob
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.6) * 0.18;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Red main balloon body */}
      <mesh>
        <sphereGeometry args={[3.0, 28, 28]} />
        <meshStandardMaterial
          color="#c0182a"
          metalness={0.5}
          roughness={0.3}
          emissive={new THREE.Color("#a01024")}
          emissiveIntensity={1.4}
        />
      </mesh>
      {/* Gold vertical stripe panels — 8 thin slices */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh key={`st-${i}`} rotation={[0, ang, 0]} position={[0, 0, 0]}>
            <torusGeometry args={[3.02, 0.05, 4, 16, Math.PI]} />
            <meshStandardMaterial
              color="#f0c46a"
              metalness={0.9}
              roughness={0.2}
              emissive={new THREE.Color("#ffd380")}
              emissiveIntensity={1.8}
            />
          </mesh>
        );
      })}
      {/* Top gold cap */}
      <mesh position={[0, 3.0, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial
          color="#f0c46a"
          metalness={0.95}
          roughness={0.15}
          emissive={new THREE.Color("#ffd680")}
          emissiveIntensity={2.4}
        />
      </mesh>
      {/* Basket */}
      <mesh position={[0, -3.5, 0]}>
        <boxGeometry args={[1.8, 0.9, 1.8]} />
        <meshStandardMaterial color="#3a281a" metalness={0.2} roughness={0.7} />
      </mesh>
      {/* Ropes */}
      {[
        [0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]
      ].map(([x, z], i) => (
        <mesh key={`rope-${i}`} position={[x, -2.0, z]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
          <meshStandardMaterial color="#b89045" metalness={0.7} roughness={0.4} emissive={new THREE.Color("#9c7830")} emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ========================================================================
   High Roller — observation wheel, slowly rotating, color-cycling cabins
   ====================================================================== */
function HighRoller({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const wheelRef = useRef<THREE.Group>(null);
  const cabinMats = useRef<THREE.MeshBasicMaterial[]>([]);

  const cabinPositions = useMemo(() => {
    const out: { angle: number }[] = [];
    const N = 28;
    for (let i = 0; i < N; i++) {
      out.push({ angle: (i / N) * Math.PI * 2 });
    }
    return out;
  }, []);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a3a4a,
    metalness: 0.7,
    roughness: 0.3,
    emissive: new THREE.Color("#1a1a26"),
    emissiveIntensity: 0.5
  }), []);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += delta * 0.06;
    }
    // Color cycle on cabins — staggered hue
    const t = performance.now() * 0.0005;
    cabinMats.current.forEach((m, i) => {
      if (!m) return;
      const h = ((t + i * 0.06) % 1);
      m.color.setHSL(h, 0.85, 0.65);
    });
  });

  const RADIUS = 14;

  return (
    <group position={position} scale={scale}>
      {/* Support pylons */}
      <mesh position={[-4.5, RADIUS / 2, 0]} rotation={[0, 0, 0.18]} material={frameMat}>
        <cylinderGeometry args={[0.22, 0.36, RADIUS + 6, 8]} />
      </mesh>
      <mesh position={[4.5, RADIUS / 2, 0]} rotation={[0, 0, -0.18]} material={frameMat}>
        <cylinderGeometry args={[0.22, 0.36, RADIUS + 6, 8]} />
      </mesh>

      {/* Rotating wheel */}
      <group ref={wheelRef} position={[0, RADIUS, -0.4]}>
        {/* Rim front + back */}
        <mesh material={frameMat}>
          <torusGeometry args={[RADIUS, 0.22, 6, 80]} />
        </mesh>
        <mesh material={frameMat} position={[0, 0, -0.5]}>
          <torusGeometry args={[RADIUS, 0.22, 6, 80]} />
        </mesh>
        {/* Hub */}
        <mesh material={frameMat}>
          <cylinderGeometry args={[0.55, 0.55, 1.4, 16]} />
        </mesh>
        {/* Spokes */}
        {cabinPositions.map((c, i) => (
          <mesh key={`spk-${i}`} rotation={[0, 0, c.angle]} material={frameMat}>
            <cylinderGeometry args={[0.05, 0.05, RADIUS, 6]} />
          </mesh>
        ))}
        {/* Lit cabins — color cycles per cabin */}
        {cabinPositions.map((c, i) => (
          <mesh
            key={`cab-${i}`}
            position={[Math.cos(c.angle + Math.PI / 2) * RADIUS, Math.sin(c.angle + Math.PI / 2) * RADIUS, 0]}
          >
            <sphereGeometry args={[0.55, 12, 12]} />
            <meshBasicMaterial
              ref={(m) => { if (m) cabinMats.current[i] = m; }}
              color="#7adfff"
              transparent
              opacity={0.95}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
