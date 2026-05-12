#!/usr/bin/env node
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const [sourceArg, generatedArg] = process.argv.slice(2);
if (!sourceArg || !generatedArg) {
  console.error('Usage: node scripts/verify-ios-app-icon.mjs <source-icon> <generated-app-icon>');
  process.exit(1);
}

const requireFromProject = createRequire(resolve(process.cwd(), 'package.json'));
let sharp;
try {
  sharp = requireFromProject('sharp');
} catch {
  const assetsPkg = requireFromProject.resolve('@capacitor/assets/package.json');
  sharp = createRequire(assetsPkg)('sharp');
}

async function readRaw(file) {
  const { data, info } = await sharp(resolve(process.cwd(), file))
    .resize(1024, 1024)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

const source = await readRaw(sourceArg);
const generated = await readRaw(generatedArg);

if (source.info.width !== generated.info.width || source.info.height !== generated.info.height) {
  console.error(`[branding] AppIcon size mismatch: source ${source.info.width}x${source.info.height}, generated ${generated.info.width}x${generated.info.height}`);
  process.exit(1);
}

let maxDiff = 0;
let changedPixels = 0;
for (let i = 0; i < source.data.length; i += 3) {
  const d0 = Math.abs(source.data[i] - generated.data[i]);
  const d1 = Math.abs(source.data[i + 1] - generated.data[i + 1]);
  const d2 = Math.abs(source.data[i + 2] - generated.data[i + 2]);
  const diff = Math.max(d0, d1, d2);
  if (diff > 0) changedPixels += 1;
  if (diff > maxDiff) maxDiff = diff;
}

if (changedPixels > 0 || maxDiff > 0) {
  console.error(`[branding] Generated AppIcon does not match branding icon: ${changedPixels} pixels changed, max diff ${maxDiff}`);
  process.exit(1);
}

console.log('[branding] Generated AppIcon matches branding icon exactly.');
