import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  tone?: "primary" | "success" | "warn" | "neutral";
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  primary: "from-indigo-500/30 to-violet-500/10 text-indigo-200",
  success: "from-emerald-500/30 to-teal-500/10 text-emerald-200",
  warn: "from-amber-500/30 to-orange-500/10 text-amber-200",
  neutral: "from-white/10 to-white/5 text-white/80",
};

export function MetricCard({ icon: Icon, label, value, delta, tone = "neutral" }: Props) {
  return (
    <div className="rounded-2xl glass p-3.5 pressable">
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-0.5 text-[18px] font-semibold leading-tight text-white">{value}</p>
      {delta && (
        <p className="mt-0.5 text-[11px] font-medium text-emerald-300">{delta}</p>
      )}
    </div>
  );
}
