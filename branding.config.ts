/**
 * Centralized branding for the entire app.
 *
 * Single source of truth, consumed by:
 *  - React UI (header, notifications, dashboard)
 *  - Capacitor (capacitor.config.ts -> appName)
 *  - HTML <title>, manifest, apple-mobile-web-app-title (via scripts/sync-branding.mjs)
 *  - iOS AppIcon + splash (via @capacitor/assets reading branding/logo.png + branding/splash.png)
 *
 * To rebrand the entire app:
 *   1. Edit values in branding.config.json
 *   2. Replace branding/logo.png (1024x1024) and branding/splash.png (2732x2732)
 *   3. Run `npm run branding:sync` (the Codemagic build does this automatically)
 */
import config from "./branding.config.json";

export type BrandingConfig = {
  appName: string;
  notificationName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  logoUrl?: string;
  logo: string;
  splash: string;
};

export const BRANDING: BrandingConfig = config as BrandingConfig;
export default BRANDING;
