import { BarChart3, Bell, Home, ShoppingBag, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TabId = "home" | "sales" | "analytics" | "alerts" | "profile";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "sales", label: "Vendas", icon: ShoppingBag },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "profile", label: "Perfil", icon: User },
];

export function BottomTabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-2">
      <div className="mx-auto max-w-[420px] rounded-3xl glass-strong px-2 py-2">
        <ul className="flex items-center justify-between">
          {tabs.map((t) => {
            const isActive = t.id === active;
            const Icon = t.icon;
            return (
              <li key={t.id} className="flex-1">
                <button
                  onClick={() => onChange(t.id)}
                  className="group flex w-full flex-col items-center gap-0.5 py-1.5 pressable"
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-2xl transition-all ${
                      isActive
                        ? "gradient-primary text-white shadow-lg"
                        : "text-white/60"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? "text-white" : "text-white/55"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export type { TabId };
