import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { subscribeScroll, clamp01 } from "../../lib/scroll";
import { sceneSkyLocalProgress } from "../../lib/pageBounds";

/**
 * 2D copy overlay for Scene 1.
 *
 * The pre-title and headline are visible *immediately* on page load —
 * no blank screen waiting for the user to scroll. The subline and the
 * scroll cue fade in as the user scrolls, then everything fades out
 * near the end so the next section can take over.
 *
 * Driven by the shared scroll context, so scrolling up reverses each
 * stage. Hidden entirely once Scene 1 releases.
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

    // Set the initial state by hand: pre-title + headline are visible
    // the moment the page loads. GSAP timeline only handles the *fade
    // out* near the end so scroll-up still reverses everything.
    gsap.set(pre, { opacity: 0.7, y: 0 });
    gsap.set(words, { opacity: 1, y: 0, scale: 1 });
    gsap.set(sub, { opacity: 0, y: 12 });
    gsap.set(cue, { opacity: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

    // 0.45 → 0.62: subline fades in
    tl.to(sub, { opacity: 1, y: 0, duration: 0.17 }, 0.45);

    // 0.62 → 0.85: scroll cue fades in
    tl.to(cue, { opacity: 1, duration: 0.1 }, 0.62);

    // 0.9 → 1.0: everything fades out as the scene releases
    tl.to([pre, ...Array.from(words), sub, cue].filter(Boolean), {
      opacity: 0,
      duration: 0.1,
      ease: "power1.in"
    }, 0.90);

    tlRef.current = tl;

    const unsub = subscribeScroll(({ scrollY, vh }) => {
      const local = sceneSkyLocalProgress(scrollY, vh);
      tl.progress(clamp01(local));
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
          <p className="hero-pre">Clear Modern Mortgage &nbsp;·&nbsp; Las Vegas</p>
          <h1 className="hero-headline">
            <span className="line">
              <span className="word">Vegas</span>
              <span className="word">to</span>
              <span className="word">the</span>
              <span className="word">valley.</span>
            </span>
            <span className="line">
              <span className="word italic">A</span>
              <span className="word italic">clear</span>
              <span className="word italic">path</span>
              <span className="word italic">home.</span>
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
