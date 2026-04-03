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
    .replace(/　/g, " ")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[~～〜〜〜]/g, "〜");
}

export function isStageIdQuery(raw: string): boolean {
  return /^[a-z0-9_]+-[0-9]+$/i.test(raw.trim());
}

export function isMapIdQuery(raw: string): boolean {
  const trimmed = raw.trim();
  const isStandardId = /^[a-z]+[0-9]+$/i.test(trimmed);
  const isRawNumericId = /^\d+$/.test(trimmed);

  return isStandardId || isRawNumericId;
}

/**
 * IDからURLを生成
 */
export function getStageUrl(fullId: string): string {
  const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
  
  const parts = fullId.split("-");
  const mapPart = parts[0];
  
  const type = mapPart.replace(/\d+$/, "");
  const map = parseInt(mapPart.match(/\d+$/)?.[0] ?? "0", 10);
  
  let url = `${baseUrl}&type=${type}&map=${map}`;
  
  if (parts.length > 1) {
    const stageNum = parseInt(parts[1], 10);
    url += `&stage=${stageNum}`;
  }
  
  return url;
}

/**
 * ステージ検索メインロジック
 */
export function search(keyword: string): { stages: StageEntry[]; maps: MapEntry[] } {
  let raw = keyword.trim().replace(/　/g, " ");
  if (!raw) return { stages: [], maps: [] };

  const forceFlags = ["-force", "-f"];
  const isForce = forceFlags.some(flag => raw.includes(flag));
  
  if (isForce) {
    forceFlags.forEach(flag => {
      raw = raw.replace(flag, "");
    });
    raw = raw.trim();
  }

  // ID判定用に英数字を半角・小文字化したキーを作成
  const key = raw
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase();

  const hasSpace = /\s+/.test(key);

  // 結果格納用
  let resultStages: StageEntry[] = [];
  let resultMaps: MapEntry[] = [];

  // --- 1. ID検索の試行 ---
  if (!isForce && !hasSpace && (isStageIdQuery(key) || isMapIdQuery(key))) {
    const hasHyphen = key.includes("-");

    if (hasHyphen) {
      resultStages = stages.filter(s => 
        s.stageName.trim() !== "@" && 
        s.stageId.toLowerCase().startsWith(key)
      );
    } else {
      resultMaps = maps.filter(m => 
        m.mapName.trim() !== "@" && 
        (m.mapId.toLowerCase().startsWith(key) || m.mapIdRaw.toString() === key)
      );
    }
  }

  // --- 2. 名前検索 ---
  // ID検索ですでにヒットしていても、名前検索の結果をマージする
  const words = isForce 
    ? raw.split(/\s+/).filter(Boolean) 
    : normalize(raw).split(/\s+/).filter(Boolean);

  const filterFn = (item: { stageName?: string; mapName?: string }) => {
    const name = item.stageName || item.mapName || "";
    if (name.trim() === "@" || name.trim() === "＠" || name.trim() === "") return false;
    
    const targetName = isForce ? name : normalize(name);
    return words.every(w => targetName.includes(w));
  };

  const nameStages = stages.filter(filterFn);
  const nameMaps = maps.filter(filterFn);

  // 重複を除去して合体 (Setはオブジェクトの参照比較なので、フィルタリングで重複を防ぐ)
  const finalStages = [...resultStages];
  nameStages.forEach(ns => {
    if (!finalStages.some(fs => fs.stageId === ns.stageId)) {
      finalStages.push(ns);
    }
  });

  const finalMaps = [...resultMaps];
  nameMaps.forEach(nm => {
    if (!finalMaps.some(fm => fm.mapId === nm.mapId)) {
      finalMaps.push(nm);
    }
  });

  return { 
    stages: finalStages, 
    maps: finalMaps 
  };
}