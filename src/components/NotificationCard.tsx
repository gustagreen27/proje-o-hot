import { motion } from "framer-motion";
const iconUrl = "/icon-512.png";
import { formatRelative, type IOSNotification } from "@/lib/notifications";
import { useEffect, useState } from "react";

interface Props {
  notification: IOSNotification;
  stackIndex: number; // 0 = top/most recent
  total: number;
  expanded: boolean;
  onTap?: () => void;
}

export function NotificationCard({ notification, stackIndex, total, expanded, onTap }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(i);
  }, []);

  // stack collapsed visual: stackIndex 0 = full, 1 = peek, 2+ = deeper peek
  const collapsedScale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.96 : 0.92;
  const collapsedY = stackIndex === 0 ? 0 : stackIndex === 1 ? -56 : -68;
  const collapsedOpacity = stackIndex >= 3 ? 0 : 1;

  const targetY = expanded ? 0 : collapsedY;
  const targetScale = expanded ? 1 : collapsedScale;
  const targetOpacity = expanded ? 1 : collapsedOpacity;
  const zIndex = total - stackIndex;

  return (
    <motion.button
      type="button"
      onClick={onTap}
      layout
      initial={{ y: -120, opacity: 0, scale: 0.85 }}
      animate={{ y: targetY, opacity: targetOpacity, scale: targetScale }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
      style={{ zIndex }}
      className="ios-notif relative w-full text-left"
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <img
          src={iconUrl}
          alt="Hotmart"
          width={38}
          height={38}
          className="h-[38px] w-[38px] flex-shrink-0 rounded-[9px] shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-white">
              {notification.title}
            </p>
            <span className="flex-shrink-0 text-[13px] font-normal text-white/70">
              {formatRelative(notification.receivedAt, now)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[14px] leading-tight text-white/95">
            {notification.body}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
