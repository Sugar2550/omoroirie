import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";

const DATA_DIR = path.resolve("data");

/** CSVを1行ずつ読む */
function readLines(file: string): string[] {
  return fs
    .readFileSync(file, "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

/** ステージCSVを読む（カンマ区切り） */
function readStageNames(file: string): string[] {
  return fs
    .readFileSync(file, "utf-8")
    .split(",")
    .map(s => s.trim())
    .filter(s => s && s !== "@");
}

export function loadAllStages(): StageEntry[] {
  const mapCsvPath = path.join(DATA_DIR, "Map_Name.csv");
  const mapLines = readLines(mapCsvPath);

  const result: StageEntry[] = [];

  for (const line of mapLines) {
    const [idStr, mapNameRaw] = line.split(",", 2);
    const mapId = Number(idStr);
    const mapName = mapNameRaw?.trim() ?? "";

    const resolved = resolveStageId(mapId);
    if (!resolved) continue;

    const { mapKey } = resolved;

    /** Z / Inv 系は同名流用なのでスキップ */
    if (mapKey.endsWith("Z") || mapKey.includes("Inv")) continue;

    /** ファイル名決定 */
    let stageFile: string;

    if (mapKey === "0" || mapKey === "1" || mapKey === "2") {
      stageFile = `StageName${mapKey}_ja.csv`;
    } else if (mapKey === "DM" || mapKey === "L" || mapKey === "G") {
      stageFile = `StageName_${mapKey}_ja.csv`;
    } else {
      stageFile = `StageName_${mapKey}_ja.csv`;
    }

    const fullPath = path.join(DATA_DIR, stageFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`[stage] missing: ${fullPath}`);
      continue;
    }

    const stageNames = readStageNames(fullPath);

    stageNames.forEach((stageName, index) => {
      result.push({
        mapId,
        mapKey,
        mapName,
        stageIndex: index,
        stageName
      });
    });
  }

  return result;
}

