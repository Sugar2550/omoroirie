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

  // ============================
  // ID検索
  // ============================
  if (isStageIdQuery(raw) || isMapIdQuery(raw)) {
    const key = raw.toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    );

    // 変数 hasHyphen で判定
    const hasHyphen = key.includes("-");

    return {
      // ハイフンがある時だけステージを返す（＠は除外）
      stages: hasHyphen 
        ? stages.filter(s => 
            s.stageName.trim() !== "@" && 
            s.stageName.trim() !== "＠" && 
            s.stageId.toUpperCase().startsWith(key)
          )
        : [],
      // ハイフンがない時だけマップを返す（＠は除外）
      maps: !hasHyphen
        ? maps.filter(m => 
            m.mapName.trim() !== "@" && 
            m.mapName.trim() !== "＠" && 
            m.mapId.toUpperCase().startsWith(key)
          )
        : []
    };
  }

  // ============================
  // 名前検索
  // ============================
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => 
    s.stageName.trim() !== "@" && 
    s.stageName.trim() !== "＠" && 
    words.every(w => normalize(s.stageName).includes(w))
  );

  const mapHits = maps.filter(m => 
    m.mapName.trim() !== "@" && 
    m.mapName.trim() !== "＠" && 
    words.every(w => normalize(m.mapName).includes(w))
  );

  return { stages: stageHits, maps: mapHits };
}