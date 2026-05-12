import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bell, Check, Share, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
} from "@/lib/push-client";
import { subscribePush } from "@/lib/push.functions";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({
    meta: [
      { title: "Como instalar — Hotmart Notify" },
      { name: "description", content: "Passo a passo para receber push real no iPhone." },
    ],
  }),
});

type StepState = "todo" | "done";

function SetupPage() {
  const [isStandalone, setIsStandalone] = useState<StepState>("todo");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [swActive, setSwActive] = useState<StepState>("todo");
  const [subscribed, setSubscribed] = useState<StepState>("todo");
  const [isIOS, setIsIOS] = useState(false);
  const [busy, setBusy] = useState(false);

  const subscribeFn = useServerFn(subscribePush);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone ? "done" : "todo");

    if (!("Notification" in window)) setPermission("unsupported");
    else setPermission(Notification.permission);

    navigator.serviceWorker?.getRegistration().then((reg) => {
      setSwActive(reg?.active ? "done" : "todo");
    });
    getExistingSubscription().then((s) => setSubscribed(s ? "done" : "todo"));
  }, []);

  const enablePush = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!isPushSupported()) {
        toast.error("Push não suportado neste navegador.");
        return;
      }
      const sub = await subscribeToPush();
      const json = sub.toJSON() as any;
      await subscribeFn({
        data: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
      });
      setSubscribed("done");
      setPermission("granted");
      setSwActive("done");
      toast.success("Tudo pronto! Notificações reais ativadas.");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao ativar");
    } finally {
      setBusy(false);
    }
  };

  const allDone =
    isStandalone === "done" &&
    swActive === "done" &&
    subscribed === "done" &&
    permission === "granted";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Instalar no iPhone</h1>
      </header>

      <div className="mx-auto max-w-xl space-y-4 p-4">
        {allDone && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
            <p className="font-semibold">Tudo pronto. 🎉</p>
            <p className="text-muted-foreground">
              Você já pode receber push real. Volte ao app e use o botão Play no admin.
            </p>
          </div>
        )}

        <Step
          n={1}
          state={isStandalone}
          title="Abra no Safari do iPhone"
          desc="O push só funciona no Safari (iOS 16.4 ou superior). Não use Chrome no iPhone — ele não suporta web push."
        />

        <Step
          n={2}
          state={isStandalone}
          title="Adicionar à Tela de Início"
          desc="Toque no ícone de Compartilhar na barra do Safari, role e escolha 'Adicionar à Tela de Início'. Depois abra o app pelo ícone na home."
          icon={<Share className="h-4 w-4" />}
        >
          {!isStandalone && isIOS && (
            <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              Detectamos que você ainda não está no modo app instalado.
            </p>
          )}
        </Step>

        <Step
          n={3}
          state={permission === "granted" ? "done" : "todo"}
          title="Permitir notificações"
          desc="No primeiro toque em Ativar, o iOS pede permissão. Toque em Permitir."
          icon={<Bell className="h-4 w-4" />}
        />

        <Step
          n={4}
          state={swActive}
          title="Service Worker ativo"
          desc="Registrado automaticamente ao ativar notificações. Necessário para receber push em background."
          icon={<Smartphone className="h-4 w-4" />}
        />

        <Step
          n={5}
          state={subscribed}
          title="Inscrição enviada ao servidor"
          desc="Salvamos sua subscription para te enviar push real."
        />

        <button
          onClick={enablePush}
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {subscribed === "done" ? "Reativar notificações" : "Ativar notificações"}
        </button>

        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Importante</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>iOS 16.4+ exigido. iOS antigo não suporta web push.</li>
            <li>Web Push só funciona em HTTPS — use o link publicado, não o preview.</li>
            <li>Abra o app sempre pelo ícone na tela de início, não pelo Safari.</li>
            <li>Se mudar o ícone da home, peça permissão de novo.</li>
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
