import { StageEntry } from "./stageTypes.js";
import { buildStageUrl } from "./stageUrlUtil.js";

export function formatStageSingle(e: StageEntry): string {
  return `${e.mapKey}${String(e.mapIndex).padStart(3,"0")} ${e.stageName}
${buildStageUrl(e.mapKey, e.mapIndex)}`;
}

/** ステージ一覧表示（ステージ単位） */
export function formatStageList(list: StageEntry[]): string {
  const seen = new Set<string>();

  return (
    "```" +
    list
      .filter(e => {
        const k = `${e.mapKey}-${e.mapIndex}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 10)
      .map(e => `${e.mapKey}${String(e.mapIndex).padStart(3,"0")} ${e.mapName}`)
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
