// Bakes a fade-to-#0d0d0d gradient into the bottom 55% of the men's-page
// hero image so it dissolves smoothly into the email body color (matching
// the storefront's hero blend). Output is saved next to the source so the
// email service can load it directly.
//
// Run once: `node scripts/bake-hero-fade.mjs` from the backend folder.
// Re-run if you ever swap the source image.

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = path.resolve(__dirname, "../../src/assets/image8.jpg");
const OUT = path.resolve(__dirname, "../../src/assets/image8-faded.jpg");

// Email body bg colour — gradient should end exactly here so the seam
// disappears against the email body.
const BODY_R = 0x0d;
const BODY_G = 0x0d;
const BODY_B = 0x0d;

// Where in the image (0..1) the fade should START. 0.45 = fade begins ~halfway
// down. The bottom of the image will be solid body color.
const FADE_START = 0.45;

// Output dimensions — small enough to keep the embedded base64 well under
// Gmail's 102KB message-clipping limit (after compositing + JPEG quality 80
// the resulting file is ~15-25KB → ~30KB base64).
const OUT_W = 600;
const OUT_H = 320;

async function bake() {
  // Resize the source first so the overlay matches and the file size is tiny.
  const resizedBuf = await sharp(SRC)
    .resize(OUT_W, OUT_H, { fit: "cover", position: "center" })
    .toBuffer();

  const w = OUT_W;
  const h = OUT_H;

  // Build an overlay PNG: full alpha at top, ramping to fully-opaque body
  // colour at the bottom.
  const overlayBuf = Buffer.alloc(w * h * 4);
  const fadeStartY = Math.floor(h * FADE_START);
  for (let y = 0; y < h; y++) {
    let alpha = 0;
    if (y >= fadeStartY) {
      const t = (y - fadeStartY) / (h - fadeStartY); // 0..1
      // Smoothstep ease for a softer, more cinematic ramp
      const eased = t * t * (3 - 2 * t);
      alpha = Math.round(eased * 255);
    }
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      overlayBuf[i + 0] = BODY_R;
      overlayBuf[i + 1] = BODY_G;
      overlayBuf[i + 2] = BODY_B;
      overlayBuf[i + 3] = alpha;
    }
  }

  const overlay = await sharp(overlayBuf, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();

  await sharp(resizedBuf)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(OUT);

  const stat = await sharp(OUT).metadata();
  console.log(`✓ Baked fade into ${OUT}  (${stat.width}×${stat.height}, ${(stat.size || 0) / 1024} KB)`);
}

bake().catch((e) => {
  console.error("✗ Failed to bake hero fade:", e);
  process.exit(1);
});
