import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

function buildSparkline(points: number[], width = 280, height = 64) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return { path, area };
}

export function DashboardCard() {
  const [hidden, setHidden] = useState(false);
  const points = useMemo(
    () => [12, 18, 14, 22, 19, 28, 24, 34, 30, 42, 38, 50, 46, 58],
    [],
  );
  const { path, area } = useMemo(() => buildSparkline(points), [points]);

  return (
    <section className="relative mx-5 mt-5 overflow-hidden rounded-3xl glass-strong p-5">
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <p className="text-[12px] uppercase tracking-widest text-white/60">Saldo disponível</p>
        <button
          onClick={() => setHidden((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 pressable"
          aria-label="Toggle balance"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-2 flex items-end gap-2">
        <h2 className="text-[40px] font-semibold leading-none tracking-tight text-white">
          {hidden ? "••••••" : "US$ 12.847"}
        </h2>
        <span className="pb-1 text-base font-medium text-white/60">.92</span>
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
          <ArrowUpRight className="h-3 w-3" /> +12,4%
        </span>
        <span className="text-[12px] text-white/50">vs ontem · US$ 1.420 hoje</span>
      </div>

      <div className="relative mt-4 -mx-1">
        <svg viewBox="0 0 280 64" className="h-16 w-full">
          <defs>
            <linearGradient id="spark-stroke" x1="0" x2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#spark-fill)" />
          <path d={path} fill="none" stroke="url(#spark-stroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
