import { Bell, FileBarChart, RefreshCw, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "primary" | "success" | "warn" | "neutral";
}

const toneMap = {
  primary: "gradient-primary",
  success: "gradient-success",
  warn: "gradient-warn",
  neutral: "bg-white/10",
};

export function QuickActions({
  onNotify,
  onSimulate,
  onRefresh,
  onReports,
}: {
  onNotify: () => void;
  onSimulate: () => void;
  onRefresh: () => void;
  onReports: () => void;
}) {
  const actions: Action[] = [
    { id: "notify", label: "Notificar", icon: Bell, onClick: onNotify, tone: "primary" },
    { id: "sale", label: "Simular", icon: Sparkles, onClick: onSimulate, tone: "success" },
    { id: "refresh", label: "Atualizar", icon: RefreshCw, onClick: onRefresh, tone: "warn" },
    { id: "reports", label: "Relatórios", icon: FileBarChart, onClick: onReports, tone: "neutral" },
  ];

  return (
    <div className="mt-4 grid grid-cols-4 gap-3 px-5">
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={a.onClick}
          className="flex flex-col items-center gap-1.5 pressable"
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg ${toneMap[a.tone ?? "neutral"]}`}
          >
            <a.icon className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-medium text-white/80">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
