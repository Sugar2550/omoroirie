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
    // 正規化対象
    const stageName = normalize(s.stageName);
    const mapName   = normalize(s.mapName);
    const stageId   = normalize(s.stageId);
    const mapId     = normalize(s.mapId);

    // aliases はすべて文字列化して比較
    const aliases = s.aliases.map(a => normalize(String(a)));

    return (
      // ステージ名検索
      stageName.includes(key) ||

      // マップ名検索（日本編1章 等）
      mapName.includes(key) ||

      // ステージID検索（NA047001 等）
      stageId === key ||
      stageId.startsWith(key) ||

      // マップID検索（NA047 等）
      mapId === key ||
      mapId.startsWith(key) ||

      // raw 数値 ID（13047 / 3000 等）
      String(s.stageIdRaw) === key ||
      String(s.mapIdRaw) === key ||

      // aliases 検索（旧表記・別名すべて）
      aliases.some(a => a.includes(key))
    );
  });
}
