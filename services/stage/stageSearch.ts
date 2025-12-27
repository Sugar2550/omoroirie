import { StageEntry } from "./stageTypes.js";

let entries: StageEntry[] = [];

export function indexStages(list: StageEntry[]) {
  entries = list;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function searchStage(keyword: string): StageEntry[] {
  const key = keyword.trim();
  if (!key) return [];

  return allStages.filter(e =>
    e.stageName.includes(key) ||
    e.mapName.includes(key) ||
    e.mapId === key
  );
}
