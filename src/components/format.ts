export function formatCurrency(value: number | string | null | undefined, currency = "IDR") {
  const n = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(n);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatMonth(monthStr: string | null | undefined) {
  if (!monthStr) return "-";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(parseInt(year, 10), month, 1);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
    }
  }
  return monthStr;
}

export function formatShortMonth(monthStr: string | null | undefined) {
  if (!monthStr) return "-";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(2024, month, 1);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);
    }
  }
  return monthStr;
}

export function formatCompactNumber(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}
