import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";
import { buildStageUrl } from "./stageUrlUtil.js";

const DATA_DIR = path.resolve("data");

function readLines(file: string): string[] {
  return fs
    .readFileSync(path.join(DATA_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && l !== "@");
}

export function loadAllStages(): StageEntry[] {
  const mapLines = readLines("Map_Name.csv");
  const result: StageEntry[] = [];

  for (const line of mapLines) {
    const [idStr, mapName] = line.split(",", 2);
    const numericId = Number(idStr);

    const resolved = resolveStageId(numericId);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    let file = "";

    if (mapKey === "L" || mapKey === "DM") {
      file = `stageName_${mapKey}_ja.csv`;
      const names = readLines(file).join(",").split(",").filter(Boolean);

      result.push({
        mapKey,
        mapIndex: 0,
        mapName,
        stageNames: names,
        numericId,
        url: buildStageUrl(mapKey, 0)
      });
      continue;
    }

    if (mapKey === "0" || mapKey === "1" || mapKey === "2") {
      file = `stageName${mapKey}_ja.csv`;
      const rows = readLines(file);

      rows.forEach((row, idx) => {
        const names = row.split(",").map(s => s.trim()).filter(Boolean);

        result.push({
          mapKey,
          mapIndex: idx,
          mapName,
          stageNames: names,
          numericId,
          url: buildStageUrl(mapKey, idx)
        });
      });
      continue;
    }

    file = `stageNameR${mapKey}_ja.csv`;
    if (!fs.existsSync(path.join(DATA_DIR, file))) continue;

    const names = readLines(file).join(",").split(",").filter(Boolean);

    result.push({
      mapKey,
      mapIndex,
      mapName,
      stageNames: names,
      numericId,
      url: buildStageUrl(mapKey, mapIndex)
    });
  }

  return result;
}

