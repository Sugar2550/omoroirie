import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { toMapCode } from "./mapId";

const DATA_DIR = "data";

/**
 * 日本編・未来編・宇宙編（3000–3008）
 */
function isChapterCategory(category: string): boolean {
  return category === "0" || category === "1" || category === "2";
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
    .filter(l => l.trim());

  /** mapIdRaw(number) -> mapName */
  const mapNameTable = new Map<number, string>();

  for (const line of mapNameLines) {
    const [id, name] = line.split(",").map(s => s.trim());
    if (!id || !name) continue;
    mapNameTable.set(Number(id), name);
  }

  /* ===============================
   * 2. StageName*.csv 読み込み
   * =============================== */
  const stageFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith("StageName") && f.endsWith("_ja.csv"));

  for (const file of stageFiles) {
    const category = file
      .replace(/^StageName_?/, "")
      .replace(/_ja\.csv$/, "");

    const csv = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    const lines = csv.split(/\r?\n/).filter(l => l.trim());

    /* ===============================
     * 日本編・未来編・宇宙編
     * （マップ＝ステージ）
     * =============================== */
    if (isChapterCategory(category)) {
      for (let mapIndex = 0; mapIndex < lines.length; mapIndex++) {
        const mapIdRaw =
          3000 + Number(category) * 3 + mapIndex;

        const mapName =
          mapNameTable.get(mapIdRaw) ?? "UNKNOWN";

        const { mapId, stageId } = toMapCode(mapIdRaw, category);

        result.push({
          stageIdRaw: mapIdRaw,
          stageId,
          stageName: mapName,

          mapIdRaw,
          mapId,
          mapName,

          aliases: [
            String(mapIdRaw),
            stageId,
            mapId,
            mapName
          ]
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

      if (cols.length === 0) continue;

      const mapIdRaw = Number(
        `${category}${mapIndex.toString().padStart(3, "0")}`
      );

      const mapName =
        mapNameTable.get(mapIdRaw) ?? category;

      const { mapId } = toMapCode(mapIdRaw, category);

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
            stageId,
            mapId,
            cols[stageIndex]
          ]
        });
      }
    }
  }

  return result;
}
