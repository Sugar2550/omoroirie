import fs from "fs";
import path from "path";

/* ========= 共通型 ========= */
export type BaseEntry = {
  id: number;
  names: string[];
  url: string;
};

type NameIndexEntry<T extends BaseEntry> = {
  name: string;
  entry: T;
};

/* ========= 正規化 ========= */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // カタカナ → ひらがな
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

/* ========= 検索ビルダー ========= */
export function buildSearch<T extends BaseEntry>(jsonPath: string) {
  let loaded = false;

  const byId = new Map<number, T>();
  const nameIndex: NameIndexEntry<T>[] = [];

  const cache = new Map<string, T[]>();
  const CACHE_LIMIT = 100;

  function loadOnce() {
    if (loaded) return;

    const raw = fs.readFileSync(path.resolve(jsonPath), "utf-8");
    const list = JSON.parse(raw) as T[];

    list.sort((a, b) => a.id - b.id);

    for (const e of list) {
      byId.set(e.id, e);

      for (const rawName of e.names) {
        nameIndex.push({
          name: normalize(rawName),
          entry: e
        });
      }
    }

    loaded = true;
  }

  return function search(keyword: string): T[] {
    if (!keyword) return [];

    loadOnce();

    const normalized = normalize(keyword);

    /* ---------- ID検索 ---------- */
    if (/^\d+$/.test(normalized)) {
      const found = byId.get(Number(normalized));
      return found ? [found] : [];
    }

    /* ---------- AND 検索 ---------- */
    const words = normalized
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4);

    // 単語1つだけの場合のみ 1文字制限
    if (words.length === 1 && words[0].length === 1) {
      return [];
    }

    const cacheKey = words.join(" ");
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const resultSet = new Set<T>();

    for (const { name, entry } of nameIndex) {
      if (words.every(w => name.includes(w))) {
        resultSet.add(entry);
      }
    }

    const result = Array.from(resultSet).sort((a, b) => a.id - b.id);

    cache.set(cacheKey, result);
    if (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      if (typeof oldest === "string") {
        cache.delete(oldest);
      }
    }

    return result;
  };
}
