#!/usr/bin/env node
/**
 * Ensures that the iOS project uses exactly one app icon source:
 *
 *  1. Assets.xcassets contains:
 *       - exactly one *.appiconset (named AppIcon.appiconset)
 *       - no AlternateAppIcon / extra AppIcon-* sets
 *       - no leftover template/placeholder icon sets
 *  2. Every .appiconset Contents.json points at PNGs that exist.
 *  3. Info.plist:
 *       - CFBundleIconName == "AppIcon" (modern asset-based icon)
 *       - CFBundleIcons / CFBundleIcons~ipad primary icon name == "AppIcon"
 *       - no CFBundleAlternateIcons entries
 *       - no legacy CFBundleIconFile / CFBundleIconFiles pointing at template assets
 *
 * Usage:
 *   node scripts/verify-ios-icon-uniqueness.mjs <xcassets-dir> <Info.plist>
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

const [xcassetsArg, plistArg] = process.argv.slice(2);
if (!xcassetsArg || !plistArg) {
  console.error('Usage: node scripts/verify-ios-icon-uniqueness.mjs <xcassets-dir> <Info.plist>');
  process.exit(1);
}

const errors = [];
const ALLOWED_APPICON = 'AppIcon.appiconset';
// Non-icon imagesets we explicitly allow (notification icon is a separate imageset).
const ALLOWED_NON_ICON_SETS = new Set(['NotificationIcon.imageset', 'Splash.imageset', 'SplashDark.imageset']);

// ---- 1. xcassets sweep ---------------------------------------------------
if (!existsSync(xcassetsArg) || !statSync(xcassetsArg).isDirectory()) {
  errors.push(`xcassets not found: ${xcassetsArg}`);
} else {
  const entries = readdirSync(xcassetsArg);
  const appiconSets = entries.filter((e) => e.endsWith('.appiconset'));
  if (appiconSets.length !== 1 || appiconSets[0] !== ALLOWED_APPICON) {
    errors.push(
      `xcassets: expected exactly one AppIcon set named "${ALLOWED_APPICON}", found: [${appiconSets.join(', ') || 'none'}]`,
    );
  }
  // Flag alternate / template imagesets.
  for (const entry of entries) {
    if (entry.endsWith('.appiconset')) continue;
    if (entry === 'Contents.json') continue;
    if (ALLOWED_NON_ICON_SETS.has(entry)) continue;
    if (/AlternateAppIcon|AppIcon-/i.test(entry)) {
      errors.push(`xcassets: forbidden alternate/template icon set present: ${entry}`);
    }
  }

  // Validate every appiconset references existing PNGs.
  for (const set of appiconSets) {
    const dir = join(xcassetsArg, set);
    const contentsPath = join(dir, 'Contents.json');
    if (!existsSync(contentsPath)) {
      errors.push(`${set}: missing Contents.json`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(contentsPath, 'utf8'));
    } catch (e) {
      errors.push(`${set}: invalid Contents.json (${e?.message ?? e})`);
      continue;
    }
    const images = Array.isArray(parsed.images) ? parsed.images : [];
    const named = images.filter((i) => i && typeof i.filename === 'string' && i.filename);
    if (named.length === 0) {
      errors.push(`${set}: Contents.json has no image filenames`);
    }
    for (const img of named) {
      if (!existsSync(join(dir, img.filename))) {
        errors.push(`${set}: missing referenced image ${img.filename}`);
      }
    }
  }
}

// ---- 2. Info.plist sweep -------------------------------------------------
function plistGet(key) {
  try {
    return execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, plistArg], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

if (!existsSync(plistArg)) {
  errors.push(`Info.plist not found: ${plistArg}`);
} else {
  const iconName = plistGet('CFBundleIconName');
  if (iconName !== 'AppIcon') {
    errors.push(`Info.plist: CFBundleIconName must be "AppIcon" (found: ${iconName ?? 'unset'})`);
  }

  for (const root of ['CFBundleIcons', 'CFBundleIcons~ipad']) {
    const primary = plistGet(`${root}:CFBundlePrimaryIcon:CFBundleIconName`);
    if (primary && primary !== 'AppIcon') {
      errors.push(`Info.plist: ${root}:CFBundlePrimaryIcon:CFBundleIconName must be "AppIcon" (found: ${primary})`);
    }
    const alt = plistGet(`${root}:CFBundleAlternateIcons`);
    if (alt && !/Does Not Exist/i.test(alt)) {
      errors.push(`Info.plist: ${root}:CFBundleAlternateIcons must not be present`);
    }
    // Legacy CFBundleIconFiles array — if present, every entry must be AppIcon*.
    const files = plistGet(`${root}:CFBundlePrimaryIcon:CFBundleIconFiles`);
    if (files && /(\bicon\b|template|placeholder|default)/i.test(files) && !/AppIcon/.test(files)) {
      errors.push(`Info.plist: ${root}:CFBundlePrimaryIcon:CFBundleIconFiles references non-AppIcon assets`);
    }
  }

  const legacyFile = plistGet('CFBundleIconFile');
  if (legacyFile) {
    errors.push(`Info.plist: legacy CFBundleIconFile is set ("${legacyFile}") — remove it; AppIcon asset catalog must be the sole source`);
  }
  const legacyFiles = plistGet('CFBundleIconFiles');
  if (legacyFiles && !/Does Not Exist/i.test(legacyFiles)) {
    errors.push(`Info.plist: legacy top-level CFBundleIconFiles is set — remove it; AppIcon asset catalog must be the sole source`);
  }
}

if (errors.length > 0) {
  console.error('[branding] icon-uniqueness verification FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(`[branding] xcassets + Info.plist reference only ${ALLOWED_APPICON} — no template / alternate icons.`);
