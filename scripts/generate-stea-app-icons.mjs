/**
 * generate-stea-app-icons.mjs
 *
 * Derives the complete favicon / PWA / apple-touch icon set from the single
 * real STEA app icon master (public/stea-app-icon-final.png, 1024x1024).
 *
 * No design is invented here — every file is a resize (or a padded maskable
 * variant) of the approved master asset.
 *
 * Run: node scripts/generate-stea-app-icons.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const ICONS = path.join(PUBLIC, "icons");
const MASTER = path.join(PUBLIC, "stea-app-icon-final.png");
const MASKABLE_BG = { r: 8, g: 11, b: 20, alpha: 1 };

if (!fs.existsSync(MASTER)) {
  console.error(`Missing master icon: ${MASTER}`);
  process.exit(1);
}

fs.mkdirSync(ICONS, { recursive: true });

const SQUARE_SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

async function resizeTo(size, outPath) {
  await sharp(MASTER)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9, palette: size <= 48 })
    .toFile(outPath);
  console.log(`✓ ${path.relative(ROOT, outPath)} (${size}x${size})`);
}

/** Maskable icons keep the mark inside the 80% safe zone on a solid surface. */
async function maskableTo(size, outPath) {
  const inner = Math.round(size * 0.78);
  const offset = Math.round((size - inner) / 2);
  const mark = await sharp(MASTER).resize(inner, inner, { fit: "cover" }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: MASKABLE_BG } })
    .composite([{ input: mark, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${path.relative(ROOT, outPath)} (${size}x${size} maskable, safe zone ${inner}px)`);
}

/** Minimal PNG-payload .ico writer (16 / 32 / 48 entries). */
async function writeIco(outPath, sizes = [16, 32, 48]) {
  const pngs = await Promise.all(
    sizes.map((size) => sharp(MASTER).resize(size, size, { fit: "cover" }).png().toBuffer())
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + pngs.length * 16;
  pngs.forEach((buf, i) => {
    const entry = Buffer.alloc(16);
    const size = sizes[i];
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(entry);
  });

  fs.writeFileSync(outPath, Buffer.concat([header, ...entries, ...pngs]));
  console.log(`✓ ${path.relative(ROOT, outPath)} (${sizes.join("/")} png entries)`);
}

for (const size of SQUARE_SIZES) {
  await resizeTo(size, path.join(ICONS, `icon-${size}x${size}.png`));
}

// Alias names referenced by the manifest / index.html.
await resizeTo(192, path.join(ICONS, "icon-192.png"));
await resizeTo(512, path.join(ICONS, "icon-512.png"));
await resizeTo(192, path.join(ICONS, "icon-192x192.png"));
await resizeTo(512, path.join(ICONS, "icon-512x512.png"));

// Maskable family (correct safe area — the old maskable files baked the rounded
// square frame into the safe zone, which cropped badly on Android).
await maskableTo(192, path.join(ICONS, "maskable-192x192.png"));
await maskableTo(512, path.join(ICONS, "maskable-512x512.png"));

// Apple touch icon: opaque, no alpha (iOS ignores transparency and renders it black).
await sharp(MASTER)
  .resize(180, 180, { fit: "cover" })
  .flatten({ background: MASKABLE_BG })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ICONS, "apple-touch-icon.png"));
console.log("✓ public/icons/apple-touch-icon.png (180x180, opaque)");

await sharp(MASTER)
  .resize(180, 180, { fit: "cover" })
  .flatten({ background: MASKABLE_BG })
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, "apple-touch-icon.png"));
console.log("✓ public/apple-touch-icon.png (180x180, opaque)");

// Root-level favicons so browsers that request /favicon.ico directly get the
// real app icon instead of the retired gold "S" mark.
await resizeTo(32, path.join(PUBLIC, "favicon-32x32.png"));
await resizeTo(16, path.join(PUBLIC, "favicon-16x16.png"));
await resizeTo(96, path.join(PUBLIC, "favicon-96x96.png"));
await writeIco(path.join(PUBLIC, "favicon.ico"));

console.log("\nSTEA app icon set regenerated from the approved master asset.");
