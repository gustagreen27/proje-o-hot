import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import wallpaperUrl from "@/assets/wallpaper.jpg";
import { NotificationStack } from "@/components/NotificationStack";
import { Settings2 } from "lucide-react";

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
      { name: "apple-mobile-web-app-title", content: "Hotmart" },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
    ],
  }),
});

function LockScreen() {
  const [now, setNow] = useState(new Date());
  const [autoSim, setAutoSim] = useState(true);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now
    .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="lock-wallpaper" style={{ backgroundImage: `url(${wallpaperUrl})` }} />

      {/* status bar */}
      <div className="flex items-center justify-between px-7 pt-3 text-[15px] font-semibold">
        <span>{time}</span>
        <span className="flex items-center gap-1.5 opacity-90">
          <span className="text-xs">5G</span>
          <span className="inline-block h-2.5 w-6 rounded-[3px] border border-white/80 px-[1px]">
            <span className="block h-full w-[80%] rounded-[1px] bg-white" />
          </span>
        </span>
      </div>

      {/* time + date */}
      <header className="mt-6 flex flex-col items-center">
        <p className="text-[15px] font-medium opacity-90">{date}</p>
        <h1 className="-mt-1 text-[88px] font-light leading-none tracking-tight">{time}</h1>
      </header>

      <section className="mt-8 pb-32">
        <NotificationStack autoSimulate={autoSim} soundOn={sound} />
      </section>

      {/* bottom controls */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 pb-6">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs backdrop-blur-xl">
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
          <Link
            to="/admin"
            className="flex items-center gap-1 rounded-full px-3 py-1 text-white/80"
          >
            <Settings2 className="h-3.5 w-3.5" /> Admin
          </Link>
        </div>
        <div className="h-1 w-32 rounded-full bg-white/80" />
      </div>
    </main>
  );
}
