import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Las Vegas Strip landmarks — procedural Three.js geometry roughly
 * matching the reference photo:
 *   - Bellagio (wide curved hotel mass, lit grid of windows)
 *   - Bellagio fountains (vertical water jets, animated)
 *   - Caesars Palace (white classical facade)
 *   - Eiffel Tower replica (gold lattice tower, observation deck, spire)
 *   - Paris Las Vegas Hotel (wide warm-lit facade)
 *   - Paris hot air balloon decoration (gold sphere)
 *   - High Roller observation wheel (rotating)
 *   - Spring Mountains ridge (silhouette)
 *
 * Everything is positioned with Z negative so the camera (looking from
 * [0, 200, 0] down toward [0, 30, -150]) sees the strip running into
 * the distance.
 */
export default function VegasLandmarks() {
  return (
    <group>
      <Mountains />
      <StripRoad />
      <Bellagio position={[-32, 0, -90]} />
      <BellagioFountains position={[-18, 0, -78]} />
      <Caesars position={[-12, 0, -118]} />
      <EiffelTower position={[6, 0, -88]} scale={1.0} />
      <ParisHotel position={[20, 0, -100]} />
      <ParisBalloon position={[14, 6, -68]} />
      <HighRoller position={[38, 12, -110]} />
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
    const COUNT = 26;
    const SPREAD = 600;
    for (let i = 0; i < COUNT; i++) {
      const x = -SPREAD / 2 + (i / (COUNT - 1)) * SPREAD;
      out.push({
        x,
        h: 24 + r() * 40,
        w: 32 + r() * 26,
        z: -250 - r() * 30
      });
    }
    return out;
  }, []);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x141422, roughness: 1.0, transparent: true, opacity: 0.88
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
   The Strip — illuminated road down the center
   ====================================================================== */
function StripRoad() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x1a1a26,
    transparent: true,
    opacity: 0.85
  }), []);
  return (
    <group>
      <mesh position={[0, 0.05, -120]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
        <planeGeometry args={[14, 220]} />
      </mesh>
      {/* Center line of warm headlight streaks */}
      <mesh position={[0, 0.06, -120]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 220]} />
        <meshBasicMaterial color="#ffb24a" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/* ========================================================================
   Bellagio — wide curved hotel with lit window grid
   ====================================================================== */
function Bellagio({ position }: { position: [number, number, number] }) {
  // Approximate the curved front with a series of slightly rotated slabs
  const segments = useMemo(() => {
    const out: { x: number; rot: number; w: number; h: number; d: number }[] = [];
    const N = 9;
    const arcWidth = 30;
    const radius = 80;
    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1) - 0.5) * 2;
      const x = t * (arcWidth / 2);
      const z = -Math.sqrt(Math.max(0, radius * radius - x * x)) + radius - 0.6;
      const rot = -Math.atan2(x, radius);
      out.push({ x, rot, w: 4.5, h: 16 + (1 - Math.abs(t)) * 4, d: 6 });
      // (Hide z to use as relative depth)
      (out[out.length - 1] as { x: number; z?: number }).z = z;
    }
    return out;
  }, []);

  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2a2520, metalness: 0.1, roughness: 0.85
  }), []);
  const windowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#f0c46a", transparent: true, opacity: 0.95
  }), []);

  return (
    <group position={position}>
      {segments.map((s, i) => {
        const sZ = (s as { z?: number }).z ?? 0;
        return (
          <group key={`bg-${i}`} position={[s.x, 0, sZ]} rotation={[0, s.rot, 0]}>
            <mesh position={[0, s.h / 2, 0]} material={concreteMat}>
              <boxGeometry args={[s.w, s.h, s.d]} />
            </mesh>
            {/* Window grid on the front face */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 4 }).map((__, col) => {
                if (Math.random() < 0.12) return null;
                return (
                  <mesh
                    key={`w-${row}-${col}`}
                    position={[(col - 1.5) * 0.9, 1.4 + row * 1.6, s.d / 2 + 0.02]}
                    material={windowMat}
                  >
                    <planeGeometry args={[0.55, 0.55]} />
                  </mesh>
                );
              })
            )}
          </group>
        );
      })}
    </group>
  );
}

