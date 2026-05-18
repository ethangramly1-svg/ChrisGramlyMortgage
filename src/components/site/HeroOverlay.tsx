import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "../../lib/gsap";
import { subscribeScroll, clamp01 } from "../../lib/scroll";
import { sceneSkyLocalProgress } from "../../lib/pageBounds";

/**
 * 2D copy overlay for Scene 1.
 *
 * Timeline progress is driven by scroll — scroll up reverses everything.
 *
 * Timing (local progress 0 → 1):
 *   0.05 → 0.12 : pre-title slides up
 *   0.12 → 0.42 : headline chars curtain-reveal (SplitText)
 *   0.42 → 0.50 : decorative rule draws in from center
 *   0.50 → 0.62 : subline fades up
 *   0.62 → 0.72 : CTA button appears
 *   0.72 → 0.82 : scroll cue appears
 *   0.90 → 1.00 : everything fades out as scene releases
 */
export default function HeroOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = rootRef.current!;

    const pre     = root.querySelector<HTMLElement>(".hero-pre");
    const line1   = root.querySelector<HTMLElement>(".hero-line-1");
    const line2   = root.querySelector<HTMLElement>(".hero-line-2");
    const rule    = root.querySelector<HTMLElement>(".hero-rule");
    const sub     = root.querySelector<HTMLElement>(".hero-subline");
    const actions = root.querySelector<HTMLElement>(".hero-actions");
    const cue     = document.querySelector<HTMLElement>(".hero-cue");

    // Split headline into chars for curtain reveal
    const split1 = line1 ? new SplitText(line1, { type: "chars" }) : null;
    const split2 = line2 ? new SplitText(line2, { type: "chars" }) : null;
    const chars  = [...(split1?.chars ?? []), ...(split2?.chars ?? [])];

    const tl = gsap.timeline({ paused: true });

    // Pre-title
    tl.fromTo(pre,
      { opacity: 0, y: 10 },
      { opacity: 0.65, y: 0, duration: 0.07, ease: "power2.out" },
      0.05
    );

    // Headline — chars slide up from below the overflow clip
    if (chars.length) {
      tl.fromTo(chars,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.22, stagger: 0.30 / chars.length, ease: "power3.out" },
        0.12
      );
    }

    // Decorative rule — expands from center
    tl.fromTo(rule,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.08, ease: "power2.inOut" },
      0.42
    );

    // Subline
    tl.fromTo(sub,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.10, ease: "power2.out" },
      0.52
    );

    // CTA
    tl.fromTo(actions,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.10, ease: "power2.out" },
      0.62
    );

    // Scroll cue
    if (cue) {
      tl.fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.10 }, 0.72);
    }

    // Scene-release fade-out
    const all = [pre, rule, sub, actions, cue, ...chars].filter(Boolean);
    tl.to(all, { opacity: 0, duration: 0.10, ease: "power1.in" }, 0.90);

    const unsub = subscribeScroll(({ scrollY, vh }) => {
      tl.progress(clamp01(sceneSkyLocalProgress(scrollY, vh)));
    });

    return () => {
      unsub();
      split1?.revert();
      split2?.revert();
    };
  }, { scope: rootRef });

  return (
    <>
      <div className="hero-overlay" ref={rootRef}>
        <div className="hero-copy">
          <p className="hero-pre">Clear Modern Mortgage</p>

          <h1 className="hero-headline">
            <span className="hero-line-1">Some homes are bought.</span>
            <span className="hero-line-2">Others are arrived at.</span>
          </h1>

          <div className="hero-rule" aria-hidden="true" />

          <p className="hero-subline">
            Chris Gramly — your guide for the journey.
          </p>

          <div className="hero-actions">
            <a
              href="https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now"
              className="btn dark-ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply Now
            </a>
            <a href="#about" className="hero-learn">
              Learn More
            </a>
          </div>
        </div>
      </div>

      <div className="hero-cue" aria-hidden="true">
        Scroll to begin
        <span className="arrow">↓</span>
      </div>
    </>
  );
}
