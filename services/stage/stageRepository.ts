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

    if (Number.isNaN(numericId)) continue;

    const resolved = resolveStageId(numericId);
    if (!resolved) continue;

    const { mapKey, mapIndex } = resolved;

    // ファイル名決定（仕様厳守）
    let stageFile: string;

    if (/^[0-2]$/.test(mapKey)) {
      // 日本編・未来編・宇宙編
      stageFile = path.join(
        DATA_DIR,
        `StageName${mapKey}_ja.csv`
      );
    } else {
      // それ以外（R含めない仕様）
      stageFile = path.join(
        DATA_DIR,
        `StageName_${mapKey}_ja.csv`
      );
    }

    if (!fs.existsSync(stageFile)) {
      console.warn("[stage] missing:", stageFile);
      continue;
    }

    const raw = fs.readFileSync(stageFile, "utf-8");

    const stageNames =
      /^[0-2]$/.test(mapKey)
        ? raw
            .split(/\r?\n/)
            .map(l => l.split(",")[0]?.trim())
            .filter(Boolean)
        : raw
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
