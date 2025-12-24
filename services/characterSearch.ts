import fs from "fs";
import path from "path";

export type CharacterEntry = {
  id: number;
  names: string[];
  url: string;
};

const DATA_PATH = path.resolve("data/charaname.json");

let loaded = false;

const byId = new Map<number, CharacterEntry>();
const byName = new Map<string, Set<CharacterEntry>>();

const searchCache = new Map<string, CharacterEntry[]>();
const SEARCH_CACHE_LIMIT = 100;

/**
 * 正規化
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

/**
 * 初回ロード
 */
function loadOnce(): void {
  if (loaded) return;

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const json = JSON.parse(raw) as CharacterEntry[];

  for (const c of json) {
    byId.set(c.id, c);

    for (const name of c.names) {
      const key = normalize(name);
      let set = byName.get(key);
      if (!set) {
        set = new Set<CharacterEntry>();
        byName.set(key, set);
      }
      set.add(c);
    }
  }

  loaded = true;
}

/**
 * 高速キャラ検索
 */
export function searchCharacter(keyword: string): CharacterEntry[] {
  if (!keyword) return [];

  loadOnce();

  // 単語分割（最大4）
  const words = keyword
    .split(/\s+/)
    .map(w => normalize(w))
    .filter(w => w.length > 0)
    .slice(0, 4);

  if (words.length === 0) return [];

  // 1文字制限（単語1つのときのみ）
  if (
    words.length === 1 &&
    words[0].length === 1 &&
    !/^\d$/.test(words[0])
  ) {
    return [];
  }

  const cacheKey = words.join(" ");
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  // -----------------------------
  // ID検索（単語1つ）
  // -----------------------------
  if (words.length === 1 && /^\d+$/.test(words[0])) {
    const found = byId.get(Number(words[0]));
    const result = found ? [found] : [];
    searchCache.set(cacheKey, result);
    return result;
  }

  // -----------------------------
  // 各単語の候補集合を作成
  // -----------------------------
  const candidateSets: Set<CharacterEntry>[] = [];

  for (const word of words) {
    const set = new Set<CharacterEntry>();

    // 完全一致
    const exact = byName.get(word);
    if (exact) {
      exact.forEach(c => set.add(c));
    }

    // 部分一致（必要最小限）
    for (const [name, chars] of byName.entries()) {
      if (name.includes(word)) {
        chars.forEach(c => set.add(c));
      }
    }

    if (set.size === 0) {
      searchCache.set(cacheKey, []);
      return [];
    }

    candidateSets.push(set);
  }

  // -----------------------------
  // 最小集合から AND 絞り込み
  // -----------------------------
  candidateSets.sort((a, b) => a.size - b.size);

  let resultSet = new Set(candidateSets[0]);

  for (let i = 1; i < candidateSets.length; i++) {
    const next = candidateSets[i];
    resultSet = new Set([...resultSet].filter(c => next.has(c)));
    if (resultSet.size === 0) break;
  }

  const result = Array.from(resultSet).sort((a, b) => a.id - b.id);

  // キャッシュ
  searchCache.set(cacheKey, result);
  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (typeof oldest === "string") {
      searchCache.delete(oldest);
    }
  }

  return result;
}
