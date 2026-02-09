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

export function getStageUrl(fullId: string): string {
  const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";

  const mapPart = fullId.split("-")[0];

  const type = mapPart.slice(0, -3);
  const map = parseInt(mapPart.slice(-3), 10);

  return `${baseUrl}&type=${type}&map=${map}`;
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