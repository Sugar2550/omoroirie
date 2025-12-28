import { StageEntry, MapEntry } from "./stageTypes.js";

let stages: StageEntry[] = [];
let maps: MapEntry[] = [];

/**
 * 起動時インデックス
 */
export function indexAll(data: {
  stages: StageEntry[];
  maps: MapEntry[];
}) {
  stages = data.stages;
  maps = data.maps;
}

/**
 * 正規化
 */
function normalize(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    );
}

/**
 * 表示・検索用に先頭 R を1文字だけ除去
 * RRxxx → Rxxx（表示仕様と一致）
 */
function stripLeadingR(id: string): string {
  return id.startsWith("R") ? id.slice(1) : id;
}

/**
 * 検索本体
 */
export function search(keyword: string): {
  stages: StageEntry[];
  maps: MapEntry[];
} {
  const rawKey = keyword.trim();
  if (!rawKey) return { stages: [], maps: [] };

  const key = normalize(rawKey);
  const keyNoR = stripLeadingR(key);

  /* ===============================
   * Stage 検索
   * =============================== */
  const stageHits = stages.filter(s => {
    const stageName = normalize(s.stageName);
    const stageId   = normalize(stripLeadingR(s.stageId));
    const mapId     = normalize(stripLeadingR(s.mapId));

    return (
      // ステージ名
      stageName.includes(key) ||

      // ステージID（完全 / 前方一致）
      stageId === keyNoR ||
      stageId.startsWith(keyNoR) ||

      // マップIDでのヒット（NA047 → 配下ステージ）
      mapId === keyNoR ||
      mapId.startsWith(keyNoR) ||

      // 数値ID検索
      String(s.stageIdRaw) === key ||
      String(s.mapIdRaw) === key
    );
  });

  /* ===============================
   * Map 検索
   * =============================== */
  const mapHits = maps.filter(m => {
    const mapName = normalize(m.mapName);
    const mapId   = normalize(stripLeadingR(m.mapId));

    return (
      // マップ名
      mapName.includes(key) ||

      // マップID（完全 / 前方一致）
      mapId === keyNoR ||
      mapId.startsWith(keyNoR) ||

      // 数値ID
      String(m.mapIdRaw) === key
    );
  });

  return { stages: stageHits, maps: mapHits };
}
