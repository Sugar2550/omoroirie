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
const cache = new Map<string, EnemyEntry[]>();
const CACHE_LIMIT = 100;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ぁ-ん]/g, c =>
      String.fromCharCode(c.charCodeAt(0) + 0x60)
    ); // ひらがな→カタカナ
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
      if (!byName.has(key)) byName.set(key, new Set());
      byName.get(key)!.add(e);
    }
  }

  loaded = true;
}

export function searchEnemy(keyword: string): EnemyEntry[] {
  loadOnce();

  const key = normalize(keyword);

  if (key.length === 1 && !/^\d$/.test(key)) return [];

  if (cache.has(key)) return cache.get(key)!;

  let result: EnemyEntry[] = [];

  if (/^\d+$/.test(key)) {
    const found = byId.get(Number(key));
    result = found ? [found] : [];
  } else {
    const set = new Set<EnemyEntry>();

    if (byName.has(key)) {
      byName.get(key)!.forEach(e => set.add(e));
    }

    for (const [name, enemies] of byName.entries()) {
      if (name.includes(key)) {
        enemies.forEach(e => set.add(e));
      }
    }

    result = Array.from(set).sort((a, b) => a.id - b.id);
  }

  cache.set(key, result);
  if (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value);
  }

  return result;
}
