import { StageEntry, MapEntry } from "./stageTypes.js";

/**
 * 先頭の R を 1 文字だけ除去（RR → R が正解）
 * ※ mapId 表示専用
 */
function stripR(s: string): string {
  return s.startsWith("R") ? s.slice(1) : s;
}

function buildMapUrlFromMapId(mapId: string): string {
  const clean = mapId;

  const type = clean.slice(0, -3);
  const map = Number(clean.slice(-3));

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

/**
 * 単体ステージ表示
 * - 見出しはコードブロック
 * - URL はコードブロック外
 */
export function formatStageSingle(s: StageEntry): string {
  // stageId は加工しない（R を残す）
  const stageId = s.stageId;

  return (
    "```" +
    `${stageId}(${s.mapIdRaw}) ${s.stageName}` +
    "```\n" +
    buildMapUrlFromMapId(s.mapId)
  );
}

/**
 * 複数ステージ一覧（URLなし・コードブロック維持）
 */
export function formatStageList(list: StageEntry[]): string {
  return (
    "```" +
    list.map(s => `${s.stageId} ${s.stageName}`).join("\n") +
    "```"
  );
}

/**
 * マップ一覧表示（URL付き）
 */
export function formatMapList(maps: MapEntry[]): string {
  return maps
    .map(m => {
      // mapId 表示時のみ R を除去
      const mapId = stripR(m.mapId);
      return (
        "```" +
        `${mapId}(${m.mapIdRaw}) ${m.mapName}` +
        "```\n" +
        buildMapUrlFromMapId(m.mapId)
      );
    })
    .join("\n");
}
