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
  if (!str) return "";
  return str
    .trim()
    // 1. 全角英数字を半角に
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    // 2. 小文字化
    .toLowerCase()
    // 3. カタカナをひらがな化
    .replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    // 4. 記号の統一
    .replace(/[~～〜〜〜]/g, "〜")
    .replace(/[－−‐⁃‑‒–—―-]/g, "ー");
}

/* ========= 検索ビルダー ========= */
export function buildSearch<T extends BaseEntry>(jsonPath: string) {
  let loaded = false;

  const byId = new Map<number, T>();
  const nameIndex: NameIndexEntry<T>[] = [];
  const rawData: T[] = []; // force検索用

  const cache = new Map<string, T[]>();
  const CACHE_LIMIT = 100;

  function loadOnce() {
    if (loaded) return;

    const raw = fs.readFileSync(path.resolve(jsonPath), "utf-8");
    const list = JSON.parse(raw) as T[];

    list.sort((a, b) => a.id - b.id);

    for (const e of list) {
      byId.set(e.id, e);
      rawData.push(e);

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
    let raw = keyword.trim();
    if (!raw) return [];

    // --- -force フラグ判定 ---
    const isForce = raw.includes("-force");
    if (isForce) {
      raw = raw.replace("-force", "").trim();
    }

    loadOnce();

    // 通常時のID検索
    if (!isForce && /^\d+$/.test(raw)) {
      const found = byId.get(Number(raw));
      if (found) return [found];
    }

    // 検索語の正規化
    const words = isForce 
      ? raw.split(/\s+/).filter(Boolean) 
      : normalize(raw).split(/\s+/).filter(Boolean);

    // キャッシュ確認 (force時はキャッシュしない)
    const cacheKey = words.join(" ");
    if (!isForce) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const resultSet = new Set<T>();

    if (isForce) {
      // 正規化なしの生データ比較
      for (const entry of rawData) {
        const fullName = entry.names.join(" ");
        if (words.every(w => fullName.includes(w))) {
          resultSet.add(entry);
        }
      }
    } else {
      // 正規化済みインデックスから比較
      for (const { name, entry } of nameIndex) {
        if (words.every(w => name.includes(w))) {
          resultSet.add(entry);
        }
      }
    }

    const result = Array.from(resultSet).sort((a, b) => a.id - b.id);

    // キャッシュ保存
    if (!isForce) {
      cache.set(cacheKey, result);
      if (cache.size > CACHE_LIMIT) {
        const oldest = cache.keys().next().value;
        if (typeof oldest === "string") cache.delete(oldest);
      }
    }

    return result;
  };
}