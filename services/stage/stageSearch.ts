import { StageEntry } from "./stageTypes.js";

let stages: StageEntry[] = [];

export function indexStages(list: StageEntry[]) {
  stages = list;
}

/**
 * 検索用正規化
 */
function normalize(str: string): string {
  return str
    .trim()
    .toUpperCase()
    // 全角数字 → 半角
    .replace(/[０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    );
}

export function searchStage(keyword: string): StageEntry[] {
  const raw = keyword.trim();
  if (!raw) return [];

  const key = normalize(raw);

  return stages.filter(s => {
    const stageName = normalize(s.stageName);
    const mapName   = normalize(s.mapName);
    const mapCode   = normalize(s.mapCode);
    const rawMapId  = normalize(s.rawMapId);

    return (
      // ステージ名検索
      stageName.includes(key) ||

      // マップ名検索（日本編1章 等）
      mapName.includes(key) ||

      // マップコード検索（NA047 等）
      mapCode === key ||
      mapCode.startsWith(key) ||

      // rawMapId 検索（13047 等）
      rawMapId === key
    );
  });
}
