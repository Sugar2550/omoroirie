import { StageEntry } from "./stageTypes.js";

const byEntry = new Map<StageEntry, string[]>();

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * 検索用インデックス作成
 */
export function indexStages(entries: StageEntry[]) {
  byEntry.clear();

  for (const e of entries) {
    const names: string[] = [];

    // ステージ名
    for (const n of e.stageNames) {
      if (n) names.push(normalize(n));
    }

    // マップ名
    if (e.mapName) names.push(normalize(e.mapName));

    // mapKey
    if (e.mapKey) names.push(normalize(e.mapKey));

    // 数値ID / mapIndex も文字列化して追加
    names.push(String(e.numericId));
    names.push(String(e.mapIndex));

    byEntry.set(e, names);
  }
}

/**
 * ステージ検索
 */
export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  // 数値検索かどうか
  const isNumeric = /^\d+$/.test(key);

  const words = key.split(/\s+/).filter(Boolean);

  const result: StageEntry[] = [];

  entryLoop:
  for (const [entry, names] of byEntry.entries()) {
    // numericId 完全一致
    if (isNumeric && String(entry.numericId) === key) {
      result.push(entry);
      continue;
    }

    // 通常ワード検索（部分一致）
    for (const w of words) {
      // 単独1文字は除外
      if (w.length === 1 && words.length === 1) {
        continue entryLoop;
      }

      if (!names.some(n => n.includes(w))) {
        continue entryLoop;
      }
    }

    result.push(entry);
  }

  return result;
}
