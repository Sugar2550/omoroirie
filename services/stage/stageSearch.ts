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
    .replace(/[０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/^R+/, "");
}

export function searchStage(keyword: string): StageEntry[] {
  const raw = keyword.trim();
  if (!raw) return [];

  const key = normalize(raw);
  const keyNum = Number(key);

  return stages.filter(s => {
    const stageName = normalize(s.stageName);
    const mapName = normalize(s.mapName);
    const stageId = normalize(s.stageId);
    const mapId = normalize(s.mapId);

    // 数値検索（13047 / 3000 等）
    if (Number.isFinite(keyNum)) {
      return s.mapIdRaw === keyNum || s.stageIdRaw === keyNum;
    }

    return (
      stageName.includes(key) ||
      mapName.includes(key) ||
      stageId.startsWith(key) ||
      mapId.startsWith(key)
    );
  });
}
