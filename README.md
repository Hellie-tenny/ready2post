# Postank

Free, in-browser photo prep and post design — crop, enhance, remove backgrounds, build gradient
text cards, news-style cards, product posts, and collages. Entirely client-side: no server, no
per-image cost, nothing uploaded anywhere except the optional caption feature (see below).

## Stack
React + Vite + TypeScript + Tailwind.

## Setup
```
npm install
npm run dev
```

## Before you actually ship this
A few things are placeholders and need your real values before this goes live:

- **Domain**: `index.html`, `public/robots.txt`, and `public/sitemap.xml` all reference
  `https://postank.app/` as a placeholder. Swap in your real domain once you know it — search
  for `postank.app` across the project to find every spot.
- **OG/social preview image**: `public/og-image.png` was generated as a reasonable placeholder
  (branded, 1200x630). Swap it for a real one if you want something more considered — same
  filename, same dimensions, and everything else keeps working.
- **Captions feature**: hidden until `VITE_CAPTION_WORKER_URL` is set in `.env.local` — see the
  captions worker's own README for deploying that piece.
- **Favicon**: `public/favicon.svg` is a simple generated "P" monogram in your brand colors.
  Good enough to ship, easy to swap later if you want a custom mark.

## Notes
- Background removal uses Google's MediaPipe selfie segmenter (Apache-2.0, free for commercial
  use). The model (~few MB) downloads from Google's CDN the first time someone clicks a
  background option in their browser — cached after that.
- It's a *portrait/selfie* model, so it's strong on people-in-frame photos, not arbitrary objects.
- Auto-enhance is real histogram analysis (mean brightness + contrast), not a fixed filter — but
  it's not machine learning, so avoid labeling it "AI" in your marketing; save that word for the
  background-removal and caption features.
- AI upscaling was deliberately left out — the ready-made browser implementations are
  GPL-licensed, and a from-scratch build (tiling, model conversion) was a bigger job than this
  scope warranted.
- Text/style choices persist to `localStorage` (prefixed `postank:`) so people can pick up where
  they left off. Photos are never persisted — too large for browser storage, and images aren't
  JSON-serializable anyway.
- `src/lib/imageProcessing.ts` has no React dependency, so it's unit-testable on its own if you
  want to add tests later.

## Deploying
Any static host works — Vercel, Netlify, Cloudflare Pages. `npm run build` outputs to `dist/`.
No client-side routing is used, so there's nothing special to configure for a static host — every
request just serves `index.html`.
