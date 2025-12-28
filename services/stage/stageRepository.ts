import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { encodeMapId } from "./mapId.js";

const DATA_DIR = "data";

export function loadAllStages(): StageEntry[] {
  const result: StageEntry[] = [];

  /* ===============================
   * Map_Name.csv 読み込み
   * =============================== */
  const mapNamePath = path.join(DATA_DIR, "Map_Name.csv");
  const mapNameTable = new Map<number, string>();

  if (fs.existsSync(mapNamePath)) {
    const lines = fs.readFileSync(mapNamePath, "utf-8")
      .split(/\r?\n/)
      .filter(Boolean);

    for (const line of lines) {
      const [id, name] = line.split(",").map(s => s.trim());
      const numId = Number(id);
      if (Number.isFinite(numId) && name) {
        mapNameTable.set(numId, name);
      }
    }
  }

  /* ===============================
   * StageName*.csv 読み込み
   * =============================== */
  const stageFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith("StageName") && f.endsWith("_ja.csv"));

  for (const file of stageFiles) {
    const categoryRaw = file
      .replace(/^StageName_?/, "")
      .replace(/_ja\.csv$/, "");

    const categoryNum = Number(categoryRaw);
    const isNumericCategory = Number.isFinite(categoryNum);

    const csv = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    const lines = csv.split(/\r?\n/).filter(Boolean);

    for (let mapIndex = 0; mapIndex < lines.length; mapIndex++) {
      const cols = lines[mapIndex]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (cols.length === 0) continue;

      /* ===============================
       * 日本・未来・宇宙編（特例）
       * =============================== */
      if (categoryRaw === "0" || categoryRaw === "1" || categoryRaw === "2") {
        const mapIdRaw = 3000 + Number(categoryRaw) * 3 + mapIndex;
        const mapName = mapNameTable.get(mapIdRaw) ?? "UNKNOWN";

        const mapId = encodeMapId(mapIdRaw);

        result.push({
          stageIdRaw: mapIdRaw,
          stageId: mapId,
          stageName: mapName,

          mapIdRaw,
          mapId,
          mapName,

          aliases: []
        });

        continue;
      }

      /* ===============================
       * 通常カテゴリ
       * =============================== */
      for (let stageIndex = 0; stageIndex < cols.length; stageIndex++) {
        let mapIdRaw: number;
        let mapId: string;

        if (isNumericCategory) {
          mapIdRaw = categoryNum * 1000 + mapIndex;
          mapId = encodeMapId(mapIdRaw);
        } else {
          // 2Z, 2_Inv, SR 等
          mapIdRaw = NaN;
          mapId = `${categoryRaw}${mapIndex
            .toString()
            .padStart(3, "0")}`;
        }

        const mapName = Number.isFinite(mapIdRaw)
          ? mapNameTable.get(mapIdRaw) ?? categoryRaw
          : categoryRaw;

        result.push({
          stageIdRaw: Number.isFinite(mapIdRaw)
            ? mapIdRaw * 1000 + stageIndex
            : stageIndex,

          stageId: `${mapId}-${stageIndex
            .toString()
            .padStart(3, "0")}`,

          stageName: cols[stageIndex],

          mapIdRaw,
          mapId,
          mapName,

          aliases: []
        });
      }
    }
  }

  return result;
}
