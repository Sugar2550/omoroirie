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

/**
 * ステージ検索用の高度な正規化
 */
function normalize(s: string): string {
  if (!s) return "";
  return s
    .trim()
    .toUpperCase()
    // 全角英数字を半角に
    .replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    // カタカナをひらがなに変換
    .replace(/[\u30a1-\u30f6]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    // 波線(〜)系を統一
    .replace(/[~～〜〜〜]/g, "〜")
    // ハイフン系を統一（ハイフンは最後に置く）
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

  // ID検索
  if (isStageIdQuery(raw) || isMapIdQuery(raw)) {
    const key = raw.toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    );
    return {
      stages: stages.filter(s => s.stageId.toUpperCase().startsWith(key)),
      maps: maps.filter(m => m.mapId.toUpperCase().startsWith(key))
    };
  }

  // 名前検索
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => {
    if (s.stageName === "@") return false;
    const target = normalize(s.stageName);
    return words.every(w => target.includes(w));
  });

  const mapHits = maps.filter(m => {
    const target = normalize(m.mapName);
    return words.every(w => target.includes(w));
  });

  return { stages: stageHits, maps: mapHits };
}