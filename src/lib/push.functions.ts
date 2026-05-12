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
    return sendToAll(data);
  });
