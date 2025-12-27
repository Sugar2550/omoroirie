import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";

const DATA_DIR = "data";

export function loadAllStages(): StageEntry[] {
  const result: StageEntry[] = [];

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith("StageName") && f.endsWith("_ja.csv"));

  for (const file of files) {
    const mapId = file
      .replace(/^StageName_?/, "")
      .replace(/_ja\.csv$/, "");

    const csv = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");

    const lines = csv.split(/\r?\n/).filter(l => l.trim());

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(",").map(s => s.trim()).filter(Boolean);

      for (let stageIndex = 0; stageIndex < cols.length; stageIndex++) {
        result.push({
          mapId,
          mapName: mapId,      // 後で集約表示用
          stageName: cols[stageIndex],
          stageIndex
        });
      }
    }
  }

  return result;
}

