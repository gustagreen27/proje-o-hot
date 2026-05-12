import webpush from "web-push";
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./vapid";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

// In-memory store (ephemeral). Suficiente para uso pessoal.
const g = globalThis as unknown as { __subs?: Map<string, webpush.PushSubscription> };
if (!g.__subs) g.__subs = new Map();
const subs = g.__subs!;

export function addSubscription(sub: webpush.PushSubscription) {
  subs.set(sub.endpoint, sub);
  return subs.size;
}

export function removeSubscription(endpoint: string) {
  subs.delete(endpoint);
  return subs.size;
}

export async function sendToAll(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  ensureConfigured();
  const json = JSON.stringify(payload);
  const results: Array<{ endpoint: string; ok: boolean; status?: number }> = [];

  for (const [endpoint, sub] of subs.entries()) {
    try {
      await webpush.sendNotification(sub, json, { TTL: 60 });
      results.push({ endpoint, ok: true });
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) subs.delete(endpoint);
      results.push({ endpoint, ok: false, status });
    }
  }

  return { sent: results.filter((r) => r.ok).length, total: results.length };
}
