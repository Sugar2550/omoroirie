import { StageEntry } from "./stageTypes.js";

function buildMapUrl(e: StageEntry): string {
  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${e.mapKey}&map=${e.mapId}`;
}

/** 単一ステージ */
export function formatStageSingle(e: StageEntry): string {
  return `${e.mapKey}${String(e.stageIndex).padStart(3, "0")} ${e.stageName}
${buildMapUrl(e)}`;
}

/** ステージ一覧 */
export function formatStageList(entries: StageEntry[]): string {
  return (
    "```" +
    entries
      .map(e =>
        `${e.mapKey}${String(e.stageIndex).padStart(3, "0")} ${e.stageName}`
      )
      .join("\n") +
    "```"
  );
}

/** マップ単位集約 */
export function formatStageMapSummary(entries: StageEntry[]): string {
  const first = entries[0];

  return `
${first.mapName}（ID: ${first.mapId}）
ステージ数: ${entries.length}
${buildMapUrl(first)}
`.trim();
}
