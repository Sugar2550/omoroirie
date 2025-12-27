import { StageEntry } from "./stageTypes.js";
import { buildStageUrl } from "./stageUrlUtil.js";

export function formatStageSingle(s: StageEntry): string {
  return `${s.mapId}-${s.stageIndex.toString().padStart(3, "0")} ${s.stageName}`;
}

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
      .map(
        e => `${e.mapKey}${String(e.mapIndex).padStart(3, "0")} ${e.mapName}`
      )
      .join("\n") +
    "```"
  );
}
