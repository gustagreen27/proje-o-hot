import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendApnsNotification } from "./apns.server";

export async function registerToken(input: {
  token: string;
  platform: "ios" | "android";
  bundleId?: string;
}) {
  const { error } = await supabaseAdmin.from("device_tokens").upsert(
    {
      token: input.token,
      platform: input.platform,
      bundle_id: input.bundleId ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) {
    console.error("[native-push] upsert error", error);
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function sendApnsToAll(payload: { title: string; body: string }) {
  const { data, error } = await supabaseAdmin
    .from("device_tokens")
    .select("token")
    .eq("platform", "ios");
  if (error) {
    console.error("[native-push] list error", error);
    return { sent: 0, total: 0, errors: [error.message] };
  }
  const tokens = (data ?? []).map((r) => r.token);
  if (tokens.length === 0) return { sent: 0, total: 0, errors: [] };

  const results = await Promise.all(
    tokens.map((t) => sendApnsNotification(t, payload)),
  );

  // Cleanup tokens that APNs says are dead (BadDeviceToken / Unregistered).
  const dead = results
    .filter((r) => !r.ok && (r.status === 410 || r.reason === "BadDeviceToken"))
    .map((r) => r.token);
  if (dead.length > 0) {
    await supabaseAdmin.from("device_tokens").delete().in("token", dead);
  }

  const errors = results
    .filter((r) => !r.ok)
    .map((r) => `${r.status} ${r.reason ?? ""}`.trim());

  return {
    sent: results.filter((r) => r.ok).length,
    total: results.length,
    errors,
  };
}