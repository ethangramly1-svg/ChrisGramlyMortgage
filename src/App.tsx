import { useEffect } from "react";
import CanvasRoot from "./components/canvas/CanvasRoot";
import Header from "./components/site/Header";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <CanvasRoot />
    </>
  );
}
