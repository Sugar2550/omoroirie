import { StageEntry } from "./stageTypes.js";

export function formatStageSingle(s: StageEntry): string {
  const id = `${s.mapId}-${s.stageIndex.toString().padStart(3, "0")}`;
  return `${id} ${s.stageName}`;
}

export function formatStageSingle(s: StageEntry): string {
  return (
    "```" +
    `${s.mapCode}(${s.rawMapId}) ${s.stageName}` +
    "```"
  );
}

export function formatStageList(stages: StageEntry[]): string {
  return (
    "```" +
    stages
      .map(s => `${s.mapCode} ${s.stageName}`)
      .join("\n") +
    "```"
  );
}


export function formatStageGroupedByMap(stages: StageEntry[]): string {
  const grouped = new Map<string, StageEntry[]>();

  for (const s of stages) {
    if (!grouped.has(s.mapId)) {
      grouped.set(s.mapId, []);
    }
    grouped.get(s.mapId)!.push(s);
  }

  return (
    "```" +
    [...grouped.entries()]
      .map(([mapId, list]) => {
        const mapName = list[0].mapName;
        return `${mapId}｜${mapName}（${list.length} stages）`;
      })
      .join("\n") +
    "```"
  );
}