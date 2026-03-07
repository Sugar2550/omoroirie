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
 * 高度な正規化処理
 */
function normalize(s: string): string {
  if (!s) return "";
  return s
    .trim()
    // 1. 全角英数字を半角に（Ａ-Ｚ, ａ-ｚ, ０-９ すべて対象）
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    // 2. すべて小文字化
    .toLowerCase()
    // 3. カタカナをひらがな化
    .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    // 4. 波線などの記号統一
    .replace(/[~～〜〜〜]/g, "〜");
}

export function isStageIdQuery(raw: string): boolean {
  return /^[a-z0-9_]+-[a-z0-9_]+$/i.test(raw.trim());
}

export function isMapIdQuery(raw: string): boolean {
  const trimmed = raw.trim();
  // 数字が1つもなければIDではない（DNAなどのアルファベット単語を名前検索へ回すため）
  if (!/\d/.test(trimmed)) return false;
  return /^[a-z0-9_]+$/i.test(trimmed);
}

export function getStageUrl(fullId: string): string {
  const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
  const mapPart = fullId.split("-")[0];
  const type = mapPart.slice(0, -3);
  const map = parseInt(mapPart.slice(-3), 10);
  return `${baseUrl}&type=${type}&map=${map}`;
}

/**
 * ステージ検索メインロジック
 */
export function search(keyword: string): { stages: StageEntry[]; maps: MapEntry[] } {
  let raw = keyword.trim();
  if (!raw) return { stages: [], maps: [] };

  // --- -force フラグ判定 ---
  const forceFlag = "-force";
  const isForce = raw.includes(forceFlag);
  if (isForce) {
    raw = raw.replace(forceFlag, "").trim();
  }

  const hasSpace = /\s+/.test(raw);

  // --- 1. ID検索の試行 ---
  // forceモード時はID検索をスキップして名前の完全一致を狙う
  if (!isForce && !hasSpace && (isStageIdQuery(raw) || isMapIdQuery(raw))) {
    const key = raw.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).toLowerCase();
    const hasHyphen = key.includes("-");

    const idResults = {
      stages: hasHyphen ? stages.filter(s => s.stageName.trim() !== "@" && s.stageId.toLowerCase().startsWith(key)) : [],
      maps: !hasHyphen ? maps.filter(m => m.mapName.trim() !== "@" && m.mapId.toLowerCase().startsWith(key)) : []
    };

    // IDとしてヒットがあれば返す
    if (idResults.stages.length > 0 || idResults.maps.length > 0) {
      return idResults;
    }
    // ヒットしなければ名前検索へフォールバック
  }

  // --- 2. 名前検索 ---
  const words = isForce 
    ? raw.split(/\s+/).filter(Boolean) 
    : normalize(raw).split(/\s+/).filter(Boolean);

  const filterFn = (item: { stageName?: string; mapName?: string }) => {
    const name = item.stageName || item.mapName || "";
    if (name.trim() === "@" || name.trim() === "＠" || name.trim() === "") return false;
    
    // force時は生の名前、通常時は正規化後の名前で比較
    const targetName = isForce ? name : normalize(name);
    return words.every(w => targetName.includes(w));
  };

  return { 
    stages: stages.filter(filterFn), 
    maps: maps.filter(filterFn) 
  };
}