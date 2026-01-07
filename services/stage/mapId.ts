import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から URL 用 mapId を生成
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    return "UNKNOWN";
  }

  /* ===============================
   * 日本 / 未来 / 宇宙（通常章）
   * 3000〜
   * 3章ごとに type が切り替わる
   * =============================== */
  if (rawId >= 3000 && rawId < 20000) {
    const base = rawId - 3000;
    const type = Math.floor(base / 3);
    const map = base % 3;
    return `${type}${map.toString().padStart(3, "0")}`;
  }

  /* ===============================
   * ゾンビ章
   * 20000 / 21000 / 22000
   * map は常に 0
   * =============================== */
  if (rawId >= 20000 && rawId < 23000) {
    const type = Math.floor((rawId - 20000) / 1000);
    return `${type}Z000`;
  }

  /* ===============================
   * フィリバスター
   * =============================== */
  if (rawId === 23000) {
    return "2_Inv000";
  }

  /* ===============================
   * その他カテゴリ（保険）
   * =============================== */
  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];
  if (!category) {
    return `${upper}${index.toString().padStart(3, "0")}`;
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}
