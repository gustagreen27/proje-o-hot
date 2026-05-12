import { useEffect, useState } from "react";
import { useBranding } from "@/lib/branding";

function greeting(h: number) {
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Header({ name = "Trader" }: { name?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [branding] = useBranding();

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const hour = now?.getHours() ?? 0;
  const time = now
    ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <header className="flex items-center justify-between px-5 pt-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full gradient-primary text-sm font-semibold text-white shadow-lg">
            {branding.platformLogo ? (
              <img
                src={branding.platformLogo}
                alt={branding.platformName}
                className="h-full w-full object-cover"
              />
            ) : (
              branding.platformName.slice(0, 1).toUpperCase()
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#07070b] bg-emerald-400" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] uppercase tracking-wider text-white/50" suppressHydrationWarning>
            {greeting(hour)} · {branding.platformName}
          </p>
          <p className="text-[15px] font-semibold text-white">{name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-[12px] font-medium text-white/80" suppressHydrationWarning>
          {time || "—"}
        </span>
      </div>
    </header>
  );
}
