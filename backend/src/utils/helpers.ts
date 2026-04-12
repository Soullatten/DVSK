export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `DVSK-${y}${m}${d}-${rand}`;
}

export function generateSku(productName: string, color: string, size: string): string {
  const name = productName.replace(/[^a-zA-Z]/g, "").substring(0, 8).toUpperCase();
  const c = color.substring(0, 3).toUpperCase();
  return `DVSK-${name}-${c}-${size.toUpperCase()}`;
}
