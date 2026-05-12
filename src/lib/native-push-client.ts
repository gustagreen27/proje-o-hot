// Registers the device with APNs when running inside the Capacitor (.ipa) shell.
// In a regular browser this is a no-op so the existing Web Push flow keeps working.

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

let initialized = false;

export async function initNativePush(
  registerOnServer: (input: {
    token: string;
    platform: "ios" | "android";
    bundleId?: string;
  }) => Promise<unknown>,
): Promise<{ ok: boolean; reason?: string; token?: string }> {
  if (!isNativeApp()) return { ok: false, reason: "not-native" };
  if (initialized) return { ok: true, reason: "already-initialized" };
  initialized = true;

  const platform = (Capacitor.getPlatform() as "ios" | "android") ?? "ios";

  const perm = await PushNotifications.checkPermissions();
  let granted = perm.receive === "granted";
  if (!granted) {
    const req = await PushNotifications.requestPermissions();
    granted = req.receive === "granted";
  }
  if (!granted) {
    initialized = false;
    return { ok: false, reason: "permission-denied" };
  }

  return new Promise((resolve) => {
    let resolved = false;

    PushNotifications.addListener("registration", async (token) => {
      if (resolved) return;
      resolved = true;
      try {
        await registerOnServer({ token: token.value, platform });
        resolve({ ok: true, token: token.value });
      } catch (e) {
        console.error("[native-push] register failed", e);
        resolve({ ok: false, reason: "server-register-failed", token: token.value });
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      if (resolved) return;
      resolved = true;
      console.error("[native-push] APNs registration error", err);
      initialized = false;
      resolve({ ok: false, reason: err.error || "registration-error" });
    });

    PushNotifications.register().catch((e) => {
      if (resolved) return;
      resolved = true;
      initialized = false;
      console.error("[native-push] register() threw", e);
      resolve({ ok: false, reason: "register-threw" });
    });
  });
}