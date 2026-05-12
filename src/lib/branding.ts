import { useEffect, useState } from "react";

export type Branding = {
  platformName: string;
  platformLogo: string | null; // dataURL
};

const KEY = "gucmart:branding:v1";

export const DEFAULT_BRANDING: Branding = {
  platformName: "Gucmart",
  platformLogo: null,
};

export function loadBranding(): Branding {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BRANDING;
    const parsed = JSON.parse(raw) as Partial<Branding>;
    return { ...DEFAULT_BRANDING, ...parsed };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function saveBranding(b: Branding) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
    window.dispatchEvent(new CustomEvent("branding:update", { detail: b }));
  } catch {
    // ignore
  }
}

export function useBranding(): [Branding, (b: Branding) => void] {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    setBranding(loadBranding());
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
