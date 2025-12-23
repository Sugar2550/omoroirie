import fs from "fs";
import path from "path";

export type CharacterEntry = {
  id: number;
  names: string[];
  url: string;
};

const DATA_PATH = path.resolve("data/charaname.json");

/* ------------------------------
 * 内部キャッシュ / インデックス
 * ------------------------------ */
let loaded = false;
let allCharacters: CharacterEntry[] = [];

const byId = new Map<number, CharacterEntry>();
const byName = new Map<string, Set<CharacterEntry>>();

// 検索結果キャッシュ（簡易 LRU）
const searchCache = new Map<string, CharacterEntry[]>();
const SEARCH_CACHE_LIMIT = 100;

/* ------------------------------
 * 正規化
 * ------------------------------ */
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/* ------------------------------
 * 起動時ロード & インデックス構築
 * ------------------------------ */
function loadOnce() {
  if (loaded) return;

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const json = JSON.parse(raw) as CharacterEntry[];

  // ID 昇順で保持
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

/* ------------------------------
 * 検索本体
 * ------------------------------ */
export function searchCharacter(keyword: string): CharacterEntry[] {
  loadOnce();

  const normalized = normalize(keyword);

  // ---------- 一文字検索制限 ----------
  if (normalized.length === 1 && !/^\d$/.test(normalized)) {
    return [];
  }

  // ---------- キャッシュ ----------
  if (searchCache.has(normalized)) {
    return searchCache.get(normalized)!;
  }

  let result: CharacterEntry[] = [];

  // ---------- ID 検索（O(1)） ----------
  if (/^\d+$/.test(normalized)) {
    const id = Number(normalized);
    const found = byId.get(id);
    result = found ? [found] : [];
  } else {
    const set = new Set<CharacterEntry>();

    // 完全一致（最優先）
    if (byName.has(normalized)) {
      byName.get(normalized)!.forEach(c => set.add(c));
    }

    // 部分一致（名前インデックスのみ走査）
    for (const [name, chars] of byName.entries()) {
      if (name.includes(normalized)) {
        chars.forEach(c => set.add(c));
      }
    }

    result = Array.from(set).sort((a, b) => a.id - b.id);
  }

  // ---------- 検索結果キャッシュ ----------
  searchCache.set(normalized, result);
  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }

  return result;
}
