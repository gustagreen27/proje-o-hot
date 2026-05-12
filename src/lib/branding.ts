import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import defaultLogo from "@/assets/platform-logo.jpeg";
import { BRANDING } from "../../branding.config";

export type Branding = {
  platformName: string;
  platformLogo: string | null; // dataURL or asset url
};

const KEY = "branding:v1";

export const DEFAULT_BRANDING: Branding = {
  platformName: BRANDING.appName,
  platformLogo: defaultLogo,
};

// Lazy-load Capacitor Preferences ONLY on native.
// Do not return the plugin proxy directly from an async function: Promise resolution
// probes `.then`, which Capacitor treats as a plugin method on web.
type PreferencesPlugin = typeof import("@capacitor/preferences").Preferences;
async function getPreferences(): Promise<{ plugin: PreferencesPlugin } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import("@capacitor/preferences");
    return { plugin: mod.Preferences };
  } catch {
    return null;
  }
}

function readLocal(): Branding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Branding>;
    return { ...DEFAULT_BRANDING, ...parsed };
  } catch {
    return null;
  }
}

function writeLocal(b: Branding) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* ignore quota */
  }
}

export function loadBranding(): Branding {
  const local = readLocal();
  return local ?? DEFAULT_BRANDING;
}

async function loadBrandingAsync(): Promise<Branding> {
  // Try native Preferences first (survives reinstall on iOS via app sandbox), then localStorage.
  const nativePreferences = await getPreferences();
  if (nativePreferences) {
    try {
      const { value } = await nativePreferences.plugin.get({ key: KEY });
      if (value) {
        const parsed = JSON.parse(value) as Partial<Branding>;
        const merged = { ...DEFAULT_BRANDING, ...parsed };
        writeLocal(merged); // mirror to localStorage backup
        return merged;
      }
    } catch {
      /* fall through to localStorage */
    }
  }
  return readLocal() ?? DEFAULT_BRANDING;
}

export function saveBranding(b: Branding) {
  writeLocal(b);
  // Best-effort native persistence
  void (async () => {
    const nativePreferences = await getPreferences();
    if (!nativePreferences) return;
    try {
      await nativePreferences.plugin.set({ key: KEY, value: JSON.stringify(b) });
    } catch {
      /* ignore */
    }
  })();
  try {
    window.dispatchEvent(new CustomEvent("branding:update", { detail: b }));
  } catch {
    /* ignore */
  }
}

export function useBranding(): [Branding, (b: Branding) => void] {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    // Sync read for instant paint, then async upgrade from native Preferences.
    setBranding(loadBranding());
    void loadBrandingAsync().then((b) => setBranding(b));

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<Branding>).detail;
      if (detail) setBranding(detail);
    };
    window.addEventListener("branding:update", onUpdate as EventListener);
    return () => window.removeEventListener("branding:update", onUpdate as EventListener);
  }, []);

  const update = (b: Branding) => {
    setBranding(b);
    saveBranding(b);
  };

  return [branding, update];
}
