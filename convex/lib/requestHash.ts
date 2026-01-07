/**
 * Canonical JSON serialization for stable request hashing.
 * Sorts keys, removes undefined, normalizes lists where order doesn't matter.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function canonicalizeJson(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(null);
  }

  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    // For arrays, we could sort if order doesn't matter, but for DataForSEO
    // arrays usually have semantic order (e.g., keywords list), so we preserve it
    return JSON.stringify(obj.map(canonicalizeJson));
  }

  // Sort keys and recursively canonicalize
  const sortedKeys = Object.keys(obj).sort();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canonical: Record<string, any> = {};
  
  for (const key of sortedKeys) {
    const value = obj[key];
    // Skip undefined values
    if (value !== undefined) {
      canonical[key] = typeof value === "object" && value !== null
        ? JSON.parse(canonicalizeJson(value))
        : value;
    }
  }

  return JSON.stringify(canonical);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeRequestHash(endpoint: string, payload: any): string {
  const canonical = canonicalizeJson({ endpoint, payload });
  // Use a simple hash (in production, you might want crypto.createHash)
  // For now, we'll use the canonical JSON as the hash (it's stable)
  // In a real implementation, you'd hash this with SHA-256 or similar
  return Buffer.from(canonical).toString("base64url");
}

