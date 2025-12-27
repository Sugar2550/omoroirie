import { StageEntry } from "./stageTypes.js";

let entries: StageEntry[] = [];

export function indexStages(list: StageEntry[]) {
  entries = list;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  return entries.filter(e =>
    normalize(e.stageName).includes(key) ||
    normalize(e.mapName).includes(key) ||
    normalize(e.mapKey).includes(key) ||
    String(e.numericId).includes(key)
  );
}
