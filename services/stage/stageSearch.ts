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
    .replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .replace(/－/g, "-");
}

export function isStageIdQuery(raw: string): boolean {
  return /^[A-Z]+\d{3}-\d{1,3}$/i.test(raw.trim());
}

export function isMapIdQuery(raw: string): boolean {
  return /^[A-Z]+\d{3}$/i.test(raw.trim());
}

export function search(keyword: string): {
  stages: StageEntry[];
  maps: MapEntry[];
} {
  const raw = keyword.trim();
  if (!raw) return { stages: [], maps: [] };

  // ID検索の場合は従来通り（前方一致）
  if (isStageIdQuery(raw) || isMapIdQuery(raw)) {
    const key = normalize(raw);
    return {
      stages: stages.filter(s => normalize(s.stageId).startsWith(key)),
      maps: maps.filter(m => normalize(m.mapId).startsWith(key))
    };
  }

  // 名前検索：複数ワード（AND検索）に対応
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s =>
    s.stageName !== "@" &&
    words.every(w => normalize(s.stageName).includes(w))
  );

  const mapHits = maps.filter(m =>
    words.every(w => normalize(m.mapName).includes(w))
  );

  return { stages: stageHits, maps: mapHits };
}