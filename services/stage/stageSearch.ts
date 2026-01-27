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
  if (!s) return "";
  return s
    .trim()
    .toUpperCase()
    .replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .replace(/[\u30a1-\u30f6]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .replace(/[~～〜〜〜]/g, "〜")
    .replace(/[－−‐⁃‑‒–—―-]/g, "ー");
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

  if (isStageIdQuery(raw) || isMapIdQuery(raw)) {
    const key = raw.toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    );
    return {
      stages: stages.filter(s => s.stageId.toUpperCase().startsWith(key)),
      maps: maps.filter(m => m.mapId.toUpperCase().startsWith(key))
    };
  }

  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => 
    s.stageName !== "@" && // 終端マーカーを除外
    words.every(w => normalize(s.stageName).includes(w))
  );

  const mapHits = maps.filter(m => 
    m.mapName !== "@" && // マップ側も念のため除外
    words.every(w => normalize(m.mapName).includes(w))
  );

  return { stages: stageHits, maps: mapHits };
}