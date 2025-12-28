import { StageEntry } from "./stageTypes.js";

/**
 * 日本編・未来編・宇宙編 base
 */
const STORY_BASE: Record<number, number> = {
  0: 3000,
  1: 3003,
  2: 3006
};

/**
 * マップURL生成
 */
function buildMapUrl(entry: StageEntry): string {
  const { mapIdRaw, mapId } = entry;

  // 日本編・未来編・宇宙編
  if (mapIdRaw >= 3000 && mapIdRaw <= 3008) {
    const type = Math.floor((mapIdRaw - 3000) / 3);
    const base = STORY_BASE[type];
    const map  = mapIdRaw - base;

    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
  }

  // 通常マップ
  const type = mapId.replace(/\d+$/, "");
  const map  = Number(mapId.replace(/^\D+/, ""));

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

/**
 * 単体表示
 */
export function formatStageSingle(s: StageEntry): string {
  return (
    "```" +
    `${s.stageId}(${s.stageIdRaw}) ${s.stageName}\n` +
    buildMapUrl(s) +
    "```"
  );
}

/**
 * 複数ステージ（非集約）
 */
export function formatStageList(stages: StageEntry[]): string {
  return (
    "```" +
    stages
      .map(s => `${s.stageId} ${s.stageName}`)
      .join("\n") +
    "```"
  );
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

  return (
    "```" +
    [...grouped.values()]
      .map(list => {
        const head = list[0];
        const url = buildMapUrl(head);

        return (
          `${head.mapId}(${head.mapIdRaw}) ${head.mapName}\n` +
          `${url}\n` +
          `  └ ${list.length} stages`
        );
      })
      .join("\n\n") +
    "```"
  );
}
