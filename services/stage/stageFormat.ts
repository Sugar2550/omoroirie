import { StageEntry } from "./stageTypes.js";
import { buildStageUrl } from "./stageUrlUtil.js";

export function formatStageSingle(e: StageEntry): string {
  const idText =
    `${e.mapKey}${String(e.mapIndex).padStart(3, "0")}(${e.numericId})`;

  const name = e.stageNames[0] ?? e.mapName ?? "";
  const url = buildStageUrl(e.numericId);

  return `${idText} ${name}\n${url}`;
}

export function formatStageList(entries: StageEntry[]): string {
  return (
    "```" +
    entries
      .map(e => {
        const id = `${e.mapKey}${String(e.mapIndex).padStart(3, "0")}`;
        const name = e.stageNames[0] ?? e.mapName ?? "";
        return `${id} ${name}`;
      })
      .join("\n") +
    "```"
  );
}

export function formatStageWithLimit(
  entries: StageEntry[],
  limit: number
): string {
  const head = entries.slice(0, limit);

  return (
    "```" +
    head
      .map(e => {
        const id = `${e.mapKey}${String(e.mapIndex).padStart(3, "0")}`;
        const name = e.stageNames[0] ?? e.mapName ?? "";
        return `${id} ${name}`;
      })
      .join("\n") +
    "\n...more" +
    "```"
  );
}
