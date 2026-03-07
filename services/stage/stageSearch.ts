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
  if (!/\d/.test(trimmed)) return false; // 数字が1つもなければIDではない
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
 * 検索メインロジック
 */
export function search(keyword: string): { stages: StageEntry[]; maps: MapEntry[] } {
  const raw = keyword.trim();
  if (!raw) return { stages: [], maps: [] };

  const hasSpace = /\s+/.test(raw);

  // --- 1. ID検索の試行 ---
  if (!hasSpace && (isStageIdQuery(raw) || isMapIdQuery(raw))) {
    // 全角を半角にし、小文字化した検索キーを作成
    const key = raw.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).toLowerCase();
    const hasHyphen = key.includes("-");

    const idResults = {
      stages: hasHyphen ? stages.filter(s => s.stageName.trim() !== "@" && s.stageId.toLowerCase().startsWith(key)) : [],
      maps: !hasHyphen ? maps.filter(m => m.mapName.trim() !== "@" && m.mapId.toLowerCase().startsWith(key)) : []
    };

    // IDとして1件でもヒットすれば即座に返す
    if (idResults.stages.length > 0 || idResults.maps.length > 0) {
      return idResults;
    }
    // IDとしてヒットしなければ、下の名前検索（フォールバック）へ進む
  }

  // --- 2. 名前検索（AND検索 / フォールバック処理） ---
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  
  const filterFn = (item: { stageName?: string; mapName?: string }) => {
    const name = item.stageName || item.mapName || "";
    if (name.trim() === "@" || name.trim() === "＠" || name.trim() === "") return false;
    
    const nName = normalize(name);
    // すべての単語が名前に含まれているか（大文字小文字を問わず比較可能）
    return words.every(w => nName.includes(w));
  };

  return { 
    stages: stages.filter(filterFn), 
    maps: maps.filter(filterFn) 
  };
}