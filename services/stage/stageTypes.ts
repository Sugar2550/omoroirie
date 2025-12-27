export type StageEntry = {
  /** Map_Name.csv の数値ID（検索用） */
  mapId: number;

  /** URL / ファイル識別用（0, 1, 2, DM, L, G …） */
  mapKey: string;

  /** マップ名（日本編、未来編、北海道など） */
  mapName: string;

  /** ステージ番号（0始まり） */
  stageIndex: number;

  /** ステージ名 */
  stageName: string;
};

