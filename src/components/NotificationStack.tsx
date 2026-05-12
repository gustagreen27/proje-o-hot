import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { NotificationCard } from "./NotificationCard";
import {
  generateRandomNotification,
  loadHistory,
  saveHistory,
  type IOSNotification,
} from "@/lib/notifications";
import { playDing, vibrate } from "@/lib/sound";

interface Props {
  autoSimulate: boolean;
  soundOn: boolean;
}

export function NotificationStack({ autoSimulate, soundOn }: Props) {
  const [list, setList] = useState<IOSNotification[]>([]);
  const [expanded, setExpanded] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    setList(loadHistory());
  }, []);

  // persist
  useEffect(() => {
    saveHistory(list);
  }, [list]);

  // listen for new notifications dispatched from anywhere (admin page, etc.)
  useEffect(() => {
    function onNew(e: Event) {
      const detail = (e as CustomEvent<IOSNotification>).detail;
      setList((prev) => [detail, ...prev].slice(0, 50));
      if (soundOn) playDing();
      vibrate();
    }
    window.addEventListener("hotmart:new", onNew as EventListener);
    return () => window.removeEventListener("hotmart:new", onNew as EventListener);
  }, [soundOn]);

  // auto-sim
  useEffect(() => {
    if (!autoSimulate) return;
    function schedule() {
      const delay = 6000 + Math.random() * 9000;
      return window.setTimeout(() => {
        const n = generateRandomNotification();
        window.dispatchEvent(new CustomEvent("hotmart:new", { detail: n }));
        timer = schedule();
      }, delay);
    }
    let timer = schedule();
    return () => clearTimeout(timer);
  }, [autoSimulate]);

  const visible = useMemo(() => (expanded ? list : list.slice(0, 4)), [list, expanded]);

  const onTap = () => {
    if (list.length > 1) setExpanded((v) => !v);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[420px] px-3"
      style={{ paddingTop: expanded ? 0 : 8 }}
    >
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {visible.map((n, idx) => (
            <NotificationCard
              key={n.id}
              notification={n}
              stackIndex={idx}
              total={visible.length}
              expanded={expanded || list.length <= 1}
              onTap={onTap}
            />
          ))}
        </AnimatePresence>
      </div>
      {list.length > 4 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mx-auto mt-3 block rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-md"
        >
          Mostrar {list.length} notificações
        </button>
      )}
    </div>
  );
}
