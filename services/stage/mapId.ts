import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から mapID 表示用コードを生成
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    return "UNKNOWN";
  }

  /* ===============================
   * 日本 / 未来 / 宇宙（通常章）
   * 3000〜3008
   * =============================== */
  if (rawId >= 3000 && rawId <= 3008) {
    const base = rawId - 3000;
    const type = Math.floor(base / 3);
    const map = base % 3;
    return `${type}${map.toString().padStart(3, "0")}`;
  }

  /* ===============================
   * ゾンビ章
   * 20000〜22002
   * =============================== */
  if (rawId >= 20000 && rawId <= 22999) {
    const base = rawId - 20000;
    const type = Math.floor(base / 1000);
    const map = base % 1000;
    return `${type}Z${map.toString().padStart(3, "0")}`;
  }

  /* ===============================
   * フィリバスター
   * =============================== */
  if (rawId === 23000) {
    return "2_Inv000";
  }

  /* ===============================
   * 通常カテゴリ
   * =============================== */
  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];

  if (!category) {
    return `${upper}${index.toString().padStart(3, "0")}`;
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}
