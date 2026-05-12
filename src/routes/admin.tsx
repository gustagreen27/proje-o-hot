import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Play, Send, Sparkles, Square, Trash2, X, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  TITLES,
  buildCustom,
  generateRandomNotification,
  loadHistory,
  removeFromHistory,
  type IOSNotification,
  type NotificationType,
} from "@/lib/notifications";
import { sendPush } from "@/lib/push.functions";

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

function randomHP() {
  return `HP${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
}

function AdminPage() {
  const [type, setType] = useState<NotificationType>("credit-card");
  const [value, setValue] = useState("360.24");
  const [currency, setCurrency] = useState("US$");
  const [hp, setHp] = useState("HP1105748621");
  const [titleOverride, setTitleOverride] = useState("");
  const [bodyOverride, setBodyOverride] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [history, setHistory] = useState<IOSNotification[]>([]);

  // Sequência de push real
  const [seqCount, setSeqCount] = useState(10);
  const [seqIntervalSec, setSeqIntervalSec] = useState(5);
  const [seqRandomValue, setSeqRandomValue] = useState(true);
  const [seqRunning, setSeqRunning] = useState(false);
  const [seqProgress, setSeqProgress] = useState(0);
  const seqAbort = useRef(false);

  const sendPushFn = useServerFn(sendPush);

  useEffect(() => {
    setHistory(loadHistory());
    const refresh = () => setHistory(loadHistory());
    window.addEventListener("hotmart:new", refresh);
    window.addEventListener("hotmart:remove", refresh);
    window.addEventListener("hotmart:clear", refresh);
    return () => {
      window.removeEventListener("hotmart:new", refresh);
      window.removeEventListener("hotmart:remove", refresh);
      window.removeEventListener("hotmart:clear", refresh);
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const tick = () => {
      window.dispatchEvent(
        new CustomEvent("hotmart:new", { detail: generateRandomNotification() }),
      );
    };
    const i = window.setInterval(tick, 5000);
    return () => clearInterval(i);
  }, [autoplay]);

  const dispatch = (n: IOSNotification) => {
    window.dispatchEvent(new CustomEvent("hotmart:new", { detail: n }));
  };

  const composeBody = (val: string, id: string) =>
    bodyOverride ||
    (buyerName
      ? `${buyerName} comprou — ${currency} ${val} - ${id}`
      : `Você recebeu: ${currency} ${val} - ${id}`);

  const handleSend = async () => {
    const body = composeBody(value, hp);
    const title = titleOverride || TITLES[type];
    const n = buildCustom({
      type,
      value: `${currency} ${value}`,
      hp,
      titleOverride: title,
      bodyOverride: body,
      receivedAt: Date.now() - minutesAgo * 60_000,
    });
    dispatch(n);
    try {
      const r = await sendPushFn({
        data: { title, body, tag: n.id, icon: avatarUrl || undefined },
      });
      if (r.total === 0) {
        toast.info("Adicionado ao app. Nenhum dispositivo inscrito para push real.");
      } else {
        toast.success(`Push real enviado para ${r.sent}/${r.total} dispositivo(s)`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha no push");
    }
  };

  const handleRandom = () => dispatch(generateRandomNotification());

  const handleClear = () => {
    localStorage.removeItem("hotmart-notify-history");
    window.dispatchEvent(new CustomEvent("hotmart:clear"));
  };

  const startSequence = async () => {
    if (seqRunning) return;
    seqAbort.current = false;
    setSeqRunning(true);
    setSeqProgress(0);
    toast.success(`Iniciando ${seqCount} push reais a cada ${seqIntervalSec}s`);
    for (let i = 0; i < seqCount; i++) {
      if (seqAbort.current) break;
      const val = seqRandomValue ? (50 + Math.random() * 900).toFixed(2) : value;
      const id = randomHP();
      const title = titleOverride || TITLES[type];
      const body = composeBody(val, id);
      try {
        await sendPushFn({
          data: { title, body, tag: `seq-${Date.now()}-${i}`, icon: avatarUrl || undefined },
        });
        // também aparece no app visual
        dispatch(
          buildCustom({
            type,
            value: `${currency} ${val}`,
            hp: id,
            titleOverride: title,
            bodyOverride: body,
          }),
        );
      } catch (e) {
        // continua
      }
      setSeqProgress(i + 1);
      if (i < seqCount - 1) {
        await new Promise((r) => setTimeout(r, seqIntervalSec * 1000));
      }
    }
    setSeqRunning(false);
    toast.success("Sequência finalizada");
  };

  const stopSequence = () => {
    seqAbort.current = true;
    setSeqRunning(false);
    toast.message("Sequência interrompida");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Gerador de notificações</h1>
      </header>

      <div className="mx-auto max-w-xl space-y-6 p-4">
        {/* Sequência de Push REAL */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sequência de Push real
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Quantidade</label>
              <input
                type="number"
                min={1}
                max={500}
                value={seqCount}
                onChange={(e) => setSeqCount(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Intervalo (segundos)
              </label>
              <input
                type="number"
                min={1}
                max={3600}
                value={seqIntervalSec}
                onChange={(e) => setSeqIntervalSec(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={seqRandomValue}
              onChange={(e) => setSeqRandomValue(e.target.checked)}
            />
            Variar valor/HP a cada notificação
          </label>

          {seqRunning && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(seqProgress / seqCount) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {seqProgress}/{seqCount} enviadas
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {!seqRunning ? (
              <button
                onClick={startSequence}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Play className="h-4 w-4 fill-current" /> Play
              </button>
            ) : (
              <button
                onClick={stopSequence}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90"
              >
                <Square className="h-4 w-4 fill-current" /> Stop
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Usa os valores configurados abaixo (tipo, moeda, valor, ID HP, título, descrição).
            Mantenha esta aba aberta para a sequência rodar.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Tipo de pagamento</label>
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
            <Field label="Moeda" value={currency} onChange={setCurrency} />
            <div className="col-span-2">
              <Field label="Valor" value={value} onChange={setValue} />
            </div>
          </div>

          <Field label="ID HP" value={hp} onChange={setHp} className="mt-3" />

          <Field
            label="Título (opcional — sobrescreve)"
            value={titleOverride}
            onChange={setTitleOverride}
            placeholder={TITLES[type]}
            className="mt-3"
          />
          <Field
            label="Descrição (opcional — sobrescreve)"
            value={bodyOverride}
            onChange={setBodyOverride}
            placeholder={`Você recebeu: ${currency} ${value} - ${hp}`}
            className="mt-3"
          />

          <div className="mt-3">
            <label className="mb-1 block text-xs text-muted-foreground">
              Horário (minutos atrás): {minutesAgo}m
            </label>
            <input
              type="range"
              min={0}
              max={120}
              value={minutesAgo}
              onChange={(e) => setMinutesAgo(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <span className="block font-semibold text-foreground">
              {titleOverride || TITLES[type]}
            </span>
            {bodyOverride || `Você recebeu: ${currency} ${value} - ${hp}`}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Adicionar notificação
            </button>
            <button
              onClick={handleRandom}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Sparkles className="h-4 w-4" /> Aleatória
            </button>
            <button
              onClick={() => setAutoplay((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                autoplay
                  ? "bg-destructive text-destructive-foreground"
                  : "border border-border bg-background hover:bg-accent"
              }`}
            >
              {autoplay ? "Parar autoplay" : "Iniciar autoplay"}
            </button>
            <button
              onClick={handleClear}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Limpar lista
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
            {history.slice(0, 30).map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{n.title}</div>
                  <div className="truncate text-muted-foreground">{n.body}</div>
                </div>
                <button
                  onClick={() => removeFromHistory(n.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
