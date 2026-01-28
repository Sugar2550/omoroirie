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
    .replace(/[~～〜〜〜]/g, "〜");
    // ハイフンやマイナスの置換を削除しました
}

export function isStageIdQuery(raw: string): boolean {
  // 厳密にマッチさせるため末尾までチェック
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

  // スペースが含まれている場合は、ID検索をスキップして強制的に名前検索(AND)へ
  const hasSpace = /\s+/.test(raw);

  // ============================
  // ID検索 (スペースがない場合のみ実行)
  // ============================
  if (!hasSpace && (isStageIdQuery(raw) || isMapIdQuery(raw))) {
    const key = raw.toUpperCase().replace(/[Ａ-Ｚ０-９]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    );

    const hasHyphen = key.includes("-");

    return {
      stages: hasHyphen 
        ? stages.filter(s => 
            s.stageName.trim() !== "@" && 
            s.stageName.trim() !== "＠" && 
            s.stageId.toUpperCase().startsWith(key)
          )
        : [],
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
  // 名前検索 (AND検索)
  // ============================
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => {
    if (s.stageName.trim() === "@" || s.stageName.trim() === "＠") return false;
    const nName = normalize(s.stageName);
    // すべての単語が含まれているか確認
    return words.every(w => nName.includes(w));
  });

  const mapHits = maps.filter(m => {
    if (m.mapName.trim() === "@" || m.mapName.trim() === "＠") return false;
    const nName = normalize(m.mapName);
    // すべての単語が含まれているか確認
    return words.every(w => nName.includes(w));
  });

  return { stages: stageHits, maps: mapHits };
}