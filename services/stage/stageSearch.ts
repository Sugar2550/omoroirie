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

export function isStageIdQuery(raw: string): boolean {
  return /^[A-Z]+\d{3}-\d{1,3}$/i.test(raw.trim());
}

export function isMapIdQuery(raw: string): boolean {
  return /^[A-Z]+\d{3}$/i.test(raw.trim());
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
