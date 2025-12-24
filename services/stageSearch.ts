import fs from "fs";
import path from "path";
import { StageMapEntry } from "./stageModel.js";
import { resolveStageId } from "./stageIdUtil.js";

/* ============================
 * 状態
 * ============================ */
let loaded = false;
const allMaps: StageMapEntry[] = [];
const nameIndex = new Map<string, Set<StageMapEntry>>();

const DATA_DIR = path.resolve("data");
const MAX_WORDS = 4;

/* ============================
 * 正規化
 * ============================ */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

/* ============================
 * index 登録
 * ============================ */
function indexName(name: string, entry: StageMapEntry) {
  const key = normalize(name);
  if (!key) return;

  if (!nameIndex.has(key)) {
    nameIndex.set(key, new Set());
  }
  nameIndex.get(key)!.add(entry);
}

/* ============================
 * URL生成
 * ============================ */
function buildUrl(mapId: number): string {
  const resolved = resolveStageId(mapId);
  if (!resolved) return "";

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${resolved.mapKey}&map=${resolved.mapIndex}`;
}

/* ============================
 * CSV 読み込み（例：通常）
 * ============================ */
function loadSimpleCsv(
  file: string,
  baseMapId: number,
  displayPrefix: string
) {
  const raw = fs.readFileSync(file, "utf-8");
  const lines = raw.split(/\r?\n/);

  let offset = 0;
  for (const line of lines) {
    const parts = line.split(",").map(v => v.trim());
    if (!parts.length) continue;

    const mapId = baseMapId + offset;
    const entry: StageMapEntry = {
      mapId,
      mapKey: "",
      displayName: displayPrefix,
      url: buildUrl(mapId)
    };

    for (const p of parts) {
      if (!p || p === "＠") break;
      indexName(p, entry);
    }

    allMaps.push(entry);
    offset++;
  }
}

/* ============================
 * 初期化
 * ============================ */
function loadOnce() {
  if (loaded) return;

  loadSimpleCsv(
    path.join(DATA_DIR, "stageName_DM_ja.csv"),
    30000,
    "魔界編"
  );

  loaded = true;
}

/* ============================
 * 検索
 * ============================ */
export function searchStage(keyword: string): StageMapEntry[] {
  if (!keyword) return [];

  loadOnce();

  const words = keyword
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean)
    .slice(0, MAX_WORDS);

  if (!words.length) return [];

  let candidates: Set<StageMapEntry> | null = null;

  for (const w of words) {
    const hit = nameIndex.get(w);
    if (!hit) return [];

    candidates = candidates
      ? new Set([...candidates].filter(e => hit.has(e)))
      : new Set(hit);
  }

  return candidates
    ? Array.from(candidates).sort((a, b) => a.mapId - b.mapId)
    : [];
}
