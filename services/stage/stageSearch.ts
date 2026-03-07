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
    .replace(/　/g, " ") // 全角スペースを半角に
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
  // 既に半角化された状態で判定されるため、\d (半角数字) で正しくヒットする
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
  // 1. まず全角スペースを半角にしてトリムする
  let raw = keyword.trim().replace(/　/g, " ");
  if (!raw) return { stages: [], maps: [] };

  // 2. 許可するフラグの判定と除去
  const forceFlags = ["-force", "-f"];
  const isForce = forceFlags.some(flag => raw.includes(flag));
  
  if (isForce) {
    forceFlags.forEach(flag => {
      raw = raw.replace(flag, "");
    });
    raw = raw.trim();
  }

  // 3. 【最重要】ID判定や比較に使う「半角・小文字」のキーをここで作る
  // これにより「Ｎａ047」が「na047」になり、isMapIdQueryが正しく動作する
  const key = raw
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase();

  const hasSpace = /\s+/.test(key);

  // --- 1. ID検索の試行 ---
  // forceモード時以外で、スペースがなく、ID形式（na047など）に合致する場合
  if (!isForce && !hasSpace && (isStageIdQuery(key) || isMapIdQuery(key))) {
    const hasHyphen = key.includes("-");

    const idResults = {
      stages: hasHyphen ? stages.filter(s => s.stageName.trim() !== "@" && s.stageId.toLowerCase().startsWith(key)) : [],
      maps: !hasHyphen ? maps.filter(m => m.mapName.trim() !== "@" && m.mapId.toLowerCase().startsWith(key)) : []
    };

    // ID検索でヒットすれば即座に返す
    if (idResults.stages.length > 0 || idResults.maps.length > 0) {
      return idResults;
    }
    // ヒットしなければ、そのまま下の名前検索へ進む（フォールバック）
  }

  // --- 2. 名前検索 ---
  // isForce の場合は「raw（全角半角混在のまま）」、通常は「normalize(raw)（半角小文字）」で分割
  const words = isForce 
    ? raw.split(/\s+/).filter(Boolean) 
    : normalize(raw).split(/\s+/).filter(Boolean);

  const filterFn = (item: { stageName?: string; mapName?: string }) => {
    const name = item.stageName || item.mapName || "";
    if (name.trim() === "@" || name.trim() === "＠" || name.trim() === "") return false;
    
    // 検索対象の文字も、フラグに応じて正規化するか決める
    const targetName = isForce ? name : normalize(name);
    return words.every(w => targetName.includes(w));
  };

  return { 
    stages: stages.filter(filterFn), 
    maps: maps.filter(filterFn) 
  };
}