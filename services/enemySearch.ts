import fs from "fs";
import path from "path";

export type EnemyEntry = {
  id: number;
  names: string[];
  url: string;
};

const DATA_PATH = path.resolve("data/enemyname.json");

let loaded = false;
let allEnemies: EnemyEntry[] = [];

const byId = new Map<number, EnemyEntry>();
const byName = new Map<string, Set<EnemyEntry>>();

const searchCache = new Map<string, EnemyEntry[]>();
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
  const json = JSON.parse(raw) as EnemyEntry[];

  allEnemies = json.sort((a, b) => a.id - b.id);

  for (const e of allEnemies) {
    byId.set(e.id, e);

    for (const name of e.names) {
      const key = normalize(name);
      if (!byName.has(key)) {
        byName.set(key, new Set());
      }
      byName.get(key)!.add(e);
    }
  }

  loaded = true;
}

export function searchEnemy(keyword: string): EnemyEntry[] {
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

  let result: EnemyEntry[] = [];

  if (/^\d+$/.test(normalized)) {
    const found = byId.get(Number(normalized));
    result = found ? [found] : [];
  } else {
    const set = new Set<EnemyEntry>();

    if (byName.has(normalized)) {
      byName.get(normalized)!.forEach(e => set.add(e));
    }

    for (const [name, enemies] of byName.entries()) {
      if (name.includes(normalized)) {
        enemies.forEach(e => set.add(e));
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
