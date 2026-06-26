import { StageEntry, MapEntry } from "./stageTypes.js";

function buildUrl(id: string): string {
  const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
  const parts = id.split("-");
  const mapPart = parts[0];

  const match = mapPart.match(/^(.*?)(\d{3})$/);
  
  let type = "";
  let map = 0;

  if (match) {
    type = match[1];
    map = Number(match[2]);
  } else {
    type = mapPart.replace(/\d+$/, "");
    map = Number(mapPart.match(/\d+$/)?.[0] ?? 0);
  }

  let url = `${baseUrl}&type=${type}&map=${map}`;

  if (parts.length > 1) {
    const stage = Number(parts[1]);
    url += `&stage=${stage}`;
  }

  return url;
}

export function formatStageSingle(s: StageEntry): string {
  return (
    "```" +
    `${s.stageId}(${s.mapIdRaw}) ${s.stageName}` +
    "```\n" +
    buildUrl(s.stageId)
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
        buildUrl(m.mapId)
      );
    })
    .join("\n");
}