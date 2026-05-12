// APNs HTTP/2 push via fetch (Cloudflare Workers compatible).
// Uses ES256 JWT signed with the .p8 auth key.

function pemToPkcs8(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(cleaned);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64urlEncode(input: string | Uint8Array): string {
  let bin: string;
  if (typeof input === "string") {
    bin = input;
  } else {
    bin = "";
    for (let i = 0; i < input.length; i++) bin += String.fromCharCode(input[i]);
  }
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedJwt: { token: string; exp: number } | null = null;

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp - now > 300) return cachedJwt.token;

  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const p8 = process.env.APNS_KEY_P8;
  if (!keyId || !teamId || !p8) {
    throw new Error("Missing APNS_KEY_ID / APNS_TEAM_ID / APNS_KEY_P8 secrets");
  }

  const header = b64urlEncode(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const payload = b64urlEncode(JSON.stringify({ iss: teamId, iat: now }));
  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(p8),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new TextEncoder().encode(signingInput),
    ),
  );

  const token = `${signingInput}.${b64urlEncode(sig)}`;
  // APNs JWT must be refreshed every 20-60 minutes
  cachedJwt = { token, exp: now + 50 * 60 };
  return token;
}

export type ApnsResult = {
  token: string;
  ok: boolean;
  status: number;
  reason?: string;
};

export async function sendApnsNotification(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<ApnsResult> {
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) throw new Error("Missing APNS_BUNDLE_ID secret");

  const isProd = (process.env.APNS_PRODUCTION ?? "true") !== "false";
  const host = isProd ? "api.push.apple.com" : "api.sandbox.push.apple.com";

  const jwt = await getApnsJwt();

  const body = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
      "mutable-content": 1,
    },
    ...(payload.data ?? {}),
  });

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body,
  });

  if (res.ok) return { token: deviceToken, ok: true, status: res.status };

  let reason = "";
  try {
    const j = (await res.json()) as { reason?: string };
    reason = j.reason ?? "";
  } catch {
    reason = await res.text().catch(() => "");
  }
  return { token: deviceToken, ok: false, status: res.status, reason };
}