/* ========================================================================
   Bellagio fountains — vertical animated jets
   ====================================================================== */
function BellagioFountains({ position }: { position: [number, number, number] }) {
  const jetsRef = useRef<THREE.Group>(null);
  const jetSpecs = useMemo(() => {
    const out: { x: number; z: number; baseHeight: number; phase: number }[] = [];
    // Cluster of jets in a roughly oval pool
    const N = 14;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const r = 1.5 + (i % 3) * 1.2;
      out.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r * 0.6,
        baseHeight: 6 + (i % 4) * 2.5,
        phase: i * 0.5
      });
    }
    // Plus a tall center jet
    out.push({ x: 0, z: 0, baseHeight: 14, phase: 0 });
    return out;
  }, []);

  const waterMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#e8f1ff",
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  const poolMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0c1830,
    metalness: 0.85,
    roughness: 0.05,
    emissive: new THREE.Color("#0a1a3a"),
    emissiveIntensity: 0.3
  }), []);

  useFrame((state) => {
    if (!jetsRef.current) return;
    const t = state.clock.getElapsedTime();
    jetsRef.current.children.forEach((jet, i) => {
      const spec = jetSpecs[i];
      if (!spec) return;
      const factor = 0.55 + 0.45 * Math.sin(t * 1.8 + spec.phase);
      jet.scale.y = factor;
      // Also slightly pulse opacity for shimmer
      const cyl = jet.children[0] as THREE.Mesh;
      const mat = cyl?.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = 0.4 + 0.25 * factor;
    });
  });

  return (
    <group position={position}>
      {/* Pool */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMat}>
        <planeGeometry args={[18, 12]} />
      </mesh>

      {/* Water jets — each scales on Y to simulate rise/fall */}
      <group ref={jetsRef}>
        {jetSpecs.map((s, i) => (
          <group key={`jet-${i}`} position={[s.x, 0, s.z]}>
            <mesh position={[0, s.baseHeight / 2, 0]} material={waterMat}>
              <cylinderGeometry args={[0.18, 0.35, s.baseHeight, 8]} />
            </mesh>
            {/* Spray top */}
            <mesh position={[0, s.baseHeight + 0.2, 0]} material={waterMat}>
              <sphereGeometry args={[0.55, 8, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ========================================================================
   Caesars Palace — white classical facade
   ====================================================================== */
function Caesars({ position }: { position: [number, number, number] }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x645850, metalness: 0.05, roughness: 0.85,
    emissive: new THREE.Color("#28201a"), emissiveIntensity: 0.7
  }), []);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x9c8866, metalness: 0.2, roughness: 0.5,
    emissive: new THREE.Color("#3a2e1c"), emissiveIntensity: 1.1
  }), []);
  return (
    <group position={position}>
      {/* Main building mass */}
      <mesh position={[0, 11, 0]} material={stoneMat}>
        <boxGeometry args={[22, 22, 8]} />
      </mesh>
      {/* Side wings */}
      <mesh position={[-14, 6, 1]} material={stoneMat}>
        <boxGeometry args={[8, 12, 6]} />
      </mesh>
      <mesh position={[14, 6, 1]} material={stoneMat}>
        <boxGeometry args={[8, 12, 6]} />
      </mesh>
      {/* Front column row (4 columns) */}
      {[-7, -2.3, 2.3, 7].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 4, 4.1]} material={accentMat}>
          <cylinderGeometry args={[0.6, 0.6, 8, 12]} />
        </mesh>
      ))}
      {/* Crown / cornice */}
      <mesh position={[0, 22.5, 0]} material={accentMat}>
        <boxGeometry args={[24, 1.0, 9]} />
      </mesh>
      {/* Lit windows on front face */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 7 }).map((__, col) => {
          if ((row + col) % 3 === 0) return null;
          return (
            <mesh
              key={`cw-${row}-${col}`}
              position={[(col - 3) * 2.6, 13 + row * 1.4, 4.05]}
            >
              <planeGeometry args={[0.7, 0.7]} />
              <meshBasicMaterial color="#f0c46a" transparent opacity={0.9} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ========================================================================
   Eiffel Tower replica — 4 converging legs, observation decks, spire
   ====================================================================== */
function EiffelTower({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6a4e1c, metalness: 0.85, roughness: 0.35,
    emissive: new THREE.Color("#e9b35a"), emissiveIntensity: 1.4
  }), []);
  const goldBright = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xe6b35a, metalness: 0.9, roughness: 0.25,
    emissive: new THREE.Color("#f0c46a"), emissiveIntensity: 2.0
  }), []);

  const TOWER_H = 28;
  // Three-stage profile: legs splay at base, narrow at first deck, very
  // narrow at top deck, then thin spire.
  const stages = [
    { y: 0,           halfW: 3.4 },
    { y: TOWER_H * 0.30, halfW: 1.6 },
    { y: TOWER_H * 0.65, halfW: 0.75 },
    { y: TOWER_H * 0.92, halfW: 0.35 }
  ];

  // Four legs as a series of tapered beams between stages
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

  // Helper: build a thin beam between two points
  function Beam({ from, to, thickness = 0.18, mat }: { from: THREE.Vector3; to: THREE.Vector3; thickness?: number; mat: THREE.Material }) {
    const length = from.distanceTo(to);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dir = to.clone().sub(from).normalize();
    // Compute quaternion that aligns +Y with dir
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
      {/* 4 legs */}
      {legs.map((l, i) => (
        <Beam key={`leg-${i}`} from={l.from} to={l.to} thickness={0.22} mat={goldMat} />
      ))}

      {/* Observation decks — flat platforms */}
      <mesh position={[0, stages[1].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[1].halfW * 2.6, 0.5, stages[1].halfW * 2.6]} />
      </mesh>
      <mesh position={[0, stages[2].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[2].halfW * 2.5, 0.4, stages[2].halfW * 2.5]} />
      </mesh>
      <mesh position={[0, stages[3].y, 0]} material={goldBright}>
        <boxGeometry args={[stages[3].halfW * 2.4, 0.3, stages[3].halfW * 2.4]} />
      </mesh>

      {/* Horizontal bracing arches between legs at deck heights */}
      {stages.slice(0, -1).map((s, i) => (
        <group key={`brace-${i}`} position={[0, s.y + 0.05, 0]}>
          <mesh material={goldMat}>
            <torusGeometry args={[s.halfW * 1.05, 0.12, 4, 12]} />
          </mesh>
        </group>
      ))}

      {/* Top spire */}
      <mesh position={[0, TOWER_H, 0]} material={goldBright}>
        <coneGeometry args={[0.18, 4.0, 8]} />
      </mesh>
      <mesh position={[0, TOWER_H + 2.4, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color="#fff2b0" />
      </mesh>
    </group>
  );
}

/* ========================================================================
   Paris Las Vegas — warm-lit hotel facade
   ====================================================================== */
function ParisHotel({ position }: { position: [number, number, number] }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x584030, metalness: 0.1, roughness: 0.8,
    emissive: new THREE.Color("#3a280f"), emissiveIntensity: 0.6
  }), []);
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#f0c46a", transparent: true, opacity: 0.92
  }), []);
  const ROWS = 9;
  const COLS = 5;
  return (
    <group position={position}>
      <mesh position={[0, 9, 0]} material={stoneMat}>
        <boxGeometry args={[12, 18, 6]} />
      </mesh>
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((__, col) => {
          if (Math.random() < 0.15) return null;
          return (
            <mesh
              key={`pw-${row}-${col}`}
              position={[(col - (COLS - 1) / 2) * 2, 2 + row * 1.6, 3.05]}
              material={winMat}
            >
              <planeGeometry args={[0.7, 0.7]} />
            </mesh>
          );
        })
      )}
      {/* Rounded roof element */}
      <mesh position={[0, 19, 0]} material={stoneMat}>
        <cylinderGeometry args={[2, 3, 3, 8]} />
      </mesh>
    </group>
  );
}

