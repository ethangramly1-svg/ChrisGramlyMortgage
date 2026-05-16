import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll, ScrollControls, Scroll, Image as DreiImage, Html } from "@react-three/drei";
import * as THREE from "three";
import { palette } from "../../../lib/palette";

// Import existing UI components
import HeroOverlay from "../../site/HeroOverlay";
import About from "../../site/About";
import Purchase from "../../site/Purchase";
import Refinance from "../../site/Refinance";
import Resources from "../../site/Resources";
import Contact from "../../site/Contact";
import Footer from "../../site/Footer";
import SceneSky from "./SceneSky";

function Gallery() {
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (group.current) {
      // The scroll offset is between 0 and 1
      const offset = scroll.offset;
      // Move the entire group along Z to fly through
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, offset * 200, 0.1);
    }
  });

  return (
    <group ref={group}>
      {/* First image - Interior */}
      <DreiImage url="/assets/penthouse-1.png" position={[0, 0, -20]} scale={[24, 14]} transparent opacity={0.9} />
      
      {/* Second image - Exterior Dusk */}
      <DreiImage url="/assets/penthouse-2.jpg" position={[-12, 0, -60]} scale={[20, 12]} rotation={[0, 0.2, 0]} transparent opacity={0.9} />

      {/* Third image - Balcony Dusk */}
      <DreiImage url="/assets/penthouse-3.jpg" position={[12, 0, -100]} scale={[20, 12]} rotation={[0, -0.2, 0]} transparent opacity={0.9} />

      {/* Fourth image - Aerial City */}
      <DreiImage url="/assets/penthouse-4.png" position={[0, 5, -140]} scale={[26, 16]} rotation={[0.1, 0, 0]} transparent opacity={0.9} />

      {/* Fifth image - Modern Dusk */}
      <DreiImage url="/assets/penthouse-5.png" position={[0, 0, -180]} scale={[30, 18]} transparent opacity={0.9} />
    </group>
  );
}

export default function ScenePenthouses() {
  return (
    <ScrollControls pages={6} damping={0.2}>
      {/* 3D background/gallery that moves with scroll */}
      <Gallery />
      
      {/* Keep the sky/particles from Scene 1 in the background */}
      <SceneSky />

      {/* HTML overlay synchronized with scroll pages */}
      <Scroll html style={{ width: "100vw" }}>
        
        {/* Page 0: Hero */}
        <div style={{ height: "100vh", position: "relative" }}>
          <HeroOverlay />
        </div>

        {/* Page 1: About */}
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px" }}>
            <About />
          </div>
        </div>

        {/* Page 2: Purchase */}
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1200px" }}>
            <Purchase />
          </div>
        </div>

        {/* Page 3: Refinance (Calculator) */}
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1200px" }}>
            <Refinance />
          </div>
        </div>

        {/* Page 4: Resources */}
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px" }}>
            <Resources />
          </div>
        </div>

        {/* Page 5: Contact & Footer */}
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "10vh" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px", margin: "0 auto", marginBottom: "80px" }}>
            <Contact />
          </div>
          <Footer />
        </div>

      </Scroll>
    </ScrollControls>
  );
}
