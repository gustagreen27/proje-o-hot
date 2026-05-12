export function generateTransactionId(): string {
  const digits = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
  return `HP${digits}`;
}

export function randomSaleAmount(): string {
  const v = (50 + Math.random() * 950).toFixed(2);
  return `US$ ${v}`;
}
