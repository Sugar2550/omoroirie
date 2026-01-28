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
    // ハイフンの置換 (ー) を削除しました
}

export function search(keyword: string): {
  stages: StageEntry[];
  maps: MapEntry[];
} {
  const raw = keyword.trim();
  if (!raw) return { stages: [], maps: [] };

  const words = normalize(raw).split(/\s+/).filter(Boolean);

  // ============================
  // ID検索（単一ワードかつID形式の場合のみ）
  // ============================
  if (words.length === 1 && (isStageIdQuery(raw) || isMapIdQuery(raw))) {
    const key = words[0];
    const hasHyphen = key.includes("-");

    return {
      stages: hasHyphen 
        ? stages.filter(s => 
            s.stageName.trim() !== "@" && s.stageName.trim() !== "＠" && 
            s.stageId.toUpperCase().startsWith(key)
          )
        : [],
      maps: !hasHyphen
        ? maps.filter(m => 
            m.mapName.trim() !== "@" && m.mapName.trim() !== "＠" && 
            m.mapId.toUpperCase().startsWith(key)
          )
        : []
    };
  }

  // ============================
  // 名前検索 (AND検索)
  // ============================
  if (words.length === 0) return { stages: [], maps: [] };

  const stageHits = stages.filter(s => {
    if (s.stageName.trim() === "@" || s.stageName.trim() === "＠") return false;
    const nName = normalize(s.stageName);
    return words.every(w => nName.includes(w));
  });

  const mapHits = maps.filter(m => {
    if (m.mapName.trim() === "@" || m.mapName.trim() === "＠") return false;
    const nName = normalize(m.mapName);
    return words.every(w => nName.includes(w));
  });

  return { stages: stageHits, maps: mapHits };
}