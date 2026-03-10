import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatTimestamp(timestamp: string): string {
  const date = parseISO(timestamp);
  return format(date, "MMM dd, yyyy HH:mm:ss.SSS");
}

export function formatTimestampShort(timestamp: string): string {
  const date = parseISO(timestamp);
  return format(date, "HH:mm:ss.SSS");
}

export function formatRelativeTime(timestamp: string): string {
  const date = parseISO(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(timestamp: string): string {
  const date = parseISO(timestamp);
  return format(date, "MMM dd, yyyy");
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatMinuteBucket(timestamp: string): string {
  const date = parseISO(timestamp);
  return format(date, "HH:mm");
}
