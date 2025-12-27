import { StageEntry } from "./stageTypes.js";

export function formatStageSingle(s: StageEntry): string {
  const id = `${s.mapId}-${s.stageIndex.toString().padStart(3, "0")}`;
  return `${id} ${s.stageName}`;
}

export function formatStageList(list: StageEntry[]): string {
  return (
    "```" +
    list
      .map((s, i) =>
        `${i + 1}. ${s.mapId}-${s.stageIndex
          .toString()
          .padStart(3, "0")} ${s.stageName}`
      )
      .join("\n") +
    "```"
  );
}
