import { StageEntry } from "./stageTypes.js";

/** マップURL生成（map単位） */
function buildMapUrl(e: StageEntry): string {
  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${e.mapKey}&map=${e.mapId}`;
}

/** 単一ステージ表示 */
export function formatStageSingle(e: StageEntry): string {
  const id = `${e.mapKey}${String(e.stageIndex).padStart(3, "0")}`;
  return `${id} ${e.stageName}\n${buildMapUrl(e)}`;
}

/** ステージ一覧表示（ステージ単位） */
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

/** 件数制限付き一覧 */
export function formatStageWithLimit(
  entries: StageEntry[],
  limit: number
): string {
  return (
    "```" +
    entries
      .slice(0, limit)
      .map(e =>
        `${e.mapKey}${String(e.stageIndex).padStart(3, "0")} ${e.stageName}`
      )
      .join("\n") +
    `\n…他 ${entries.length - limit} 件` +
    "```"
  );
}

/** マップ単位集約表示 */
export function formatStageMapSummary(entries: StageEntry[]): string {
  const e = entries[0];
  return `${e.mapName}（${entries.length} ステージ）\n${buildMapUrl(e)}`;
}
