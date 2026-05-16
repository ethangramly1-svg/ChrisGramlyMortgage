/**
 * Where each scene's scroll-progress range lives within the global page.
 *
 * Scene 1 (Sky) owns the first 100vh — the "pin" duration we'd otherwise
 * implement via ScrollTrigger pin. We treat that as global progress 0 → P1.
 *
 * The remaining sections are static (light theme) below the scene; they
 * don't consume scene-progress, just normal scroll.
 *
 * Global progress is [scrollY / (docH - vh)]. We approximate Scene 1's
 * cutoff at "first 100vh of document", so its local progress is
 *   localP = clamp(globalScrollY / vh, 0, 1)
 *
 * Subsequent scenes added later will append their own ranges.
 */

import { clamp01 } from "./scroll";

export function sceneSkyLocalProgress(globalScrollY: number, vh: number): number {
  return clamp01(globalScrollY / Math.max(vh, 1));
}
