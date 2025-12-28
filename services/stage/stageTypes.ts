export type StageEntry = {
  stageIdRaw: number;
  stageId: string;
  stageName: string;

  mapIdRaw: number;
  mapId: string;
  mapName: string;

  aliases: string[];
};

export type MapEntry = {
  mapIdRaw: number;
  mapId: string;
  mapName: string;
};
