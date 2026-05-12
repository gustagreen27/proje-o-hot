import { useEffect, useState } from "react";
import defaultLogo from "@/assets/platform-logo.jpeg";

export type Branding = {
  platformName: string;
  platformLogo: string | null; // dataURL or asset url
};

const KEY = "gucmart:branding:v1";

export const DEFAULT_BRANDING: Branding = {
  platformName: "Gucmart",
  platformLogo: defaultLogo,
};

// Lazy-load Capacitor Preferences (available only in native build).
// Falls back gracefully on web.
async function getPreferences(): Promise<typeof import("@capacitor/preferences").Preferences | null> {
  try {
    const mod = await import("@capacitor/preferences");
    return mod.Preferences;
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
  const Preferences = await getPreferences();
  if (Preferences) {
    try {
      const { value } = await Preferences.get({ key: KEY });
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
    const Preferences = await getPreferences();
    if (!Preferences) return;
    try {
      await Preferences.set({ key: KEY, value: JSON.stringify(b) });
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
