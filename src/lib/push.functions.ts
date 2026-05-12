import { createServerFn } from "@tanstack/react-start";
import webpush from "web-push";
import { z } from "zod";
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./vapid";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// In-memory store (ephemeral). Suficiente para uso pessoal de demo.
const g = globalThis as unknown as { __subs?: Map<string, webpush.PushSubscription> };
if (!g.__subs) g.__subs = new Map();
const subs = g.__subs;

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.union([z.number(), z.null()]).optional(),
});

export const getPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: VAPID_PUBLIC_KEY };
});

export const subscribePush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscriptionSchema.parse(input))
  .handler(async ({ data }) => {
    subs.set(data.endpoint, data as webpush.PushSubscription);
    return { ok: true, count: subs.size };
  });

export const unsubscribePush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ endpoint: z.string().url() }).parse(input))
  .handler(async ({ data }) => {
    subs.delete(data.endpoint);
    return { ok: true, count: subs.size };
  });

const sendSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  tag: z.string().optional(),
});

export const sendPush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const payload = JSON.stringify(data);
    const results: Array<{ endpoint: string; ok: boolean; status?: number }> = [];

    for (const [endpoint, sub] of subs.entries()) {
      try {
        await webpush.sendNotification(sub, payload, { TTL: 60 });
        results.push({ endpoint, ok: true });
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) subs.delete(endpoint);
        results.push({ endpoint, ok: false, status });
      }
    }

    return { sent: results.filter((r) => r.ok).length, total: results.length, results };
  });
