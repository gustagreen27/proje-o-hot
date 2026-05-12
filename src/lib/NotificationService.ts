// Native iOS notification service using Capacitor.
// Safe to import in browser — every call is a no-op when not running natively.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type ScheduleOptions } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { generateTransactionId, randomSaleAmount } from "./transactionId";

export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export async function requestPermissions(): Promise<boolean> {
  if (!isNative()) return false;
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === "granted";
}

let listenersRegistered = false;

export async function registerListeners(): Promise<void> {
  if (!isNative() || listenersRegistered) return;
  listenersRegistered = true;

  await LocalNotifications.addListener("localNotificationReceived", (n) => {
    console.log("[notify] received", n);
  });

  await LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    console.log("[notify] action", a.actionId, a.notification);
  });
}

export type LocalPayload = {
  title: string;
  body: string;
  id?: number;
  delayMs?: number;
  data?: Record<string, unknown>;
};

export async function sendLocalNotification(payload: LocalPayload): Promise<boolean> {
  if (!isNative()) {
    console.warn("[notify] skipped: not running in native iOS shell");
    return false;
  }

  const granted = await requestPermissions();
  if (!granted) {
    console.warn("[notify] permission denied");
    return false;
  }

  const id = payload.id ?? Math.floor(Date.now() % 2_147_483_647);
  const delay = Math.max(0, payload.delayMs ?? 1500);

  const options: ScheduleOptions = {
    notifications: [
      {
        id,
        title: payload.title,
        body: payload.body,
        sound: "default",
        // badge is typed as number on iOS
        // @ts-expect-error - badge accepted by iOS plugin
        badge: 1,
        schedule: { at: new Date(Date.now() + delay), allowWhileIdle: true },
        extra: payload.data ?? {},
      },
    ],
  };

  await LocalNotifications.schedule(options);
  return true;
}

export async function hapticImpact(style: "light" | "medium" | "heavy" = "medium"): Promise<void> {
  if (!isNative()) return;
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  try {
    await Haptics.impact({ style: map[style] });
  } catch (e) {
    console.warn("[notify] haptic failed", e);
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.warn("[notify] haptic notify failed", e);
  }
}

export async function initNotifications(): Promise<void> {
  if (!isNative()) return;
  await registerListeners();
  await requestPermissions();
}

// ---- Sequence controller -------------------------------------------------

let activeTimers: ReturnType<typeof setTimeout>[] = [];
let activeIds: number[] = [];

export function stopSaleSequence(): void {
  activeTimers.forEach((t) => clearTimeout(t));
  activeTimers = [];
  if (isNative() && activeIds.length) {
    LocalNotifications.cancel({
      notifications: activeIds.map((id) => ({ id })),
    }).catch(() => undefined);
  }
  activeIds = [];
}

export type SequenceOptions = {
  amount: string | number;
  count?: number;
  interval?: number; // seconds
  platformName?: string;
  onProgress?: (sent: number, total: number) => void;
  onDone?: () => void;
};

/**
 * Schedules `count` native iOS local notifications, each with a unique HP id,
 * spaced by `interval` seconds. Cancellable via stopSaleSequence().
 */
export async function sendSaleNotificationSequence(
  opts: SequenceOptions,
): Promise<{ ok: boolean; scheduled: number; reason?: string }> {
  const count = Math.max(1, Math.floor(opts.count ?? 1));
  const interval = Math.max(0, opts.interval ?? 3);
  const platformName = opts.platformName ?? "Gucmart";
  const amountStr =
    typeof opts.amount === "number" ? opts.amount.toFixed(2) : String(opts.amount);

  await hapticImpact("medium");
  stopSaleSequence();

  if (!isNative()) {
    // Simulate progress for web preview
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        opts.onProgress?.(i + 1, count);
        if (i === count - 1) opts.onDone?.();
      }, interval * 1000 * i + 50);
      activeTimers.push(t);
    }
    return { ok: false, scheduled: 0, reason: "not-native" };
  }

  const granted = await requestPermissions();
  if (!granted) return { ok: false, scheduled: 0, reason: "denied" };

  const base = Date.now();
  const notifications = Array.from({ length: count }, (_, i) => {
    const id = Math.floor((base + i) % 2_147_483_647);
    activeIds.push(id);
    return {
      id,
      title: "Venda realizada com Cartão de Crédito",
      body: `Você recebeu: US$ ${amountStr} - ${generateTransactionId()}`,
      // @ts-expect-error subtitle supported on iOS
      subtitle: platformName,
      sound: "default",
      // @ts-expect-error badge supported on iOS
      badge: 1,
      schedule: { at: new Date(base + interval * 1000 * i + 1000), allowWhileIdle: true },
      extra: { platformName, amount: amountStr },
    };
  });

  await LocalNotifications.schedule({ notifications });

  // Progress reporting (UI feedback) — independent timers from native schedule
  for (let i = 0; i < count; i++) {
    const t = setTimeout(
      () => {
        opts.onProgress?.(i + 1, count);
        hapticSuccess().catch(() => undefined);
        if (i === count - 1) opts.onDone?.();
      },
      interval * 1000 * i + 1000,
    );
    activeTimers.push(t);
  }

  return { ok: true, scheduled: count };
}

/**
 * Sends the canonical "Venda realizada com Cartão de Crédito" notification
 * with a fresh dynamic HP transaction ID. Triggers haptic feedback and
 * schedules a real native iOS local notification (lockscreen, banner,
 * Notification Center, Dynamic Island, background).
 */
export async function sendSaleNotification(opts?: {
  amount?: string;
  delayMs?: number;
}): Promise<{ ok: boolean; transactionId: string; amount: string; reason?: string }> {
  const transactionId = generateTransactionId();
  const amount = opts?.amount ?? randomSaleAmount();

  await hapticImpact("medium");

  if (!isNative()) {
    return { ok: false, transactionId, amount, reason: "not-native" };
  }

  const granted = await requestPermissions();
  if (!granted) return { ok: false, transactionId, amount, reason: "denied" };

  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Venda realizada com Cartão de Crédito",
        body: `Você recebeu: ${amount} - ${transactionId}`,
        id: Math.floor(Date.now() % 2_147_483_647),
        sound: "default",
        // @ts-expect-error iOS badge supported
        badge: 1,
        schedule: { at: new Date(Date.now() + (opts?.delayMs ?? 3000)), allowWhileIdle: true },
        extra: { transactionId, amount },
      },
    ],
  });

  await hapticSuccess();
  return { ok: true, transactionId, amount };
}
