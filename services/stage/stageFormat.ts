import { StageEntry } from "./stageTypes.js";

/**
 * 日本編・未来編・宇宙編 type 対応表
 */
const STORY_TYPE: Record<number, string> = {
  0: "NA",
  1: "FA",
  2: "SA"
};

/**
 * 表示・URL 用に先頭 R を除去
 */
function stripR(id: string): string {
  return id.startsWith("R") ? id.slice(1) : id;
}

/**
 * マップURL生成（正規版）
 */
function buildMapUrl(entry: StageEntry): string {
  const { mapIdRaw, mapId } = entry;

  // 日本・未来・宇宙編（3000〜3008）
  if (mapIdRaw >= 3000 && mapIdRaw <= 3008) {
    const typeIndex = Math.floor((mapIdRaw - 3000) / 3);
    const type = STORY_TYPE[typeIndex];
    const map = mapIdRaw - (3000 + typeIndex * 3);

    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
  }

  // 通常マップ
  const cleanMapId = stripR(mapId);
  const type = cleanMapId.replace(/\d+$/, "");
  const map = Number(cleanMapId.replace(/^\D+/, ""));

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

/**
 * 単体表示
 */
export function formatStageSingle(s: StageEntry): string {
  const stageId = stripR(s.stageId);

  const title = `${stageId}(${s.mapIdRaw}) ${s.stageName}`;
  const url = buildMapUrl(s);

  return `${title}\n${url}`;
}

/**
 * 複数ステージ表示（URLなし）
 */
export function formatStageList(stages: StageEntry[]): string {
  return stages
    .map(s => `${stripR(s.stageId)} ${s.stageName}`)
    .join("\n");
}

/**
 * マップ単位集約表示（URL付き）
 */
export function formatStageGroupedByMap(stages: StageEntry[]): string {
  const grouped = new Map<number, StageEntry[]>();

  for (const s of stages) {
    if (!grouped.has(s.mapIdRaw)) {
      grouped.set(s.mapIdRaw, []);
    }
    grouped.get(s.mapIdRaw)!.push(s);
  }

  return [...grouped.values()]
    .map(list => {
      const head = list[0];
      const mapId = stripR(head.mapId);
      const url = buildMapUrl(head);

      return (
        `${mapId}(${head.mapIdRaw}) ${head.mapName}\n` +
        `${url}\n` +
        `  └ ${list.length} stages`
      );
    })
    .join("\n\n");
}
