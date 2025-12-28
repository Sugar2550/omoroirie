import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から mapID 表示用コードを生成
 * 例:
 *  13047 → NA047
 *  3001  → 3001（未知カテゴリは数値フォールバック）
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    return "UNKNOWN";
  }

  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];

  // ✅ 未知カテゴリは例外にしない
  if (!category) {
    return `${upper}${index.toString().padStart(3, "0")}`;
  }

  return `${category}${index.toString().padStart(3, "0")}`;
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