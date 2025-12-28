export type StageEntry = {

  /** 生のステージID（CSV由来・数値）例: 13047 */
  stageIdRaw: number;

  /** 表示・検索用ステージID 例: "NA047" */
  stageId: string;

  /** ステージ名 */
  stageName: string;

  /** 生のマップID（数値）例: 13048 */
  mapIdRaw: number;

  /** 表示・検索用マップID 例: "NA048" */
  mapId: string;

  /** マップ名 */
  mapName: string;

  /** 旧表記・別名・数値ID文字列など */
  aliases: string[];
};
