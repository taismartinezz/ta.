import { randomBytes } from "crypto";

// Excludes 0/o/1/l/i to avoid visually ambiguous shareable links.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateSlug(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
