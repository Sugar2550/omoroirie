import fs from "fs";
import path from "path";

export type CharacterEntry = {
  id: number;
  names: string[];
  url: string;
};

const DATA_PATH = path.resolve("data/charaname.json");

let loaded = false;
let allCharacters: CharacterEntry[] = [];

const byId = new Map<number, CharacterEntry>();
const byName = new Map<string, Set<CharacterEntry>>();

const searchCache = new Map<string, CharacterEntry[]>();
const SEARCH_CACHE_LIMIT = 100;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

function loadOnce() {
  if (loaded) return;

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const json = JSON.parse(raw) as CharacterEntry[];

  allCharacters = json.sort((a, b) => a.id - b.id);

  for (const c of allCharacters) {
    byId.set(c.id, c);

    for (const name of c.names) {
      const key = normalize(name);
      if (!byName.has(key)) {
        byName.set(key, new Set());
      }
      byName.get(key)!.add(c);
    }
  }

  loaded = true;
}

export function searchCharacter(keyword: string): CharacterEntry[] {
  if (!keyword) return [];

  loadOnce();
  const normalized = normalize(keyword);

  // 一文字検索制限
  if (normalized.length === 1 && !/^\d$/.test(normalized)) {
    return [];
  }

  // キャッシュ
  const cached = searchCache.get(normalized);
  if (cached) return cached;

  let result: CharacterEntry[] = [];

  if (/^\d+$/.test(normalized)) {
    const found = byId.get(Number(normalized));
    result = found ? [found] : [];
  } else {
    const set = new Set<CharacterEntry>();

    if (byName.has(normalized)) {
      byName.get(normalized)!.forEach(c => set.add(c));
    }

    for (const [name, chars] of byName.entries()) {
      if (name.includes(normalized)) {
        chars.forEach(c => set.add(c));
      }
    }

    result = Array.from(set).sort((a, b) => a.id - b.id);
  }

  searchCache.set(normalized, result);

  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldestKey = searchCache.keys().next().value;
    if (typeof oldestKey === "string") {
      searchCache.delete(oldestKey);
    }
  }

  return result;
}
