import fs from "fs";
import path from "path";

export type EnemyEntry = {
  id: number;
  names: string[];
  url: string;
};

const DATA_PATH = path.resolve("data/enemyname.json");

let loaded = false;

const byId = new Map<number, EnemyEntry>();
const byName = new Map<string, Set<EnemyEntry>>();

const searchCache = new Map<string, EnemyEntry[]>();
const SEARCH_CACHE_LIMIT = 100;

/**
 * 正規化（ひらがな・カタカナ統一）
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
 * 初回ロード（起動時インデックス）
 */
function loadOnce(): void {
  if (loaded) return;

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const json = JSON.parse(raw) as EnemyEntry[];

  for (const e of json) {
    byId.set(e.id, e);

    for (const name of e.names) {
      const key = normalize(name);
      let set = byName.get(key);
      if (!set) {
        set = new Set<EnemyEntry>();
        byName.set(key, set);
      }
      set.add(e);
    }
  }

  loaded = true;
}

/**
 * 高速 敵キャラ検索
 */
export function searchEnemy(keyword: string): EnemyEntry[] {
  if (!keyword) return [];

  loadOnce();

  // スペース区切り（最大4語）
  const words = keyword
    .split(/\s+/)
    .map(w => normalize(w))
    .filter(w => w.length > 0)
    .slice(0, 4);

  if (words.length === 0) return [];

  // 一文字検索制限（単語1つのときのみ）
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
  // 単語ごとの候補集合
  // -----------------------------
  const candidateSets: Set<EnemyEntry>[] = [];

  for (const word of words) {
    const set = new Set<EnemyEntry>();

    // 完全一致
    const exact = byName.get(word);
    if (exact) {
      exact.forEach(e => set.add(e));
    }

    // 部分一致
    for (const [name, enemies] of byName.entries()) {
      if (name.includes(word)) {
        enemies.forEach(e => set.add(e));
      }
    }

    if (set.size === 0) {
      searchCache.set(cacheKey, []);
      return [];
    }

    candidateSets.push(set);
  }

  // -----------------------------
  // AND検索（最小集合起点）
  // -----------------------------
  candidateSets.sort((a, b) => a.size - b.size);

  let resultSet = new Set(candidateSets[0]);

  for (let i = 1; i < candidateSets.length; i++) {
    const next = candidateSets[i];
    resultSet = new Set([...resultSet].filter(e => next.has(e)));
    if (resultSet.size === 0) break;
  }

  const result = Array.from(resultSet).sort((a, b) => a.id - b.id);

  // -----------------------------
  // キャッシュ管理
  // -----------------------------
  searchCache.set(cacheKey, result);
  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (typeof oldest === "string") {
      searchCache.delete(oldest);
    }
  }

  return result;
}

