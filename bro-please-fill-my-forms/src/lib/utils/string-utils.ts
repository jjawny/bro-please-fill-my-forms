export function truncate(text: string, maxLength: number = 15, suffix: string = "…"): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}
