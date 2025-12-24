import { StageEntry } from "./stageTypes.js";

export function formatStageSingle(s: StageEntry): string {
  return `${s.mapName}\n${s.url}`;
}

export function formatStageMultiple(list: StageEntry[]): string {
  return (
    "```" +
    list.map(s => s.mapName).join("\n") +
    "```"
  );
}

export function formatStageWithLimit(
  list: StageEntry[],
  limit: number
): string {
  const sliced = list.slice(0, limit);
  return (
    "```" +
    sliced.map(s => s.mapName).join("\n") +
    (list.length > limit ? "\n...more" : "") +
    "```"
  );
}
