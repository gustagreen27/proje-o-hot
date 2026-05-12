import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.union([z.number(), z.null()]).optional(),
});

export const subscribePush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscriptionSchema.parse(input))
  .handler(async ({ data }) => {
    const { addSubscription } = await import("./push.server");
    const count = addSubscription(data as any);
    return { ok: true, count };
  });

export const unsubscribePush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ endpoint: z.string().url() }).parse(input))
  .handler(async ({ data }) => {
    const { removeSubscription } = await import("./push.server");
    const count = removeSubscription(data.endpoint);
    return { ok: true, count };
  });

const sendSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  tag: z.string().optional(),
  icon: z.string().optional(),
});

export const sendPush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const { sendToAll } = await import("./push.server");
    const { sendApnsToAll } = await import("./native-push.server");
    const [web, native] = await Promise.all([
      sendToAll(data).catch((e) => {
        console.error("[push] web push failed", e);
        return { sent: 0, total: 0 };
      }),
      sendApnsToAll({ title: data.title, body: data.body }).catch((e: unknown) => {
        console.error("[push] APNs failed", e);
        return { sent: 0, total: 0, errors: [String(e)] };
      }),
    ]);
    return {
      sent: web.sent + native.sent,
      total: web.total + native.total,
      web,
      native,
    };
  });

const deviceTokenSchema = z.object({
  token: z.string().min(40).max(200),
  platform: z.enum(["ios", "android"]).default("ios"),
  bundleId: z.string().max(200).optional(),
});

export const registerDeviceToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deviceTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { registerToken } = await import("./native-push.server");
    return registerToken(data);
  });
