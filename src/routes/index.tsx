import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Header } from "@/components/dashboard/Header";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  TransactionItem,
  type Transaction,
} from "@/components/dashboard/TransactionItem";
import { BottomTabBar, type TabId } from "@/components/dashboard/BottomTabBar";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

import {
  hapticImpact,
  initNotifications,
  isNative,
  sendSaleNotification,
} from "@/lib/NotificationService";
import { generateTransactionId, randomSaleAmount } from "@/lib/transactionId";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Vendas — Dashboard" },
      {
        name: "description",
        content: "Dashboard premium para acompanhar vendas em tempo real no iPhone.",
      },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Vendas" },
      { name: "theme-color", content: "#07070b" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
});

const BUYERS = [
  "João Silva",
  "Maria Oliveira",
  "Carlos Mendes",
  "Ana Ribeiro",
  "Pedro Lima",
  "Beatriz Faria",
  "Lucas Almeida",
  "Renata Tavares",
];

function newTx(): Transaction {
  const buyer = BUYERS[Math.floor(Math.random() * BUYERS.length)];
  const statuses: Transaction["status"][] = [
    "approved",
    "approved",
    "approved",
    "pending",
    "refunded",
  ];
  return {
    id: generateTransactionId(),
    buyer,
    amount: randomSaleAmount(),
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    status: statuses[Math.floor(Math.random() * statuses.length)],
  };
}

function Dashboard() {
  const [tab, setTab] = useState<TabId>("home");
  const [refreshing, setRefreshing] = useState(false);
  // Start empty so SSR markup matches initial client render — fill in effect.
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    setTxs(Array.from({ length: 5 }, () => newTx()));
    if (isNative()) {
      initNotifications().catch((e) => console.error("[notify] init failed", e));
    }
  }, []);

  const onNotify = async () => {
    const r = await sendSaleNotification();
    if (r.ok) {
      toast.success(`Notificação iOS agendada · ${r.transactionId}`);
    } else if (r.reason === "not-native") {
      toast.error("Funciona apenas no app iOS instalado (.ipa)");
    } else {
      toast.error("Permissão de notificação negada nos Ajustes do iPhone.");
    }
  };

  const onSimulate = async () => {
    await hapticImpact("light");
    const tx = newTx();
    setTxs((prev) => [tx, ...prev].slice(0, 20));
    toast.success(`Nova venda · ${tx.amount}`);
    // Also fire a real native notification mirroring the simulated sale.
    sendSaleNotification({ amount: tx.amount }).catch(() => undefined);
  };

  const onRefresh = async () => {
    await hapticImpact("light");
    setRefreshing(true);
    setTimeout(() => {
      setTxs(Array.from({ length: 5 }, () => newTx()));
      setRefreshing(false);
    }, 700);
  };

  const onReports = async () => {
    await hapticImpact("light");
    toast("Relatórios em breve");
  };

  const metrics = useMemo(
    () => [
      { icon: ShoppingCart, label: "Vendas hoje", value: "47", delta: "+8 hoje", tone: "primary" as const },
      { icon: Percent, label: "Conversão", value: "6,8%", delta: "+0,4%", tone: "success" as const },
      { icon: DollarSign, label: "Ticket médio", value: "US$ 184", delta: "+12", tone: "warn" as const },
      { icon: Banknote, label: "Comissões", value: "US$ 2.430", delta: "+340", tone: "neutral" as const },
      { icon: TrendingUp, label: "Mensal", value: "US$ 38.2k", delta: "+18,7%", tone: "primary" as const },
    ],
    [],
  );

  return (
    <main className="dash-bg relative min-h-screen pb-32 text-white">
      {/* Status bar safe area spacer */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <Header name="Trader" />

      {/* Pull-to-refresh visual indicator */}
      {refreshing && (
        <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-[11px] text-white/80">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Atualizando
        </div>
      )}

      <DashboardCard />

      <QuickActions
        onNotify={onNotify}
        onSimulate={onSimulate}
        onRefresh={onRefresh}
        onReports={onReports}
      />

      {/* Métricas */}
      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold tracking-wide text-white/80">Métricas</h3>
          <button className="text-[11px] text-white/50">Ver tudo</button>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
          {metrics.map((m) => (
            <div key={m.label} className="min-w-[140px]">
              <MetricCard {...m} />
            </div>
          ))}
        </div>
      </section>

      {/* Transações */}
      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold tracking-wide text-white/80">
            Transações recentes
          </h3>
          <Link to="/admin" className="text-[11px] text-white/50">
            Admin
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {refreshing
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[68px] rounded-2xl skeleton" />
              ))
            : txs.map((tx, i) => <TransactionItem key={tx.id} tx={tx} index={i} />)}
        </div>
      </section>

      <BottomTabBar active={tab} onChange={setTab} />
    </main>
  );
}