/* ========================================================================
   Paris balloon — gold sphere decoration with hot-air-balloon stripes
   ====================================================================== */
function ParisBalloon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main balloon */}
      <mesh>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshStandardMaterial
          color="#cc1c2a"
          metalness={0.4}
          roughness={0.4}
          emissive={new THREE.Color("#9a1422")}
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial
          color="#f0c46a"
          metalness={0.9}
          roughness={0.2}
          emissive={new THREE.Color("#e8b85a")}
          emissiveIntensity={1.4}
        />
      </mesh>
      {/* Bottom basket */}
      <mesh position={[0, -2.6, 0]}>
        <boxGeometry args={[1.4, 0.7, 1.4]} />
        <meshStandardMaterial color="#3a281a" metalness={0.2} roughness={0.7} />
      </mesh>
      {/* 4 thin support lines (cylinders) between balloon and basket */}
      {[
        [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]
      ].map(([x, z], i) => (
        <mesh key={`s-${i}`} position={[x, -1.5, z]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
          <meshStandardMaterial color="#9a7830" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ========================================================================
   High Roller — 550-foot observation wheel, slowly rotating
   ====================================================================== */
function HighRoller({ position }: { position: [number, number, number] }) {
  const wheelRef = useRef<THREE.Group>(null);

  const cabinPositions = useMemo(() => {
    const out: { angle: number }[] = [];
    const N = 28;
    for (let i = 0; i < N; i++) {
      out.push({ angle: (i / N) * Math.PI * 2 });
    }
    return out;
  }, []);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a3a4a, metalness: 0.6, roughness: 0.3
  }), []);
  const cabinMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#7adfff", transparent: true, opacity: 0.9
  }), []);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += delta * 0.05;
    }
  });

  const RADIUS = 11;

  return (
    <group position={position}>
      {/* Support pylons (two A-frames behind the wheel) */}
      <mesh position={[-3.5, RADIUS / 2, 0]} rotation={[0, 0, 0.18]} material={frameMat}>
        <cylinderGeometry args={[0.18, 0.3, RADIUS + 4, 8]} />
      </mesh>
      <mesh position={[3.5, RADIUS / 2, 0]} rotation={[0, 0, -0.18]} material={frameMat}>
        <cylinderGeometry args={[0.18, 0.3, RADIUS + 4, 8]} />
      </mesh>

      {/* Rotating wheel group */}
      <group ref={wheelRef} position={[0, RADIUS, -0.4]}>
        {/* Rim — single torus */}
        <mesh material={frameMat}>
          <torusGeometry args={[RADIUS, 0.18, 6, 64]} />
        </mesh>
        <mesh material={frameMat} position={[0, 0, -0.4]}>
          <torusGeometry args={[RADIUS, 0.18, 6, 64]} />
        </mesh>
        {/* Hub */}
        <mesh material={frameMat}>
          <cylinderGeometry args={[0.45, 0.45, 1.2, 12]} />
        </mesh>

        {/* Spokes — thin bars from hub to rim */}
        {cabinPositions.map((c, i) => (
          <mesh
            key={`spk-${i}`}
            rotation={[0, 0, c.angle]}
            material={frameMat}
          >
            <cylinderGeometry args={[0.04, 0.04, RADIUS, 6]} />
          </mesh>
        ))}

        {/* Cabins — small lit spheres around the rim */}
        {cabinPositions.map((c, i) => (
          <mesh
            key={`cab-${i}`}
            position={[Math.cos(c.angle + Math.PI / 2) * RADIUS, Math.sin(c.angle + Math.PI / 2) * RADIUS, 0]}
            material={cabinMat}
          >
            <sphereGeometry args={[0.42, 10, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
