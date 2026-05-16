import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A shared, subscribable scroll model.
 *
 * - One ScrollTrigger covers <main> end-to-end.
 * - Subscribers are called every frame *only* while scroll is changing,
 *   never inside React render. Use this from `useFrame` or from a GSAP
 *   timeline's `progress()`.
 */

type Listener = (state: ScrollState) => void;

export type ScrollState = {
  /** 0 → 1 across the entire scrollable page */
  progress: number;
  /** raw scrollY in px */
  scrollY: number;
  /** current viewport height */
  vh: number;
};

const listeners = new Set<Listener>();
const state: ScrollState = {
  progress: 0,
  scrollY: 0,
  vh: typeof window !== "undefined" ? window.innerHeight : 0
};

let initialized = false;
let trigger: ScrollTrigger | null = null;
let heroPin: ScrollTrigger | null = null;

export function initScroll() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const update = () => {
    state.scrollY = window.scrollY;
    state.vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - state.vh;
    state.progress = docH > 0 ? Math.min(1, Math.max(0, state.scrollY / docH)) : 0;
    listeners.forEach((fn) => fn(state));
  };

  // Pin the hero spacer for 100vh of scroll so Scene 1 plays out fully
  // before any subsequent section enters the viewport. About / Purchase
  // / etc. are pushed down by that extra 100vh automatically.
  const heroSpacer = document.querySelector(".hero-spacer");
  if (heroSpacer) {
    heroPin = ScrollTrigger.create({
      trigger: heroSpacer,
      start: "top top",
      end: "+=100%",
      pin: true,
      pinSpacing: true,
      anticipatePin: 1
    });
  }

  // Global scroll observer
  trigger = ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: update
  });

  window.addEventListener("resize", () => {
    update();
    ScrollTrigger.refresh();
  });

  // Prime once on init
  update();
}

export function disposeScroll() {
  trigger?.kill();
  trigger = null;
  heroPin?.kill();
  heroPin = null;
  listeners.clear();
  initialized = false;
}

/** Subscribe to scroll updates. Returns an unsubscribe function. */
export function subscribeScroll(fn: Listener): () => void {
  listeners.add(fn);
  // immediately push current state
  fn(state);
  return () => listeners.delete(fn);
}

export function getScroll(): ScrollState {
  return state;
}

/** Clamp a number to [0,1] */
export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Standard cubic ease-in-out */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Smooth-step (Hermite) for soft fade ranges */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
