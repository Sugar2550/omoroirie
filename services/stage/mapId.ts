import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から mapID 表示用コードを生成
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    return "UNKNOWN";
  }

  /* =====================================
   * 日本 / 未来 / 宇宙（通常章）
   * 3000〜3008
   * 表示はそのまま数値
   * ===================================== */
  if (rawId >= 3000 && rawId <= 3008) {
    return String(rawId);
  }

  /* =====================================
   * ゾンビ章
   * 20000〜22002
   * ===================================== */
  if (rawId >= 20000 && rawId <= 22002) {
    return String(rawId);
  }

  /* =====================================
   * フィリバスター
   * ===================================== */
  if (rawId === 23000) {
    return "23000";
  }

  /* =====================================
   * 通常カテゴリ
   * ===================================== */
  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];

  // 未知カテゴリは安全に数値フォールバック
  if (!category) {
    return `${upper}${index.toString().padStart(3, "0")}`;
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}
