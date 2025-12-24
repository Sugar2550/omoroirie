import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";
import { buildStageUrl } from "./stageUrlUtil.js";

const DATA_DIR = path.resolve("data");

/* =========================
 * CSV util
 * ========================= */
function readCsv(file: string): string[] {
  return fs
    .readFileSync(path.join(DATA_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

/* =========================
 * Map_Name.csv
 * ========================= */
function loadMapNames() {
  return readCsv("Map_Name.csv").map(line => {
    const [id, name] = line.split(",", 2);
    return { id: Number(id), name };
  });
}

/* =========================
 * stageName csv
 * ========================= */
function loadStageNames(file: string): string[] {
  const raw = readCsv(file).join(",");
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(s => s && s !== "@");
}

/* =========================
 * public
 * ========================= */
export function loadAllStages(): StageEntry[] {
  const maps = loadMapNames();
  const result: StageEntry[] = [];

  for (const map of maps) {
    const resolved = resolveStageId(map.id);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    let stageFile: string | undefined;

    if (map.id >= 3000 && map.id <= 3008) {
      stageFile = `stageName${mapKey}.csv`;
    } else if (mapKey === "DM" || mapKey === "L") {
      stageFile = `stageName${mapKey}_ja.csv`;
    } else if (mapKey === "2_Inv") {
      result.push({
        mapKey,
        mapIndex,
        mapName: map.name,
        stageNames: ["フィリバスター"],
        url: buildStageUrl(mapKey, mapIndex)
      });
      continue;
    } else if (mapKey === "2Z_Inv") {
      result.push({
        mapKey,
        mapIndex,
        mapName: map.name,
        stageNames: ["フィリバスターゾンビ"],
        url: buildStageUrl(mapKey, mapIndex)
      });
      continue;
    } else {
      stageFile = `stageNameR${mapKey}_ja.csv`;
    }

    if (!stageFile) continue;

    const fullPath = path.join(DATA_DIR, stageFile);
    if (!fs.existsSync(fullPath)) continue;

    const stageNames = loadStageNames(stageFile);

    result.push({
      mapKey,
      mapIndex,
      mapName: map.name,
      stageNames,
      url: buildStageUrl(mapKey, mapIndex)
    });
  }

  return result;
}
