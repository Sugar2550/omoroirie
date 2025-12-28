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

export type SearchResult =
  | { kind: "map"; map: MapEntry; stages: StageEntry[] }
  | { kind: "stage"; stage: StageEntry };
