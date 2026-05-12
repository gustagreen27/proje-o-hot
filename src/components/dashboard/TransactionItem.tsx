import { CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";

export type TxStatus = "approved" | "pending" | "refunded";

export interface Transaction {
  id: string;
  buyer: string;
  amount: string;
  time: string;
  status: TxStatus;
}

const statusMap = {
  approved: { icon: CheckCircle2, color: "text-emerald-300", label: "Aprovada" },
  pending: { icon: Clock, color: "text-amber-300", label: "Pendente" },
  refunded: { icon: XCircle, color: "text-rose-300", label: "Reembolso" },
};

export function TransactionItem({ tx, index }: { tx: Transaction; index: number }) {
  const s = statusMap[tx.status];
  const Icon = s.icon;
  return (
    <div
      className="flex items-center gap-3 rounded-2xl glass px-3.5 py-3 pressable"
      style={{
        animation: `fade-in 360ms cubic-bezier(0.2,0.8,0.2,1) both`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 text-indigo-200">
        <CreditCard className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-white">{tx.buyer}</p>
        <p className="truncate text-[11px] text-white/50">{tx.id} · {tx.time}</p>
      </div>
      <div className="text-right">
        <p className="text-[14px] font-semibold text-white">{tx.amount}</p>
        <p className={`flex items-center justify-end gap-1 text-[11px] ${s.color}`}>
          <Icon className="h-3 w-3" /> {s.label}
        </p>
      </div>
    </div>
  );
}
