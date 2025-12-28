import { StageEntry } from "./stageTypes.js";

const STORY_BASE_MAP: Record<string, number> = {
  "0": 3000,
  "1": 3003,
  "2": 3006
};

/**
 * mapCode + rawMapId から JDB 用 URL を生成
 */
function buildMapUrl(mapCode: string, rawMapId: string): string {
  // 日本編・未来編・宇宙編
  if (mapCode === "0" || mapCode === "1" || mapCode === "2") {
    const base = STORY_BASE_MAP[mapCode];
    const map = Number(rawMapId) - base;

    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${mapCode}&map=${map}`;
  }

  // 通常マップ
  const type = mapCode.replace(/\d+$/, "");
  const map = Number(mapCode.replace(/^\D+/, ""));

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}

/**
 * 単体表示
 */
export function formatStageSingle(s: StageEntry): string {
  return (
    "```" +
    `${s.mapCode}(${s.rawMapId}) ${s.stageName}\n` +
    buildMapUrl(s.mapCode, s.rawMapId) +
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
      .map(s => `${s.mapCode} ${s.stageName}`)
      .join("\n") +
    "```"
  );
}

/**
 * マップ単位で集約 → URL付き
 */
export function formatStageGroupedByMap(stages: StageEntry[]): string {
  const grouped = new Map<string, StageEntry[]>();

  for (const s of stages) {
    if (!grouped.has(s.mapCode)) {
      grouped.set(s.mapCode, []);
    }
    grouped.get(s.mapCode)!.push(s);
  }

  return (
    "```" +
    [...grouped.entries()]
      .map(([mapCode, list]) => {
        const mapName = list[0].mapName;
        const rawMapId = list[0].rawMapId;
        const url = buildMapUrl(mapCode, rawMapId);

        return (
          `${mapCode}(${rawMapId}) ${mapName}\n` +
          `${url}\n` +
          `  └ ${list.length} stages`
        );
      })
      .join("\n\n") +
    "```"
  );
}
