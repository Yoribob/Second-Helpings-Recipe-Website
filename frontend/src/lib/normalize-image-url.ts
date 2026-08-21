/** Decode common HTML entities and trim pasted image URLs. */
export function normalizeImageUrl(url: string): string {
  return url
    .trim()
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(normalizeImageUrl(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
