import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から mapID 表示用コードを生成
 * 例: 13047 → NA047
 */
export function encodeMapId(rawId: number): string {
  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];
  if (!category) {
    throw new Error(`Unknown category: ${upper}`);
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}

/**
 * StageRepository 用
 * rawMapId + category から mapCode を生成
 */
export function toMapCode(
  rawMapId: string,
  category: string
): { rawMapId: string; mapCode: string } {

  const raw = Number(rawMapId);

  // 日本編・未来編・宇宙編（特例）
  if (category === "0" || category === "1" || category === "2") {
    return {
      rawMapId,
      mapCode: category
    };
  }

  // 通常マップ
  return {
    rawMapId,
    mapCode: encodeMapId(raw)
  };
}

/**
 * 検索用正規化
 * - 大文字化
 * - R 接頭辞除去
 */
export function normalizeMapId(input: string): string {
  return input
    .toUpperCase()
    .replace(/^R+/, "")
    .trim();
}
