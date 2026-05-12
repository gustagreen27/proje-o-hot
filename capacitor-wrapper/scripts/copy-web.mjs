#!/usr/bin/env node
/**
 * Copia o build estático do Vite (cliente) para `capacitor-wrapper/dist`,
 * que é o `webDir` apontado em capacitor.config.ts.
 *
 * Preferimos `.output/public` (TanStack Start) e caímos para `dist` se existir.
 */
import { existsSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const wrapperRoot = resolve(here, "..");
const projectRoot = resolve(wrapperRoot, "..");

const candidates = [resolve(projectRoot, "dist")];

const src = candidates.find((p) => existsSync(resolve(p, "index.html")));
if (!src) {
  console.error("[cap:copy-web] Nenhum build SPA encontrado. Rode `npm run build` na raiz primeiro.");
  console.error("O Capacitor exige `dist/index.html`. Procurei em:\n  - " + candidates.join("/index.html\n  - ") + "/index.html");
  process.exit(1);
}

const dest = resolve(wrapperRoot, "dist");
console.log(`[cap:copy-web] copiando ${src} -> ${dest}`);
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[cap:copy-web] ok");
