const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function normalizeUniverseText(text: string) {
  return text.normalize('NFC').replace(/\r\n/g, '\n').trim();
}

export function textHash(text: string) {
  const bytes = new TextEncoder().encode(normalizeUniverseText(text));
  let hash = FNV_OFFSET;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function countPunctuation(text: string) {
  return (text.match(/[\p{P}\p{S}]/gu) ?? []).length;
}
