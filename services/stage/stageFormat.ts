import { StageEntry, MapEntry } from "./stageTypes.js";

function buildMapUrlFromMapId(mapId: string): string {
  const type = mapId.replace(/\d+$/, ""); 
  const map = Number(mapId.match(/\d+$/)?.[0] ?? 0); 

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

export function formatStageSingle(s: StageEntry): string {
  return (
    "```" +
    `${s.stageId}(${s.mapIdRaw}) ${s.stageName}` +
    "```\n" +
    buildMapUrlFromMapId(s.mapId)
  );
}

export function formatStageList(list: StageEntry[]): string {
  return (
    "```" +
    list.map(s => `${s.stageId} ${s.stageName}`).join("\n") +
    "```"
  );
}

export function formatMapList(maps: MapEntry[]): string {
  return maps
    .map(m => {
      return (
        "```" +
        `${m.mapId}(${m.mapIdRaw}) ${m.mapName}` +
        "```\n" +
        buildMapUrlFromMapId(m.mapId)
      );
    })
    .join("\n");
}
