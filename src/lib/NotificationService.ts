// Native iOS notification service using Capacitor.
// Safe to import in browser — every call is a no-op when not running natively.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type ScheduleOptions } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

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
