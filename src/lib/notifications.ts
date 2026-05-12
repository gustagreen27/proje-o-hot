export type NotificationType =
  | "credit-card"
  | "pix"
  | "subscription"
  | "refund"
  | "purchase";

export interface IOSNotification {
  id: string;
  title: string;
  body: string;
  appName: string;
  receivedAt: number; // epoch ms
  type: NotificationType;
}

const STORAGE_KEY = "hotmart-notify-history";

export const TITLES: Record<NotificationType, string> = {
  "credit-card": "Venda realizada com Cartão de Crédito",
  pix: "Venda realizada com Pix",
  subscription: "Assinatura renovada",
  refund: "Reembolso realizado",
  purchase: "Compra aprovada",
};

const NAMES = [
  "João S.",
  "Maria O.",
  "Carlos M.",
  "Ana R.",
  "Pedro L.",
  "Beatriz F.",
  "Lucas A.",
  "Renata T.",
];

const PRODUCTS = [
  "Curso Renda Extra",
  "Mentoria Pro",
  "Ebook Tráfego",
  "Workshop Vendas",
  "Plano Anual",
];

function randomHP() {
  const n = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
  return `HP${n}`;
}

function randomValue() {
  const v = (50 + Math.random() * 900).toFixed(2);
  return `US$ ${v}`;
}

export function generateRandomNotification(): IOSNotification {
  const types: NotificationType[] = [
    "credit-card",
    "credit-card",
    "credit-card",
    "pix",
    "subscription",
    "purchase",
    "refund",
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const value = randomValue();
  const hp = randomHP();
  return {
    id: crypto.randomUUID(),
    title: TITLES[type],
    body: `Você recebeu: ${value} - ${hp}`,
  appName: ".",
    receivedAt: Date.now(),
    type,
  };
}

export function loadHistory(): IOSNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(list: IOSNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
}

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "agora";
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const d = Math.floor(hr / 24);
  return `há ${d}d`;
}

export function buildCustom(input: {
  type: NotificationType;
  value: string;
  hp: string;
  name?: string;
  product?: string;
  titleOverride?: string;
  bodyOverride?: string;
  receivedAt?: number;
}): IOSNotification {
  return {
    id: crypto.randomUUID(),
    title: input.titleOverride?.trim() || TITLES[input.type],
    body: input.bodyOverride?.trim() || `Você recebeu: ${input.value} - ${input.hp}`,
    appName: ".",
    receivedAt: input.receivedAt ?? Date.now(),
    type: input.type,
  };
}

export function removeFromHistory(id: string) {
  const next = loadHistory().filter((n) => n.id !== id);
  saveHistory(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hotmart:remove", { detail: id }));
  }
}

export { NAMES, PRODUCTS };
