import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Image as DreiImage } from "@react-three/drei";
import * as THREE from "three";
import { getScroll } from "../../../lib/scroll";

import SceneSky from "./SceneSky";

function Gallery() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (group.current) {
      const { progress } = getScroll();
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, progress * 200, 0.1);
    }
  });

  return (
    <group ref={group}>
      {/* First image - Interior */}
      <DreiImage url={`${import.meta.env.BASE_URL}assets/penthouse-1.png`} position={[0, 0, -20]} scale={[24, 14]} transparent opacity={0.9} />
      
      {/* Second image - Exterior Dusk */}
      <DreiImage url={`${import.meta.env.BASE_URL}assets/penthouse-2.jpg`} position={[-12, 0, -60]} scale={[20, 12]} rotation={[0, 0.2, 0]} transparent opacity={0.9} />

      {/* Third image - Balcony Dusk */}
      <DreiImage url={`${import.meta.env.BASE_URL}assets/penthouse-3.jpg`} position={[12, 0, -100]} scale={[20, 12]} rotation={[0, -0.2, 0]} transparent opacity={0.9} />

      {/* Fourth image - Aerial City */}
      <DreiImage url={`${import.meta.env.BASE_URL}assets/penthouse-4.png`} position={[0, 5, -140]} scale={[26, 16]} rotation={[0.1, 0, 0]} transparent opacity={0.9} />

      {/* Fifth image - Modern Dusk */}
      <DreiImage url={`${import.meta.env.BASE_URL}assets/penthouse-5.png`} position={[0, 0, -180]} scale={[30, 18]} transparent opacity={0.9} />
    </group>
  );
}

export default function ScenePenthouses() {
  return (
    <>
      {/* 3D background/gallery that moves with scroll */}
      <Gallery />
      
      {/* Keep the sky/particles from Scene 1 in the background */}
      <SceneSky />
    </>
  );
}
