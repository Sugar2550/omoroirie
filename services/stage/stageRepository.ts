import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { toMapCode } from "./mapId";

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
    .filter(l => l.trim());

  /**
   * rawMapId -> mapName
   */
  const mapNameTable = new Map<string, string>();

  for (const line of mapNameLines) {
    const [id, name] = line.split(",").map(s => s.trim());
    if (!id || !name) continue;
    mapNameTable.set(id, name);
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

    for (let mapIndex = 0; mapIndex < lines.length; mapIndex++) {
      const cols = lines[mapIndex]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (cols.length === 0) continue;

      /* ===============================
       * 日本・未来・宇宙編（特例）
       * =============================== */
      if (category === "0" || category === "1" || category === "2") {
        // 3000–3008 を mapIndex から逆算
        const rawMapId = (3000 + Number(category) * 3 + mapIndex).toString();
        const mapName = mapNameTable.get(rawMapId) ?? "UNKNOWN";

        const { rawMapId: r, mapCode } = toMapCode(rawMapId, category);

        // 章ステージは「マップ＝ステージ」なので 1 件のみ
        result.push({
          stageId: mapCode,
          stageName: mapName,

          rawMapId: r,
          mapCode,
          mapName
        });

        continue;
      }

      /* ===============================
       * 通常カテゴリ
       * =============================== */
      for (let stageIndex = 0; stageIndex < cols.length; stageIndex++) {
        const rawMapId = `${category}${mapIndex.toString().padStart(3, "0")}`;
        const mapName = mapNameTable.get(rawMapId) ?? category;

        const { rawMapId: r, mapCode } = toMapCode(rawMapId, category);

        result.push({
          stageId: `${mapCode}-${stageIndex.toString().padStart(3, "0")}`,
          stageName: cols[stageIndex],

          rawMapId: r,
          mapCode,
          mapName
        });
      }
    }
  }

  return result;
}

