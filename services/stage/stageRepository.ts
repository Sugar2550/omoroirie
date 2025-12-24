import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";

const DATA_DIR = path.resolve("data");

export function loadAllStages(): StageEntry[] {
  const mapCsv = fs.readFileSync(
    path.join(DATA_DIR, "Map_Name.csv"),
    "utf-8"
  );

  const result: StageEntry[] = [];

  for (const line of mapCsv.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const [idStr, mapName] = line.split(",", 2);
    const numericId = Number(idStr);

    const resolved = resolveStageId(numericId);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    const stageFile = path.join(
      DATA_DIR,
      `stageNameR${mapKey}_ja.csv`
    );
    if (!fs.existsSync(stageFile)) continue;

    const stageNames = fs
      .readFileSync(stageFile, "utf-8")
      .split(",")
      .map(s => s.trim())
      .filter(s => s && s !== "@");

    result.push({
      numericId,      
      mapKey,
      mapIndex,
      mapName,
      stageNames
    });
  }

  return result;
}