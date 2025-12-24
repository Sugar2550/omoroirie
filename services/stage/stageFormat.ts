import { StageEntry } from "./stageTypes.js";
import { buildStageUrl } from "./stageUrlUtil.js";

function formatId(e: StageEntry): string {
  return `${e.mapKey}${String(e.mapIndex).padStart(3, "0")}`;
}

export function formatStageSingle(e: StageEntry): string {
  const id = formatId(e);
  const name = e.stageNames[0] ?? e.mapName;
  const url = buildStageUrl(e.mapKey, e.mapIndex);

  return `${id} ${name}\n${url}`;
}

export function formatStageList(entries: StageEntry[]): string {
  return (
    "```" +
    entries
      .map((e, i) => {
        const id = formatId(e);
        const name = e.stageNames[0] ?? e.mapName;
        return `${i + 1}. ${id} ${name}`;
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
    formatStageList(head) +
    `\n…他 ${entries.length - limit} 件`
  );
}
