import { StageEntry } from "./stageTypes.js";

let stages: StageEntry[] = [];

export function indexStages(list: StageEntry[]) {
  stages = list;
}

export function searchStage(keyword: string): StageEntry[] {
  const key = keyword.trim();
  if (!key) return [];

  return stages.filter((e: StageEntry) =>
    e.stageName.includes(key) ||
    e.mapName.includes(key) ||
    e.mapId === key
  );
}
