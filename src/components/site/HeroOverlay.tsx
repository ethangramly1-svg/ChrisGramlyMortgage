import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { subscribeScroll, clamp01 } from "../../lib/scroll";
import { sceneSkyLocalProgress } from "../../lib/pageBounds";

/**
 * 2D copy overlay for Scene 1.
 *
 * GSAP timeline whose progress is driven by the scroll context — so
 * scrolling up reverses each reveal.
 *
 * Timing (local progress 0→1):
 *   0.10 → 0.15: pre-title fades in
 *   0.15 → 0.30: per-word headline reveal
 *   0.60 → 0.70: subline fades in
 *   0.70 → 0.95: scroll cue appears
 *   0.95 → 1.00: everything starts to fade out (scene release)
 *
 * The overlay is also visibility:hidden when scrolled past Scene 1
 * so it can't bleed onto the About section below.
 */
export default function HeroOverlay() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [inScene, setInScene] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pre = root.querySelector(".hero-pre");
    const words = root.querySelectorAll(".hero-headline .word");
    const sub = root.querySelector(".hero-subline");
    const cue = document.querySelector(".hero-cue");

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

    tl.fromTo(pre, { opacity: 0, y: 8 }, { opacity: 0.65, y: 0, duration: 0.05 }, 0.10);

    if (words.length) {
      tl.fromTo(
        words,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.15, stagger: 0.15 / Math.max(words.length, 1) },
        0.15
      );
    }

    tl.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.10 }, 0.60);

    if (cue) {
      tl.fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.10 }, 0.70);
    }

    tl.to([pre, ...Array.from(words), sub, cue].filter(Boolean), {
      opacity: 0,
      duration: 0.05,
      ease: "power1.in"
    }, 0.95);

    tlRef.current = tl;

    const unsub = subscribeScroll(({ scrollY, vh }) => {
      const local = sceneSkyLocalProgress(scrollY, vh);
      tl.progress(clamp01(local));
      // Hide the overlay completely once the scene has released
      setInScene(local < 1);
    });

    return () => {
      unsub();
      tl.kill();
    };
  }, []);

  const hidden: React.CSSProperties = inScene
    ? {}
    : { visibility: "hidden", opacity: 0 };

  return (
    <>
      <div className="hero-overlay" ref={rootRef} style={hidden} aria-hidden={!inScene}>
        <div className="hero-copy">
          <p className="hero-pre">Clear Modern Mortgage</p>
          <h1 className="hero-headline">
            <span className="line">
              <span className="word">Some</span>
              <span className="word">homes</span>
              <span className="word">are</span>
              <span className="word">bought.</span>
            </span>
            <span className="line">
              <span className="word italic">Others</span>
              <span className="word italic">are</span>
              <span className="word italic">arrived</span>
              <span className="word italic">at.</span>
            </span>
          </h1>
          <p className="hero-subline">Chris Gramly — your guide for the journey.</p>
        </div>
      </div>

      <div className="hero-cue" style={hidden} aria-hidden="true">
        Scroll to begin
        <span className="arrow">↓</span>
      </div>
    </>
  );
}
