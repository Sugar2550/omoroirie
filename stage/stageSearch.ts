import { StageEntry } from "./stageTypes.js";

const byWord = new Map<string, Set<StageEntry>>();
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
    const words = new Set<string>();

    [...e.stageNames, e.mapName, e.mapKey].forEach(name => {
      normalize(name)
        .split(/\s+/)
        .forEach(w => words.add(w));
    });

    for (const w of words) {
      if (!byWord.has(w)) byWord.set(w, new Set());
      byWord.get(w)!.add(e);
    }
  }
}

export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  const cached = searchCache.get(key);
  if (cached) return cached;

  const words = key.split(/\s+/).slice(0, 4);
  let result: Set<StageEntry> | null = null;

  for (const w of words) {
    const hit = byWord.get(w);
    if (!hit) return [];

    result = result
      ? new Set([...result].filter(e => hit.has(e)))
      : new Set(hit);
  }

  const list = result ? [...result] : [];
  searchCache.set(key, list);

  if (searchCache.size > CACHE_LIMIT) {
    searchCache.delete(searchCache.keys().next().value);
  }

  return list;
}
