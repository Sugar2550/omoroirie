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
    .replace(/[Ａ-Ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[~～〜〜〜]/g, "〜");
}

// mapId.ts が生成する 0Z001 や 2_Inv000 などの形式を許容
export function isStageIdQuery(raw: string): boolean {
  return /^[a-z0-9_]+-[a-z0-9_]+$/i.test(raw.trim());
}

export function isMapIdQuery(raw: string): boolean {
  return /^[a-z0-9_]+$/i.test(raw.trim());
}

/**
 * mapId.ts の出力形式から URL を生成
 */
export function getStageUrl(fullId: string): string {
  const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
  // ハイフン以降（ステージ番号）を除去してマップID部分のみを抽出
  const mapPart = fullId.split("-")[0];

  // フィリバスター等の特殊ケース (Invが含まれる場合)
  if (mapPart.toUpperCase().includes("INV")) {
    const isZombie = mapPart.toUpperCase().includes("2Z");
    const type = isZombie ? "2Z_Inv" : "2_Inv";
    return `${baseUrl}&type=${type}&map=0${isZombie ? "&zombie=1" : ""}`;
  }

  // 一般形式: 任意の文字列(type) + 末尾の数字3桁(map) を分離
  // 例: "0Z001" -> type="0Z", map="001" / "N000" -> type="N", map="000"
  const match = mapPart.match(/^(.*?)(\d{3})$/);
  
  if (match) {
    const type = match[1];
    const map = parseInt(match[2], 10);
    let url = `${baseUrl}&type=${type}&map=${map}`;
    
    // ゾンビ判定 (typeがZで終わる場合)
    if (type.endsWith("Z")) {
      url += "&zombie=1";
    }
    return url;
  }

  return baseUrl;
}

export function search(keyword: string): { stages: StageEntry[]; maps: MapEntry[] } {
  const raw = keyword.trim();
  if (!raw) return { stages: [], maps: [] };

  const hasSpace = /\s+/.test(raw);

  if (!hasSpace && (isStageIdQuery(raw) || isMapIdQuery(raw))) {
    const key = raw.toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    const hasHyphen = key.includes("-");
    return {
      stages: hasHyphen ? stages.filter(s => s.stageName.trim() !== "@" && s.stageId.toUpperCase().startsWith(key)) : [],
      maps: !hasHyphen ? maps.filter(m => m.mapName.trim() !== "@" && m.mapId.toUpperCase().startsWith(key)) : []
    };
  }

  const words = normalize(raw).split(/\s+/).filter(Boolean);
  const filterFn = (item: { stageName?: string; mapName?: string }) => {
    const name = item.stageName || item.mapName || "";
    if (name.trim() === "@" || name.trim() === "＠") return false;
    const nName = normalize(name);
    return words.every(w => nName.includes(w));
  };

  return { stages: stages.filter(filterFn), maps: maps.filter(filterFn) };
}