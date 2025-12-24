export type StageEntry = {
  mapKey: string;        // A, NA, 0Z など
  mapIndex: number;      // map.html?map= の値
  mapName: string;       // マップ名
  stageNames: string[];  // 検索用（表示は map 単位）
  url: string;
};
