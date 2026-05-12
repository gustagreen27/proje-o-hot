import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, Sparkles, Trash2 } from "lucide-react";
import {
  TITLES,
  buildCustom,
  generateRandomNotification,
  loadHistory,
  saveHistory,
  type NotificationType,
} from "@/lib/notifications";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Hotmart Notify" },
      { name: "description", content: "Crie e dispare notificações de venda customizadas." },
    ],
  }),
});

const TYPES: { value: NotificationType; label: string }[] = [
  { value: "credit-card", label: "Cartão de Crédito" },
  { value: "pix", label: "Pix" },
  { value: "purchase", label: "Compra aprovada" },
  { value: "subscription", label: "Assinatura renovada" },
  { value: "refund", label: "Reembolso" },
];

function AdminPage() {
  const [type, setType] = useState<NotificationType>("credit-card");
  const [value, setValue] = useState("360.24");
  const [currency, setCurrency] = useState("US$");
  const [hp, setHp] = useState("HP1105748621");
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");

  const dispatch = (n: ReturnType<typeof buildCustom>) => {
    window.dispatchEvent(new CustomEvent("hotmart:new", { detail: n }));
  };

  const handleSend = () => {
    const n = buildCustom({
      type,
      value: `${currency} ${value}`,
      hp,
      name,
      product,
    });
    dispatch(n);
  };

  const handleRandom = () => {
    dispatch(generateRandomNotification());
  };

  const handleClear = () => {
    saveHistory([]);
    // re-dispatch nothing — the lockscreen reads from localStorage on mount,
    // but we also want live screens to update; emit a special event.
    window.dispatchEvent(new CustomEvent("hotmart:clear"));
    window.location.href = "/";
  };

  const history = typeof window !== "undefined" ? loadHistory() : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Painel Admin</h1>
      </header>

      <div className="mx-auto max-w-xl space-y-6 p-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Nova notificação
          </h2>

          <label className="mb-2 block text-sm">Tipo de pagamento</label>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  type === t.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Moeda</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Valor</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="mb-1 mt-3 block text-xs text-muted-foreground">ID HP</label>
          <input
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Comprador (opcional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João S."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Produto (opcional)</label>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Curso X"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Preview: <span className="font-medium">{TITLES[type]}</span> · Você recebeu:{" "}
            {currency} {value} - {hp}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Disparar
            </button>
            <button
              onClick={handleRandom}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Sparkles className="h-4 w-4" /> Aleatória
            </button>
            <button
              onClick={handleClear}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Limpar histórico
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico ({history.length})
          </h2>
          <ul className="space-y-2">
            {history.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhuma notificação ainda.</li>
            )}
            {history.slice(0, 20).map((n) => (
              <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="font-medium">{n.title}</div>
                <div className="text-muted-foreground">{n.body}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
