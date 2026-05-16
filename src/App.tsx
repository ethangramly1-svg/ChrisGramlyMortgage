import { useEffect } from "react";
import { initScroll } from "./lib/scroll";
import CanvasRoot from "./components/canvas/CanvasRoot";
import HeroOverlay from "./components/site/HeroOverlay";
import Header from "./components/site/Header";
import About from "./components/site/About";
import Purchase from "./components/site/Purchase";
import Refinance from "./components/site/Refinance";
import Resources from "./components/site/Resources";
import Contact from "./components/site/Contact";
import Footer from "./components/site/Footer";

export default function App() {
  useEffect(() => {
    initScroll();
  }, []);

  return (
    <>
      <a className="skip-link" href="#about">Skip to content</a>

      <CanvasRoot />
      <HeroOverlay />

      <div id="site">
        <Header />

        {/* Scene 1 occupies the first 100vh — this spacer reserves it */}
        <div id="top" className="hero-spacer" aria-hidden="true" />

        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10vh", paddingBottom: "10vh" }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px" }}>
            <About />
          </div>

          <div className="glass-panel" style={{ width: "90%", maxWidth: "1200px" }}>
            <Purchase />
          </div>

          <div className="glass-panel" style={{ width: "90%", maxWidth: "1200px" }}>
            <Refinance />
          </div>

          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px" }}>
            <Resources />
          </div>

          <div className="glass-panel" style={{ width: "90%", maxWidth: "1000px" }}>
            <Contact />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
