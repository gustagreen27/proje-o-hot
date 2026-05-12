#!/usr/bin/env node
/**
 * Propagates branding.config.json + branding/{logo,splash}.png across the project:
 *
 *   - index.html          : <title>, apple-mobile-web-app-title, description meta
 *   - public/manifest.webmanifest : name, short_name, description, theme_color, background_color
 *   - capacitor-wrapper/capacitor.config.ts : appName
 *   - downloads cfg.logoUrl (when present) -> branding/logo.png
 *   - capacitor-wrapper/ios-resources/icon.png + icon-only.png + ios/icon.png + notification-icon.png <- branding/logo.png
 *   - capacitor-wrapper/ios-resources/splash.png <- branding/splash.png
 *   - public/icon-{180,192,512}.png + favicon.ico (regenerated from logo)
 *   - src/assets/platform-logo.jpeg (in-app dashboard avatar)
 *
 * Idempotent: re-run any time after editing branding.config.json or branding/*.png.
 *
 * @capacitor/assets is invoked separately by the build pipeline (codemagic.yaml)
 * to regenerate the iOS AppIcon.appiconset from ios-resources/icon.png.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const cfgPath = resolve(root, "branding.config.json");
if (!existsSync(cfgPath)) {
  console.error("[branding] missing branding.config.json");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));

const logoSrc = resolve(root, cfg.logo);
const splashSrc = resolve(root, cfg.splash);
const sourceLogoSrc = resolve(root, "branding/source-logo.jpeg");

async function downloadLogoFromConfig() {
  if (!cfg.logoUrl) return;
  console.log(`[branding] downloading logoUrl -> ${cfg.logo}`);
  const res = await fetch(cfg.logoUrl, { headers: { "user-agent": "Lovable branding sync" } });
  if (!res.ok) throw new Error(`[branding] failed to download logoUrl: ${res.status} ${res.statusText}`);
  const input = Buffer.from(await res.arrayBuffer());
  const require = createRequire(import.meta.url);
  const sharp = require("sharp");
  const png = await sharp(input)
    .resize(1024, 1024, { fit: "fill" })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(logoSrc, png);
  writeFileSync(sourceLogoSrc, input);
}

await downloadLogoFromConfig();

if (!existsSync(logoSrc)) throw new Error(`[branding] missing ${cfg.logo}`);
if (!existsSync(splashSrc)) throw new Error(`[branding] missing ${cfg.splash}`);

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- index.html ----------
{
  const p = resolve(root, "index.html");
  let html = readFileSync(p, "utf8");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(cfg.appName)}</title>`);
  html = html.replace(
    /(<meta\s+name="apple-mobile-web-app-title"\s+content=)"[^"]*"/,
    `$1"${escapeHtml(cfg.appName)}"`,
  );
  html = html.replace(
    /(<meta\s+name="theme-color"\s+content=)"[^"]*"/,
    `$1"${escapeHtml(cfg.themeColor)}"`,
  );
  // description meta (multi-line value supported)
  html = html.replace(
    /(<meta\s+name="description"[\s\S]*?content=)"[^"]*"/,
    `$1"${escapeHtml(cfg.description)}"`,
  );
  writeFileSync(p, html);
  console.log("[branding] patched index.html");
}

// ---------- manifest.webmanifest ----------
{
  const p = resolve(root, "public/manifest.webmanifest");
  const manifest = JSON.parse(readFileSync(p, "utf8"));
  manifest.name = cfg.appName;
  manifest.short_name = cfg.shortName;
  manifest.description = cfg.description;
  manifest.theme_color = cfg.themeColor;
  manifest.background_color = cfg.backgroundColor;
  writeFileSync(p, JSON.stringify(manifest, null, 2) + "\n");
  console.log("[branding] patched manifest.webmanifest");
}

// ---------- capacitor.config.ts ----------
{
  const p = resolve(root, "capacitor-wrapper/capacitor.config.ts");
  let ts = readFileSync(p, "utf8");
  ts = ts.replace(/(appName:\s*)"[^"]*"/, `$1"${cfg.appName.replace(/"/g, '\\"')}"`);
  writeFileSync(p, ts);
  console.log("[branding] patched capacitor.config.ts (appName)");
}

// ---------- copy logo + splash into ios-resources ----------
{
  const iosDir = resolve(root, "capacitor-wrapper/ios-resources");
  mkdirSync(iosDir, { recursive: true });
  mkdirSync(resolve(iosDir, "ios"), { recursive: true });
  copyFileSync(logoSrc, resolve(iosDir, "icon.png"));
  // @capacitor/assets treats icon-only.png / ios/icon.png as the final AppIcon source.
  // Keeping both prevents the generated iOS icon from falling back to any template/default asset.
  copyFileSync(logoSrc, resolve(iosDir, "icon-only.png"));
  copyFileSync(logoSrc, resolve(iosDir, "ios/icon.png"));
  copyFileSync(splashSrc, resolve(iosDir, "splash.png"));
  // dark variant for capacitor-assets (same image, ok for now)
  copyFileSync(splashSrc, resolve(iosDir, "splash-dark.png"));
  console.log("[branding] copied logo+splash -> capacitor-wrapper/ios-resources/");
}

// ---------- in-app dashboard logo (used by src/lib/branding.ts default) ----------
{
  const dest = resolve(root, "src/assets/platform-logo.jpeg");
  copyFileSync(logoSrc, dest); // .jpeg extension kept; bundler treats as binary
  console.log("[branding] copied logo -> src/assets/platform-logo.jpeg");
}

// ---------- web favicons / PWA icons via Python+Pillow if available ----------
try {
  const py = `
from PIL import Image
src = Image.open(${JSON.stringify(logoSrc)}).convert('RGB')
src.resize((512,512), Image.LANCZOS).save(${JSON.stringify(resolve(root, "public/icon-512.png"))}, 'PNG', optimize=True)
src.resize((192,192), Image.LANCZOS).save(${JSON.stringify(resolve(root, "public/icon-192.png"))}, 'PNG', optimize=True)
src.resize((180,180), Image.LANCZOS).save(${JSON.stringify(resolve(root, "public/icon-180.png"))}, 'PNG', optimize=True)
src.save(${JSON.stringify(resolve(root, "public/favicon.ico"))}, sizes=[(16,16),(32,32),(48,48),(64,64)])
`;
  execFileSync("python3", ["-c", py], { stdio: "inherit" });
  console.log("[branding] regenerated public/icon-*.png + favicon.ico");
} catch (e) {
  console.warn("[branding] skipped web favicon regen (python3+Pillow unavailable):", e?.message ?? e);
}

console.log("[branding] sync complete");
