# Chris Gramly · Clear Modern Mortgage — Engineering Notes

This is a Vite + React + TypeScript single-page site that wraps a single
`<Canvas>` (`@react-three/fiber`) with a cinematic scroll-bound 3D
experience. Below the cinematic hero are real, navigable mortgage
sections (about, purchase, refinance calculator, resources, contact form).

## Stack

- **Build**: Vite 6, TypeScript 5
- **UI**: React 18
- **3D**: `three` 0.171, `@react-three/fiber` 8, `@react-three/drei` 9, `@react-three/postprocessing` 2
- **Animation**: `gsap` 3 + `@gsap/react` + ScrollTrigger
- **Fonts**: Cormorant Garamond (display serif) + Inter (UI sans), Google Fonts
- **Deploy**: GitHub Pages via Actions, base path `/ChrisGramlyMortgage/`

## File layout

```
index.html                 # Vite entry, loads /src/main.tsx
src/
  main.tsx                 # React root
  App.tsx                  # Page composition
  components/
    canvas/
      CanvasRoot.tsx       # Single <Canvas>, fixed full-viewport
      scenes/
        SceneSky.tsx       # Scene 1: sky intro / hero
        Scene<Next>.tsx    # Each new scene is its own file
    site/
      Header.tsx           # Sticky nav, light theme
      Footer.tsx
      About.tsx
      Purchase.tsx
      Refinance.tsx        # Includes mortgage calculator
      Resources.tsx
      Contact.tsx          # Profile card + form
  lib/
    scroll.ts              # ScrollProvider, useScroll, ScrollTrigger setup
    pageBounds.ts          # Scene Y-ranges + progress lookups
    palette.ts             # Color tokens shared between CSS + JS
  styles/
    globals.css            # CSS resets, tokens, light base styles
  types/
    drei.d.ts              # Ambient types if drei JSX is missing
public/
  assets/                  # Existing brand assets: photo, logo, hero, svg
legacy/                    # Pre-scaffold static site, preserved for reference
.github/workflows/pages.yml
```

## Single Canvas convention

There is exactly **one** `<Canvas>` in the whole app, mounted by
`CanvasRoot.tsx` and positioned `fixed; inset: 0; pointer-events: none`.
Each scene is a React component placed inside it (visible only while its
scroll range is active).

Why: every additional Canvas allocates a WebGL context, kills shared
state, and tanks mobile performance.

If you need a "different scene" you build a new component in
`components/canvas/scenes/` and reveal/hide it via the scroll context.

## Scroll context (`lib/scroll.ts`)

- A single ScrollTrigger covers `<main>`'s height. Its progress (0→1)
  is exposed via `useScroll()` (subscribe pattern, not React state — we
  do not want every frame to trigger a React render).
- Each scene reads progress in its `useFrame` and computes its own
  local 0→1 based on `pageBounds.ts`. Example: SceneSky owns the first
  100vh, so its local progress = clamp((globalY - 0) / vh, 0, 1).
- 2D copy overlays use GSAP timelines whose `progress()` is set from the
  same global scroll value — that way scroll-up reverses the animation.

## Animation rules

- **Bind to scroll, not to time** — every reveal/transition is driven by
  the scroll context. No `setTimeout`, no autoplaying intro that finishes
  on a clock.
- **All animations reversible** — scrolling up must undo everything that
  scrolling down did. No one-shot `.add()` to a timeline that doesn't
  reverse.
- Camera moves use cubic ease-in-out via small helpers in scenes (no
  GSAP for camera position — it's just a `useFrame` lerp).

## Palette

| Token            | Hex       | Use                                                |
|------------------|-----------|----------------------------------------------------|
| `--paper`        | `#f6f0e4` | Warm cream background for light sections           |
| `--paper-sub`    | `#ece4d2` | Section dividers / subtle bands                    |
| `--ink`          | `#0a1224` | Body text on light                                 |
| `--ink-soft`     | `#2d3a52` | Secondary text                                     |
| `--brass`        | `#c8a047` | Primary gold accent — buttons, links, scene gold   |
| `--brass-deep`   | `#9a7830` | Hover / pressed                                    |
| `--sky-top`      | `#050816` | Scene 1 sky top                                    |
| `--sky-bottom`   | `#0d1530` | Scene 1 sky bottom                                 |
| `--ink-dark`     | `#f6f0e4` | Text on dark scenes (same as paper for cohesion)   |

**The cinematic scenes are dark. The rest of the site is warm and
light.** Don't smear charcoal everywhere — the previous attempt did
that and it felt oppressive.

## Performance budget

- 60fps on a 2021 iPhone (A14)
- Limit total triangles in any active scene to ~50k
- `dpr={[1, 1.75]}` on the Canvas (don't render at 3x on retina)
- Pause scenes when their scroll range is fully off-screen
- `<Bloom>` is the most expensive postprocess — keep `intensity` modest

## Don'ts

- No new `<Canvas>` instances
- No `useState` driven by `useFrame` (causes per-frame React render)
- No `setInterval` / `setTimeout` for scene animation
- No "Welcome!" / "Hello!" / exclamation copy
- No emojis
- No first-person flight / airplane / helicopter clichés
- No orbit controls unless the prompt explicitly asks for them
- No corporate stock photography

## Existing assets (preserve)

- `public/assets/chris-gramly.png` — Chris's headshot
- `public/assets/clear-modern-logo.png` — company logo
- `public/assets/home-financing-hero.png` — original hero photograph
- `public/assets/equal-housing.svg` — equal housing opportunity badge
- Phone: (702) 767-4072 · Email: chris.gramly@clearmtg.com
- NMLS: 1984074 · Licensed CA + NV
- Office: 8751 W Charleston Blvd #220, Las Vegas, NV 89117
- FormSubmit endpoint: `https://formsubmit.co/ajax/chris.gramly@clearmtg.com`
- Apply Now: `https://www.clearmodernmortgage.com/loan-officer/chris-gramly/apply-now`

## Building & deploying

```bash
npm install
npm run dev      # Vite dev server at 127.0.0.1:5173
npm run build    # Output to dist/
npm run preview  # Serve the build
```

GitHub Pages source must be set to **"GitHub Actions"** in repo settings.
The workflow `.github/workflows/pages.yml` builds `/dist` and deploys.

## Review-before-respond discipline

**Always review and test code before sending a response.** Specifically:

- Run `npm run build` after any change in `src/` or `vite.config.ts` —
  it does `tsc -b && vite build`, catches type errors and build
  failures. The Stop hook at `.claude/hooks/build-check.sh` enforces
  this automatically and blocks the response if the build fails.
- For visual changes (3D scenes, layout, styling), preview the built
  site headlessly and screenshot every scroll position before declaring
  done. Don't rely on "the build succeeded" to mean "it looks right."
- For runtime-sensitive changes (R3F geometry, scroll-bound camera,
  useFrame loops), open the preview, scroll through every section, and
  confirm via the CDP diag script that no uncaught exceptions land.
- Never push or open a PR before the local build is green AND the
  rendered output matches the user's request.
