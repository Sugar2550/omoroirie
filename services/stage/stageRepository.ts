import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";

const DATA_DIR = "data";

function readCsv(file: string): string[] {
  return fs
    .readFileSync(path.join(DATA_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

export function loadAllStages(): StageEntry[] {
  const mapLines = readCsv("Map_Name.csv");
  const result: StageEntry[] = [];

  for (const line of mapLines) {
    const [idStr, mapName] = line.split(",", 2);
    const numericId = Number(idStr);

    const resolved = resolveStageId(numericId);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    // Z 系は元と同じなので無視
    if (mapKey.endsWith("Z")) continue;

    const fileCandidates = [
      `StageName_${mapKey}_ja.csv`,
      `StageName_R${mapKey}_ja.csv`
    ];

    const file = fileCandidates.find(f =>
      fs.existsSync(path.join(DATA_DIR, f))
    );

    if (!file) {
      console.error(`[stage] missing: data/${fileCandidates[0]}`);
      continue;
    }

    // --- CSV 読み取り ---
    let stageNames: string[] = [];

    if (["0", "1", "2"].includes(mapKey)) {
      // 改行 = 1ステージ
      stageNames = readCsv(file).map(l => l.replace(/,+$/, ""));
    } else {
      // カンマ区切り
      stageNames = readCsv(file)
        .join(",")
        .split(",")
        .map(s => s.trim())
        .filter(s => s && s !== "@");
    }

    for (const stageName of stageNames) {
      result.push({
        numericId,
        mapKey,
        mapIndex,
        mapName,
        stageName
      });
    }
  }

  return result;
}

