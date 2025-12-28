import fs from "fs";
import path from "path";
import { StageEntry, MapEntry } from "./stageTypes.js";
import { encodeMapId } from "./mapId.js";

const DATA_DIR = "data";

let stageList: StageEntry[] = [];
let mapList: MapEntry[] = [];

export function loadAll(): { stages: StageEntry[]; maps: MapEntry[] } {
  stageList = [];
  mapList = [];

  /* ===============================
   * Map_Name.csv
   * =============================== */
  const mapNameTable = new Map<number, string>();
  const mapCsv = path.join(DATA_DIR, "Map_Name.csv");

  if (fs.existsSync(mapCsv)) {
    for (const line of fs.readFileSync(mapCsv, "utf-8").split(/\r?\n/)) {
      if (!line || line === "@") continue;

      const [id, name] = line.split(",").map(s => s.trim());
      const num = Number(id);
      if (!Number.isFinite(num) || !name) continue;

      mapNameTable.set(num, name);

      mapList.push({
        mapIdRaw: num,
        mapId: encodeMapId(num),
        mapName: name
      });
    }
  }

  /* ===============================
   * StageName*.csv
   * =============================== */
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith("StageName") && f.endsWith("_ja.csv"));

  for (const file of files) {
    const catRaw = file
      .replace(/^StageName_?/, "")
      .replace(/_ja\.csv$/, "");

    const catNum = Number(catRaw);
    const isNumeric = Number.isFinite(catNum);

    const lines = fs.readFileSync(path.join(DATA_DIR, file), "utf-8")
      .split(/\r?\n/)
      .filter(l => l && l !== "@");

    for (let mapIndex = 0; mapIndex < lines.length; mapIndex++) {
      const names = lines[mapIndex]
        .split(",")
        .map(s => s.trim())
        .filter(s => s && s !== "@");

      if (names.length === 0) continue;

      // カテゴリ3は無視
      if (catRaw === "3") continue;

      let mapIdRaw: number;
      let mapId: string;

      if (isNumeric) {
        mapIdRaw = catNum * 1000 + mapIndex;
        mapId = encodeMapId(mapIdRaw);
      } else {
        continue;
      }

      const mapName = mapNameTable.get(mapIdRaw) ?? catRaw;

      for (let i = 0; i < names.length; i++) {
        stageList.push({
          stageIdRaw: mapIdRaw * 1000 + i,
          stageId: `${mapId}-${i.toString().padStart(3, "0")}`,
          stageName: names[i],

          mapIdRaw,
          mapId,
          mapName,

          aliases: []
        });
      }
    }
  }

  return { stages: stageList, maps: mapList };
}
