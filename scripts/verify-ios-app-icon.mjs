#!/usr/bin/env node
/**
 * Verifies that branding assets were applied correctly:
 *
 *  1. iOS AppIcon.appiconset:
 *     - Contents.json exists and lists at least one image.
 *     - Every referenced PNG exists, has the expected pixel size (size * scale),
 *       and matches the branding source icon (no Capacitor default template).
 *  2. Web/PWA icons in public/:
 *     - icon-180.png is 180x180
 *     - icon-192.png is 192x192
 *     - icon-512.png is 512x512
 *     - all match the branding source icon.
 *
 * Usage:
 *   node scripts/verify-ios-app-icon.mjs <source-icon> <generated-app-icon> [appiconset-dir] [public-dir]
 *
 * Defaults:
 *   appiconset-dir = dirname(<generated-app-icon>)
 *   public-dir     = <repo-root>/public
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [sourceArg, generatedArg, appiconsetArg, publicArg] = process.argv.slice(2);
if (!sourceArg || !generatedArg) {
  console.error(
    'Usage: node scripts/verify-ios-app-icon.mjs <source-icon> <generated-app-icon> [appiconset-dir] [public-dir]',
  );
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const cwd = process.cwd();

const sourcePath = resolve(cwd, sourceArg);
const generatedPath = resolve(cwd, generatedArg);
const appiconsetDir = resolve(cwd, appiconsetArg ?? dirname(generatedArg));
const publicDir = resolve(cwd, publicArg ?? join(repoRoot, 'public'));

const requireFromProject = createRequire(resolve(cwd, 'package.json'));
let sharp;
try {
  sharp = requireFromProject('sharp');
} catch {
  const assetsPkg = requireFromProject.resolve('@capacitor/assets/package.json');
  sharp = createRequire(assetsPkg)('sharp');
}

const errors = [];

async function loadRGB(file, size) {
  const { data, info } = await sharp(file)
    .resize(size, size, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function nativeSize(file) {
  const meta = await sharp(file).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

function diffPixels(a, b) {
  let max = 0;
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2]),
    );
    if (d > 0) changed += 1;
    if (d > max) max = d;
  }
  return { max, changed };
}

// Tolerance: capacitor-assets re-encodes via sharp, so allow tiny rounding noise
// but still catch a completely different image (Capacitor's default template).
const MAX_DIFF_TOLERANCE = 6;
const MAX_CHANGED_RATIO = 0.02; // 2% of pixels

async function verifyMatchesSource(file, size, label) {
  if (!existsSync(file)) {
    errors.push(`${label}: missing file ${file}`);
    return;
  }
  const native = await nativeSize(file);
  if (native.width !== size || native.height !== size) {
    errors.push(`${label}: expected ${size}x${size}, found ${native.width}x${native.height} (${file})`);
    return;
  }
  const [src, gen] = await Promise.all([loadRGB(sourcePath, size), loadRGB(file, size)]);
  const { max, changed } = diffPixels(src.data, gen.data);
  const totalPx = size * size;
  if (max > MAX_DIFF_TOLERANCE && changed / totalPx > MAX_CHANGED_RATIO) {
    errors.push(
      `${label}: image does not match branding source (max diff ${max}, ${changed}/${totalPx} pixels changed) — likely a default template. File: ${file}`,
    );
  }
}

// 1. AppIcon.appiconset
{
  const contentsPath = join(appiconsetDir, 'Contents.json');
  if (!existsSync(contentsPath)) {
    errors.push(`AppIcon.appiconset: missing Contents.json at ${contentsPath}`);
  } else {
    let contents;
    try {
      contents = JSON.parse(readFileSync(contentsPath, 'utf8'));
    } catch (e) {
      errors.push(`AppIcon.appiconset: invalid Contents.json (${e?.message ?? e})`);
      contents = { images: [] };
    }
    const images = Array.isArray(contents.images) ? contents.images : [];
    const withFile = images.filter((img) => img && typeof img.filename === 'string' && img.filename);
    if (withFile.length === 0) {
      errors.push('AppIcon.appiconset: Contents.json lists no image filenames');
    }
    for (const img of withFile) {
      const file = join(appiconsetDir, img.filename);
      const [w, h] = String(img.size ?? '0x0').split('x').map((v) => parseFloat(v));
      const scale = parseFloat(String(img.scale ?? '1x'));
      const expected = Math.round((w || 0) * (Number.isFinite(scale) ? scale : 1));
      if (!expected || expected !== Math.round((h || 0) * scale)) {
        errors.push(`AppIcon.appiconset: cannot derive pixel size for ${img.filename} (size=${img.size}, scale=${img.scale})`);
        continue;
      }
      await verifyMatchesSource(file, expected, `AppIcon ${img.filename} (${expected}x${expected})`);
    }

    // Also flag any stray PNGs in the folder that are NOT referenced (leftover defaults).
    const referenced = new Set(withFile.map((i) => i.filename));
    for (const entry of readdirSync(appiconsetDir)) {
      if (entry.endsWith('.png') && !referenced.has(entry)) {
        errors.push(`AppIcon.appiconset: stray PNG not referenced by Contents.json: ${entry}`);
      }
    }
  }

  // Backwards-compat: original single-file check.
  await verifyMatchesSource(generatedPath, 1024, 'AppIcon primary 1024x1024');
}

// 2. Web/PWA icons
for (const [size, name] of [[180, 'icon-180.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  const file = join(publicDir, name);
  await verifyMatchesSource(file, size, `public/${name}`);
}

// 3. Explicit notification icon asset used to prevent any native template fallback.
await verifyMatchesSource(
  join(dirname(appiconsetDir), 'NotificationIcon.imageset', 'notification-icon.png'),
  1024,
  'NotificationIcon.imageset/notification-icon.png',
);

if (errors.length > 0) {
  console.error('[branding] verification FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log('[branding] AppIcon.appiconset + public icons match branding source.');
