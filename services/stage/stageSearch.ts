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
  stages: StageEntry[];
  maps: MapEntry[];
} {
  const raw = keyword.trim();
  const key = normalize(raw);
  if (!key) return { stages: [], maps: [] };

  // ============================
  // stage ID 指定
  // ============================
  if (isStageIdQuery(raw)) {
    return {
      stages: stages.filter(s =>
        normalize(s.stageId).startsWith(key)
      ),
      maps: []
    };
  }

  // ============================
  // map ID 指定
  // ============================
  if (isMapIdQuery(raw)) {
    return {
      stages: [],
      maps: maps.filter(m =>
        normalize(m.mapId).startsWith(key)
      )
    };
  }

  // ============================
  // 名前検索（両方）
  // ============================
  const stageHits = stages.filter(s =>
    s.stageName !== "@" &&
    normalize(s.stageName).includes(key)
  );

  const mapHits = maps.filter(m =>
    normalize(m.mapName).includes(key)
  );

  return { stages: stageHits, maps: mapHits };
}
