import { StageEntry } from "./stageTypes.js";

const byEntry = new Map<StageEntry, string[]>();

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function indexStages(entries: StageEntry[]) {
  byEntry.clear();

  for (const e of entries) {
    byEntry.set(e, [
      e.stageName,
      e.mapName,
      e.mapKey,
      String(e.mapId)
    ].map(normalize));
  }
}

export function searchStage(keyword: string): StageEntry[] {
  const key = normalize(keyword);
  if (!key) return [];

  const words = key.split(/\s+/);

  return [...byEntry.entries()]
    .filter(([_, names]) =>
      words.every(w => names.some(n => n.includes(w)))
    )
    .map(([e]) => e);
}
