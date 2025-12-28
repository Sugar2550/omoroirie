import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から mapID 表示用コードを生成
 * 数値カテゴリ専用
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    throw new Error(`encodeMapId received invalid rawId: ${rawId}`);
  }

  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];
  if (!category) {
    throw new Error(`Unknown numeric category: ${upper}`);
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}
