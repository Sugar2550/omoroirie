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
  mode: "map" | "stage";
  results: (StageEntry | MapEntry)[];
} {
  const key = normalize(keyword);
  if (!key) return { mode: "stage", results: [] };

  const isStageSearch = key.includes("-");

  // ============================
  // stage 単位検索
  // ============================
  if (isStageSearch) {
    const hits = stages.filter(s => {
      if (s.stageName === "@") return false;

      return (
        normalize(s.stageId).startsWith(key) ||
        String(s.stageIdRaw) === key ||
        normalize(s.stageName).includes(key)
      );
    });

    return { mode: "stage", results: hits };
  }

  // ============================
  // map 単位検索
  // ============================
  const mapHits = maps.filter(m => {
    return (
      normalize(m.mapId).startsWith(key) ||
      String(m.mapIdRaw) === key ||
      normalize(m.mapName).includes(key)
    );
  });

  return { mode: "map", results: mapHits };
}
