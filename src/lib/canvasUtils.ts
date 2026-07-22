// object-fit: cover math, centered (no pan) — used anywhere a background image
// just needs to fill a box without user-controlled cropping
export function coverFit(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}
