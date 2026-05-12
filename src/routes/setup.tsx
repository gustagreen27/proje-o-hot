import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { isNative, requestPermissions, sendSaleNotification } from "@/lib/NotificationService";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({
    meta: [
      { title: "Como instalar — Vendas" },
      { name: "description", content: "Passo a passo para ativar notificações locais no iPhone." },
    ],
  }),
});

type StepState = "todo" | "done";

function SetupPage() {
  const [native, setNative] = useState<StepState>("todo");
  const [permission, setPermission] = useState<StepState>("todo");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNative(isNative() ? "done" : "todo");
  }, []);

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!isNative()) {
        toast.error("Funciona apenas dentro do app iOS instalado (.ipa).");
        return;
      }
      const ok = await requestPermissions();
      setPermission(ok ? "done" : "todo");
      if (!ok) {
        toast.error("Permissão negada. Ative em Ajustes › Notificações.");
        return;
      }
      const r = await sendSaleNotification({ delayMs: 2000 });
      if (r.ok) toast.success(`Notificação de teste enviada · ${r.transactionId}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao ativar");
    } finally {
      setBusy(false);
    }
  };

  const allDone = native === "done" && permission === "done";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Notificações no iPhone</h1>
      </header>

      <div className="mx-auto max-w-xl space-y-4 p-4">
        {allDone && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
            <p className="font-semibold">Tudo pronto. 🎉</p>
            <p className="text-muted-foreground">
              Notificações locais nativas ativas. Funciona offline, sem servidor.
            </p>
          </div>
        )}

        <Step
          n={1}
          state={native}
          title="Abrir o app instalado (.ipa)"
          desc="Notificações locais nativas só funcionam dentro do app iOS gerado pelo Capacitor / Codemagic."
          icon={<Smartphone className="h-4 w-4" />}
        />

        <Step
          n={2}
          state={permission}
          title="Permitir notificações"
          desc="Ao tocar em Ativar, o iOS pede permissão. Toque em Permitir."
          icon={<Bell className="h-4 w-4" />}
        />

        <button
          onClick={enable}
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {permission === "done" ? "Reenviar teste" : "Ativar notificações"}
        </button>

        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Importante</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>100% local — sem APNs, Firebase, OneSignal ou backend.</li>
            <li>Funciona offline, sem internet.</li>
            <li>Aparece na lockscreen, banner e Central de Notificações.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Step({
  n,
  state,
  title,
  desc,
  icon,
  children,
}: {
  n: number;
  state: StepState;
  title: string;
  desc: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          state === "done"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {state === "done" ? <Check className="h-4 w-4" /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        {children}
      </div>
    </div>
  );
}
