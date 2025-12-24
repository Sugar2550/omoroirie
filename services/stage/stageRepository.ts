import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";
import { buildStageUrl } from "./stageUrlUtil.js";

const DATA_DIR = path.resolve("services/stage/res");

/* =========================
 * CSV utility
 * ========================= */
function readCsvLines(file: string): string[] {
  return fs
    .readFileSync(path.join(DATA_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

/* =========================
 * Map_Name.csv
 * ========================= */
type MapRow = {
  id: number;
  name: string;
};

function loadMapNames(): MapRow[] {
  return readCsvLines("Map_Name.csv").map(line => {
    const [id, name] = line.split(",", 2);
    return { id: Number(id), name };
  });
}

/* =========================
 * stageName csv
 * ========================= */
function loadStageNames(file: string): string[][] {
  const lines = readCsvLines(file);

  // DM / L は改行なし
  if (file.includes("DM") || file.includes("L")) {
    return [lines.join(",").split(",").map(s => s.trim())];
  }

  const result: string[][] = [];
  let current: string[] = [];

  for (const l of lines.join(",").split(",")) {
    if (l === "@") {
      result.push(current);
      break;
    }
    if (l === "") continue;
    current.push(l);
  }

  return [current];
}

/* =========================
 * 公開API
 * ========================= */
export function loadAllStages(): StageEntry[] {
  const maps = loadMapNames();
  const result: StageEntry[] = [];

  for (const map of maps) {
    const resolved = resolveStageId(map.id);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    // stageName ファイル決定
    let stageFile: string | null = null;

    if (map.id >= 3000 && map.id <= 3008) {
      stageFile = `stageName${mapKey}.csv`;
    } else if (mapKey === "DM" || mapKey === "L") {
      stageFile = `stageName${mapKey}_ja.csv`;
    } else if (mapKey === "2_Inv" || mapKey === "2Z_Inv") {
      result.push({
        mapKey,
        mapIndex,
        mapName: map.name,
        stageNames: [mapKey.includes("Z") ? "フィリバスターゾンビ" : "フィリバスター"],
        url: buildStageUrl(mapKey, mapIndex)
      });
      continue;
    } else {
      stageFile = `stageNameR${mapKey}_ja.csv`;
    }

    if (!fs.existsSync(path.join(DATA_DIR, stageFile))) continue;

    const stageGroups = loadStageNames(stageFile);
    const stageNames = stageGroups[0] ?? [];

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
