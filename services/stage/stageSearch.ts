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
  const raw = keyword.trim();
  const key = normalize(raw);
  if (!key) return { mode: "stage", results: [] };

  // =====================================
  // 1. stage ID 明示指定
  // =====================================
  if (isStageIdQuery(raw)) {
    const hits = stages.filter(s =>
      normalize(s.stageId).startsWith(key)
    );
    return { mode: "stage", results: hits };
  }

  // =====================================
  // 2. map ID 明示指定
  // =====================================
  if (isMapIdQuery(raw)) {
    const hits = maps.filter(m =>
      normalize(m.mapId).startsWith(key)
    );
    return { mode: "map", results: hits };
  }

  // =====================================
  // 3. 名前検索（stage / map 両方）
  // =====================================
  const stageHits = stages.filter(s =>
    s.stageName !== "@" &&
    normalize(s.stageName).includes(key)
  );

  const mapHits = maps.filter(m =>
    normalize(m.mapName).includes(key)
  );

  // stage がヒットしていれば stage 優先
  if (stageHits.length > 0) {
    return { mode: "stage", results: stageHits };
  }

  return { mode: "map", results: mapHits };
}
