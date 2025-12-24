import { StageEntry } from "./stageTypes.js";

const byEntry = new Map<StageEntry, string[]>(); // 正規化済み検索対象
const searchCache = new Map<string, StageEntry[]>();
const CACHE_LIMIT = 100;

/**
 * 正規化
 * - 大文字小文字無視
 * - カタカナ→ひらがな
 * - 前後空白除去
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .trim();
}

/**
 * ステージをインデックス化
 */
export function indexStages(entries: StageEntry[]) {
  byEntry.clear();

  for (const e of entries) {
    const names: string[] = [];

    for (const n of e.stageNames) {
      if (n) names.push(normalize(n));
    }

    if (e.mapName) names.push(normalize(e.mapName));
    if (e.mapKey) names.push(normalize(e.mapKey));

    byEntry.set(e, names);
  }
}

/**
 * ステージ検索
 */
export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  const cached = searchCache.get(key);
  if (cached) return cached;

  const words = key.split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.length === 0) return [];

  const result: StageEntry[] = [];

  entryLoop:
  for (const [entry, names] of byEntry.entries()) {
    for (const w of words) {
      // 単独1文字検索は無効
      if (w.length === 1 && words.length === 1) {
        continue entryLoop;
      }

      // いずれの名前にも含まれない → NG
      if (!names.some(n => n.includes(w))) {
        continue entryLoop;
      }
    }

    result.push(entry);
  }

  searchCache.set(key, result);

  if (searchCache.size > CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (typeof oldest === "string") {
      searchCache.delete(oldest);
    }
  }

  return result;
}
