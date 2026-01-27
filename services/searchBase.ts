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
/**
 * 高度な正規化処理
 * 1. 小文字化・前後空白削除
 * 2. 全角英数字 → 半角英数字
 * 3. カタカナ → ひらがな
 * 4. 波線・ハイフン系の統一
 */
export function normalize(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    // 全角英数字を半角に
    .replace(/[ａ-ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    // カタカナをひらがなに変換
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
    // 波線(〜)系を統一
    .replace(/[~～〜〜〜]/g, "〜")
    // ハイフン系を統一（ハイフンはエスケープするか最後に置く）
    .replace(/[－−‐⁃‑‒–—―-]/g, "ー");
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