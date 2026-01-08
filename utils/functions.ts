import { subMonths } from "date-fns";

export const today = new Date();
export const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
export const monthsAgo = subMonths(new Date(), 20);

export const toNumber = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[,₦\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

export const buildQuery = (params: Record<string, any>) => {
  if (!params) return "";
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
  );
  const query = new URLSearchParams(filtered);
  return query.toString() ? `?${query.toString()}` : "";
};

export const defaultColors = [
  "#10B981", // green
  "#FB923C", // orange
  "#FDE047", // yellow
  "#3B82F6", // blue
  "#EF4444", // red
  "#A78BFA", // purple
  "#06B6D4", // teal
];

export const pickColor = (category?: string, idx?: number) => {
  if (category) {
    let sum = 0;
    for (let i = 0; i < category.length; i++) sum += category.charCodeAt(i);
    return defaultColors[sum % defaultColors.length];
  }

  // idx may be undefined → default to 0
  return defaultColors[(idx ?? 0) % defaultColors.length];
};


