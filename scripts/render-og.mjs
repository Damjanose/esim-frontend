// Renders scripts/og/og-image.html to public/og/esim2you-og.png (1200x630)
// with a locally installed Chrome in headless mode. After re-rendering, bump
// ogImageVersion in src/lib/seo.ts so link-preview caches refetch it.
//
// Override the browser with CHROME_PATH=/path/to/chrome if it isn't found.
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "scripts/og/og-image.html");
const output = join(root, "public/og/esim2you-og.png");

const candidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
].filter(Boolean);
const chrome = candidates.find((path) => existsSync(path));
if (!chrome) {
  console.error("Chrome not found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(1);
}

execFileSync(chrome, [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  // Gives Google Fonts time to load before the screenshot is taken.
  "--virtual-time-budget=10000",
  `--screenshot=${output}`,
  pathToFileURL(source).href
], { stdio: "inherit" });

// Optional: shrink with pngquant (brew install pngquant) when it's installed.
try {
  execFileSync("pngquant", ["--quality=80-95", "--speed=1", "--force", "--output", output, output], { stdio: "inherit" });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.warn("pngquant not found; writing the uncompressed PNG.");
}

const kb = Math.round(statSync(output).size / 1024);
console.log(`Wrote ${output} (${kb} KB)`);
if (kb > 300) {
  console.warn("Warning: over 300 KB; WhatsApp may skip the preview image.");
}
