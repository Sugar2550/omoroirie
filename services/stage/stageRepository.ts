import fs from "fs";
import path from "path";
import { StageEntry } from "./stageTypes.js";
import { resolveStageId } from "./stageIdUtil.js";

const DATA_DIR = path.resolve("data");

function normalizeMapKey(raw: string): string {
  return raw
    .replace(/Z$/, "")
    .replace(/_Inv$/, "");
}

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
    const key = normalizeMapKey(mapKey);

    let stageFile: string;

    // ---- CSV ファイル選択 ----
    if (/^[0-2]$/.test(key)) {
      stageFile = path.join(DATA_DIR, `StageName${key}_ja.csv`);
    } else if (["DM", "L", "G"].includes(key)) {
      stageFile = path.join(DATA_DIR, `StageName_${key}_ja.csv`);
    } else {
      stageFile = path.join(DATA_DIR, `StageName_R${key}_ja.csv`);
    }

    if (!fs.existsSync(stageFile)) {
      console.warn(`[stage] missing: ${stageFile}`);
      continue;
    }

    const raw = fs.readFileSync(stageFile, "utf-8").trim();

    // ---- CSV 読み分け ----
    let stageNames: string[];

    if (/^[0-2]$/.test(key)) {
      // 0 / 1 / 2 系：1行 = 1ステージ
      stageNames = raw
        .split(/\r?\n/)
        .map(line => line.replace(/,$/, "").trim())
        .filter(Boolean);
    } else {
      // 通常：1行 = 1マップ、カンマ区切り
      stageNames = raw
        .split(",")
        .map(s => s.trim())
        .filter(s => s && s !== "@");
    }

    result.push({
      numericId,
      mapKey: key,
      mapIndex,
      mapName,
      stageNames
    });
  }

  return result;
}

