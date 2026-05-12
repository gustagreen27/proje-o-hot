import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import wallpaperUrl from "@/assets/wallpaper.jpg";
import { NotificationStack } from "@/components/NotificationStack";
import { Bell, BellOff, Send, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
} from "@/lib/push-client";
import { initNativePush, isNativeApp } from "@/lib/native-push-client";
import {
  hapticImpact,
  hapticSuccess,
  initNotifications,
  isNative,
  sendLocalNotification,
} from "@/lib/NotificationService";
import {
  registerDeviceToken,
  sendPush,
  subscribePush,
  unsubscribePush,
} from "@/lib/push.functions";

export const Route = createFileRoute("/")({
  component: LockScreen,
  head: () => ({
    meta: [
      { title: "Hotmart Notify — Notificações em tempo real" },
      {
        name: "description",
        content: "Simulador realista de notificações iOS para vendas Hotmart.",
      },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "." },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
});

function LockScreen() {
  // mounted gate evita hydration mismatch do relógio
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [autoSim, setAutoSim] = useState(true);
  const [sound, setSound] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const subscribeFn = useServerFn(subscribePush);
  const unsubscribeFn = useServerFn(unsubscribePush);
  const sendFn = useServerFn(sendPush);
  const registerNativeFn = useServerFn(registerDeviceToken);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 30_000);
    getExistingSubscription().then((s) => setPushOn(!!s));
    // Native (.ipa via Capacitor): auto-register with APNs on first launch.
    if (isNativeApp()) {
      initNativePush((input) => registerNativeFn({ data: input }))
        .then((r) => {
          if (r.ok) setPushOn(true);
        })
        .catch((e) => console.error("[native-push] init failed", e));
      // Init local notifications (permissions + listeners) for native shell.
      initNotifications().catch((e) => console.error("[notify] init failed", e));
    }
    return () => clearInterval(i);
  }, [registerNativeFn]);

  const time = now
    ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
  const date = now
    ? now
        .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
        .replace(/^./, (c) => c.toUpperCase())
    : "";

  const togglePush = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (pushOn) {
        if (isNativeApp()) {
          toast.info("Para desativar push no app, use os Ajustes do iPhone.");
          return;
        }
        const sub = await getExistingSubscription();
        if (sub) {
          await unsubscribeFn({ data: { endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setPushOn(false);
        toast.success("Notificações desativadas");
      } else {
        if (isNativeApp()) {
          const r = await initNativePush((input) => registerNativeFn({ data: input }));
          if (r.ok) {
            setPushOn(true);
            toast.success("Notificações nativas ativadas!");
          } else {
            toast.error(`Falha APNs: ${r.reason ?? "desconhecido"}`);
          }
          return;
        }
        if (!isPushSupported()) {
          toast.error(
            "Push não suportado. No iPhone: adicione à Tela de Início e abra como app.",
          );
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
        setPushOn(true);
        toast.success("Notificações ativadas!");
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao alterar notificações");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    try {
      const r = await sendFn({
        data: {
          title: "Venda realizada com Cartão de Crédito",
          body: "Você recebeu: US$ 360.24 - HP1105748621",
          tag: "hotmart-test",
        },
      });
      toast.success(`Enviado para ${r.sent}/${r.total} dispositivo(s)`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    }
  };

  const sendLocal = async () => {
    await hapticImpact("medium");
    if (!isNative()) {
      toast.error("Notificação local nativa só funciona no app iOS instalado.");
      return;
    }
    const ok = await sendLocalNotification({
      title: "Nova transação",
      body: "Você recebeu um novo pagamento.",
      delayMs: 3000,
    });
    if (ok) {
      await hapticSuccess();
      toast.success("Notificação agendada (3s) — bloqueie a tela para ver.");
    } else {
      toast.error("Permissão de notificação negada.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="lock-wallpaper" style={{ backgroundImage: `url(${wallpaperUrl})` }} />

      <div className="flex items-center justify-between px-7 pt-3 text-[15px] font-semibold">
        <span suppressHydrationWarning>{time || "\u00A0"}</span>
        <span className="flex items-center gap-1.5 opacity-90">
          <span className="text-xs">5G</span>
          <span className="inline-block h-2.5 w-6 rounded-[3px] border border-white/80 px-[1px]">
            <span className="block h-full w-[80%] rounded-[1px] bg-white" />
          </span>
        </span>
      </div>

      <header className="mt-6 flex flex-col items-center">
        <p className="text-[15px] font-medium opacity-90" suppressHydrationWarning>
          {date || "\u00A0"}
        </p>
        <h1
          className="-mt-1 text-[88px] font-light leading-none tracking-tight"
          suppressHydrationWarning
        >
          {time || "\u00A0"}
        </h1>
      </header>

      <section className="mt-8 pb-40">
        <NotificationStack autoSimulate={autoSim} soundOn={sound} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 pb-6">
        {mounted && (
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs backdrop-blur-xl">
            <button
              onClick={togglePush}
              disabled={busy}
              className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                pushOn ? "bg-white text-black" : "text-white/80"
              }`}
            >
              {pushOn ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              Push
            </button>
            <button
              onClick={sendTest}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-white/80"
            >
              <Send className="h-3.5 w-3.5" /> Enviar
            </button>
            <button
              onClick={sendLocal}
              className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-white"
            >
              <Bell className="h-3.5 w-3.5" /> Notificar iOS
            </button>
            <button
              onClick={() => setAutoSim((v) => !v)}
              className={`rounded-full px-3 py-1 ${autoSim ? "bg-white text-black" : "text-white/80"}`}
            >
              Auto
            </button>
            <button
              onClick={() => setSound((v) => !v)}
              className={`rounded-full px-3 py-1 ${sound ? "bg-white text-black" : "text-white/80"}`}
            >
              Som
            </button>
            <Link to="/setup" className="rounded-full px-3 py-1 text-white/80">
              Instalar
            </Link>
            <Link to="/admin" className="flex items-center gap-1 rounded-full px-3 py-1 text-white/80">
              <Settings2 className="h-3.5 w-3.5" /> Admin
            </Link>
          </div>
        )}
        <div className="h-1 w-32 rounded-full bg-white/80" />
      </div>
    </main>
  );
}
