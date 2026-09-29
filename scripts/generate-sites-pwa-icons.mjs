/**
 * Generate STEA Sites PWA Icons
 */
import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

async function generateIcons() {
  const outDir = "public/sites-icons";
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const src = await Jimp.read("public/stea-apps/stea-sites.png");
  const square = src.crop({ x: 256, y: 0, w: 1024, h: 1024 });

  // 1. Standard PWA Icons (any purpose)
  const sizes = [
    { name: "pwa-512x512.png", size: 512 },
    { name: "pwa-192x192.png", size: 192 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-16x16.png", size: 16 },
  ];

  for (const item of sizes) {
    const resized = square.clone().resize({ w: item.size, h: item.size });
    await resized.write(path.join(outDir, item.name));
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // 2. Maskable Icons (safe area inside 80% circle, dark #080B14 background)
  const maskableSizes = [
    { name: "maskable-512x512.png", size: 512, inner: 410 },
    { name: "maskable-192x192.png", size: 192, inner: 154 },
  ];

  for (const item of maskableSizes) {
    const canvas = new Jimp({ width: item.size, height: item.size, color: 0x080b14ff });
    const inner = square.clone().resize({ w: item.inner, h: item.inner });
    const offset = Math.round((item.size - item.inner) / 2);
    canvas.composite(inner, offset, offset);
    await canvas.write(path.join(outDir, item.name));
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size}, safe zone inner ${item.inner}px)`);
  }

  // Copy favicon-32 to favicon.ico as standard
  fs.copyFileSync(path.join(outDir, "favicon-32x32.png"), path.join(outDir, "favicon.ico"));
  console.log("✓ Created favicon.ico");
}

generateIcons().catch((e) => {
  console.error("Error generating icons:", e);
  process.exit(1);
});
