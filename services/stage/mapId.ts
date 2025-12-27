export function normalizeCategory(raw: string): string {
  return raw.startsWith("R") ? raw.slice(1) : raw;
}

export function toMapCode(rawMapId: string, rawCategory: string) {
  const num = rawMapId.padStart(5, "0");
  const tail = num.slice(2);
  const category = normalizeCategory(rawCategory);

  return {
    rawMapId: num,
    mapCode: `${category}${tail}`
  };
}
