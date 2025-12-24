import { StageEntry } from "./stageTypes";

const byEntry = new Map<StageEntry, string[]>(); // 正規化済み名前群
const searchCache = new Map<string, StageEntry[]>();
const CACHE_LIMIT = 100;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .trim();
}

export function indexStages(entries: StageEntry[]) {
  for (const e of entries) {
    const names: string[] = [];

    for (const n of e.stageNames) {
      if (n) names.push(normalize(n));
    }
    if (e.mapName) names.push(normalize(e.mapName));
    if (e.mapKey) names.push(normalize(e.mapKey));

    byEntry.set(e, names);
  }
}

export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  const cached = searchCache.get(key);
  if (cached) return cached;

  const words = key.split(/\s+/).slice(0, 4);

  const result: StageEntry[] = [];

  for (const [entry, names] of byEntry.entries()) {
    const ok = words.every(w =>
      w.length === 1
        ? words.length > 1 && names.some(n => n.includes(w))
        : names.some(n => n.includes(w))
    );

    if (ok) result.push(entry);
  }

  searchCache.set(key, result);

  if (searchCache.size > CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (typeof oldest === "string") {
      searchCache.delete(oldest);
    }
  }

  return result;
}

