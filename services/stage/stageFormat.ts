import { StageEntry } from "./stageTypes.js";

/**
 * 日本編・未来編・宇宙編 type 対応表
 */
const STORY_TYPE: Record<number, string> = {
  0: "NA",
  1: "FA",
  2: "SA"
};

/**
 * 表示・URL 用に先頭 R を除去
 */
function stripR(id: string): string {
  return id.replace(/^R+/, "");
}

/**
 * マップURL生成
 */
function buildMapUrl(entry: StageEntry): string {
  const { mapIdRaw, mapId } = entry;

  // 日本・未来・宇宙編（3000–3008）
  if (mapIdRaw >= 3000 && mapIdRaw <= 3008) {
    const typeIndex = Math.floor((mapIdRaw - 3000) / 3);
    const type = STORY_TYPE[typeIndex];
    const map = mapIdRaw - (3000 + typeIndex * 3);

    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
  }

  // 通常マップ
  const clean = stripR(mapId);
  const type = clean.replace(/\d+$/, "");
  const map = Number(clean.replace(/^\D+/, ""));

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

/**
 * 単体表示（コードブロック + URL）
 */
export function formatStageSingle(s: StageEntry): string {
  const line = `${stripR(s.stageId)}(${s.mapIdRaw}) ${s.stageName}`;
  const url = buildMapUrl(s);

  return [
    "```",
    line,
    "```",
    url
  ].join("\n");
}

/**
 * 複数ステージ表示（必ずコードブロック・URLなし）
 */
export function formatStageList(stages: StageEntry[]): string {
  return [
    "```",
    stages.map(s => `${stripR(s.stageId)} ${s.stageName}`).join("\n"),
    "```"
  ].join("\n");
}
