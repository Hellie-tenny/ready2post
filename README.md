# Post Ready

Crop, enhance, and export photos for social platforms — entirely client-side, no server, no per-image cost.

## Stack
React + Vite + TypeScript + Tailwind, matching your etiquette-cv setup.

## Setup
```
npm install
npm run dev
```

## Notes
- Background removal uses Google's MediaPipe selfie segmenter (Apache-2.0, free for commercial use). The model (~few MB) downloads from Google's CDN the first time a user clicks a background option in their browser — cached after that.
- It's a *portrait/selfie* model, so it's strong on people-in-frame photos, not arbitrary objects.
- Auto-enhance is real histogram analysis (mean brightness + contrast), not a fixed filter — but it's not machine learning, so avoid labeling it "AI" in your marketing; save that word for the background feature.
- AI upscaling was deliberately left out — see chat history: the ready-made browser implementations are GPL-licensed, and a from-scratch build (tiling, model conversion) is a bigger job than this MVP warranted.
- `src/lib/imageProcessing.ts` has no React dependency, so it's unit-testable on its own if you want to add tests later.

## Deploying
Any static host works — Vercel, Netlify, Cloudflare Pages. `npm run build` outputs to `dist/`.
