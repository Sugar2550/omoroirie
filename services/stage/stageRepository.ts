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
  const mapNameTable = new Map<number, string>();
  const mapNamePath = path.join(DATA_DIR, "Map_Name.csv");

  if (fs.existsSync(mapNamePath)) {
    const lines = fs.readFileSync(mapNamePath, "utf-8")
      .split(/\r?\n/)
      .filter(Boolean);

    for (const line of lines) {
      const [id, name] = line.split(",").map(s => s.trim());
      const num = Number(id);
      if (Number.isFinite(num) && name) {
        mapNameTable.set(num, name);
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
      const stages = lines[mapIndex]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (stages.length === 0) continue;

      /* ===============================
       * 日本・未来・宇宙編（0 / 1 / 2）
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
       * カテゴリ 3（内部CSV・無視）
       * =============================== */
      if (categoryRaw === "3") {
        continue;
      }

      /* ===============================
       * 通常カテゴリ
       * =============================== */
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
        let mapIdRaw: number | null = null;
        let mapId: string;

        if (isNumericCategory) {
          mapIdRaw = categoryNum * 1000 + mapIndex;
          mapId = encodeMapId(mapIdRaw);
        } else {
          // 2Z / 2_Inv / SR / CA 等
          mapId = `${categoryRaw}${mapIndex
            .toString()
            .padStart(3, "0")}`;
        }

        const mapName =
          mapIdRaw !== null
            ? mapNameTable.get(mapIdRaw) ?? categoryRaw
            : categoryRaw;

        result.push({
          stageIdRaw:
            mapIdRaw !== null
              ? mapIdRaw * 1000 + stageIndex
              : stageIndex,

          stageId: `${mapId}-${stageIndex
            .toString()
            .padStart(3, "0")}`,

          stageName: stages[stageIndex],

          mapIdRaw: mapIdRaw ?? -1,
          mapId,
          mapName,

          aliases: []
        });
      }
    }
  }

  return result;
}
