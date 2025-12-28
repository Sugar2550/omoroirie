import { StageEntry, MapEntry } from "./stageTypes.js";

function stripR(s: string) {
  return s.startsWith("R") ? s.slice(1) : s;
}

function mapUrl(mapId: string, map: number): string {
  const type = mapId.replace(/\d+$/, "");
  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

export function formatStageSingle(s: StageEntry): string {
  const id = stripR(s.stageId);
  const map = Number(stripR(s.mapId).replace(/^\D+/, ""));
  return (
    "```" +
    `${id}(${s.mapIdRaw}) ${s.stageName}` +
    "```\n" +
    mapUrl(stripR(s.mapId), map)
  );
}

export function formatStageList(list: StageEntry[]): string {
  return (
    "```" +
    list.map(s => `${stripR(s.stageId)} ${s.stageName}`).join("\n") +
    "```"
  );
}

export function formatMapList(maps: MapEntry[]): string {
  return maps.map(m => {
    const id = stripR(m.mapId);
    const map = Number(id.replace(/^\D+/, ""));
    return (
      "```" +
      `${id}(${m.mapIdRaw}) ${m.mapName}` +
      "```\n" +
      mapUrl(id, map)
    );
  }).join("\n");
}
