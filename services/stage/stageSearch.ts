import { StageEntry, MapEntry } from "./stageTypes.js";

let stages: StageEntry[] = [];
let maps: MapEntry[] = [];

export function indexAll(data: {
  stages: StageEntry[];
  maps: MapEntry[];
}) {
  // 読み込み時に @ が出たらそれ以降は無視（打ち切り）
  const newStages: StageEntry[] = [];
  for (const s of data.stages) {
    if (s.stageName.trim() === "＠" || s.stageName.trim() === "@") break;
    newStages.push(s);
  }
  stages = newStages;

  const newMaps: MapEntry[] = [];
  for (const m of data.maps) {
    if (m.mapName.trim() === "＠" || m.mapName.trim() === "@") break;
    newMaps.push(m);
  }
  maps = newMaps;
}

/**
 * ID検索用の軽い正規化（全角英数字を半角にするだけ）
 */
function normalizeId(s: string): string {
  return s.trim().toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  );
}

/**
 * 名前検索用の高度な正規化（表記揺れを吸収）
 */
function normalizeName(s: string): string {
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
    .replace(/[－−‐⁃‑‒–—―-]/g, "ー"); // 名前検索ではハイフンを伸ばし棒に
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
  // ID検索（ID用の正規化を使用）
  // ============================
  if (isStageIdQuery(raw) || isMapIdQuery(raw)) {
    const idKey = normalizeId(raw);
    return {
      stages: stages.filter(s => normalizeId(s.stageId).startsWith(idKey)),
      maps: maps.filter(m => normalizeId(m.mapId).startsWith(idKey))
    };
  }

  // ============================
  // 名前検索（名前用の正規化を使用）
  // ============================
  const words = normalizeName(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  return {
    stages: stages.filter(s => 
      words.every(w => normalizeName(s.stageName).includes(w))
    ),
    maps: maps.filter(m => 
      words.every(w => normalizeName(m.mapName).includes(w))
    )
  };
}