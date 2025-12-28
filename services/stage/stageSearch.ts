import { StageEntry, MapEntry } from "./stageTypes.js";

let stages: StageEntry[] = [];
let maps: MapEntry[] = [];

export function indexAll(data: {
  stages: StageEntry[];
  maps: MapEntry[];
}) {
  stages = data.stages;
  maps = data.maps;
}

function normalize(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    );
}

export function search(keyword: string): {
  stages: StageEntry[];
  maps: MapEntry[];
} {
  const key = normalize(keyword);
  if (!key) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => {
    return (
      normalize(s.stageName).includes(key) ||
      normalize(s.stageId).startsWith(key) ||
      String(s.stageIdRaw) === key
    );
  });

  const mapHits = maps.filter(m => {
    return (
      normalize(m.mapName).includes(key) ||
      normalize(m.mapId).startsWith(key) ||
      String(m.mapIdRaw) === key
    );
  });

  return { stages: stageHits, maps: mapHits };
}
