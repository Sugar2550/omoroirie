import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { encodeMapId } from "./mapId.js";

const DATA_DIR = "data";

/**
 * 日本編・未来編・宇宙編 rawMapId 判定
 * 3000–3008 を特例として扱う
 */
function isChapterMap(rawMapId: number): boolean {
  return rawMapId >= 3000 && rawMapId <= 3008;
}

export function loadAllStages(): StageEntry[] {
  const result: StageEntry[] = [];

  /* ===============================
   * 1. Map_Name.csv 読み込み
   * =============================== */
  const mapNamePath = path.join(DATA_DIR, "Map_Name.csv");
  const mapNameLines = fs
    .readFileSync(mapNamePath, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  const mapNameTable = new Map<number, string>();

  for (const line of mapNameLines) {
    const [id, name] = line.split(",").map(s => s.trim());
    if (!id || !name) continue;
    mapNameTable.set(Number(id), name);
  }

  /* ===============================
   * 2. StageName*.csv 読み込み
   * =============================== */
  const stageFiles = fs
    .readdirSync(DATA_DIR)
    .filter(f => f.startsWith("StageName") && f.endsWith("_ja.csv"));

  for (const file of stageFiles) {
    const categoryRaw = file
      .replace(/^StageName_?/, "")
      .replace(/_ja\.csv$/, "");

    const categoryNum = Number(categoryRaw);
    const isNumericCategory = !Number.isNaN(categoryNum);

    const csv = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    const lines = csv.split(/\r?\n/).filter(Boolean);

    /* ===============================
     * 日本編・未来編・宇宙編（章マップ）
     * =============================== */
    if (category === 0 || category === 1 || category === 2) {
      for (let i = 0; i < lines.length; i++) {
        const mapIdRaw = 3000 + category * 3 + i;
        const mapName = mapNameTable.get(mapIdRaw) ?? "UNKNOWN";

        result.push({
          stageIdRaw: mapIdRaw,
          stageId: String(category), // 検索用
          stageName: mapName,

          mapIdRaw,
          mapId: String(category),
          mapName,

          aliases: [String(mapIdRaw)]
        });
      }
      continue;
    }

    /* ===============================
     * 通常カテゴリ
     * =============================== */
    for (let mapIndex = 0; mapIndex < lines.length; mapIndex++) {
      const cols = lines[mapIndex]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);


      let mapIdRaw: number;
      let mapId: string;

      if (isNumericCategory) {
        mapIdRaw = categoryNum * 1000 + mapIndex;
        mapId = encodeMapId(mapIdRaw);
      } else {
        // 例: 2Z, 2_Inv, SR
        mapIdRaw = NaN;
        mapId = `${categoryRaw}${mapIndex
          .toString()
          .padStart(3, "0")}`;
      }

      const mapName = mapNameTable.get(mapIdRaw) ?? mapId;

      for (let stageIndex = 0; stageIndex < cols.length; stageIndex++) {
        const stageIdRaw = mapIdRaw * 1000 + stageIndex;
        const stageId = `${mapId}${stageIndex
          .toString()
          .padStart(3, "0")}`;

        result.push({
          stageIdRaw,
          stageId,
          stageName: cols[stageIndex],

          mapIdRaw,
          mapId,
          mapName,

          aliases: [
            String(stageIdRaw),
            `${mapId}-${stageIndex}`
          ]
        });
      }
    }
  }

  return result;
}
