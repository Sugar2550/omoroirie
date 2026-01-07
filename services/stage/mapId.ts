import { CATEGORY_TABLE } from "./categoryTable.js";

/**
 * rawId から URL 用 mapId 文字列を生成
 *
 * 返却形式:
 *   `${type}${map.toString().padStart(3, "0")}`
 *
 * mapUrl 側で
 *   type = 先頭側
 *   map  = 数値として解釈
 * される前提
 */
export function encodeMapId(rawId: number): string {
  if (!Number.isFinite(rawId)) {
    return "UNKNOWN";
  }

  /* ===============================
   * 日本 / 未来 / 宇宙（通常章）
   * rawId: 3000–3008
   *
   * type = 編番号
   * map  = 章番号 - 1
   * =============================== */
  if (rawId >= 3000 && rawId <= 3008) {
    const base = rawId - 3000;
    const type = Math.floor(base / 3);
    const map = base % 3;
    return `${type}${map.toString().padStart(3, "0")}`;
  }

  /* ===============================
   * ゾンビ章
   * rawId: 20000–22002
   *
   * type = "<編番号>Z"
   * map  = 章番号 - 1
   * =============================== */
  if (rawId >= 20000 && rawId <= 22002) {
    const type = `${Math.floor((rawId - 20000) / 1000)}Z`;
    const map = rawId % 1000;
    return `${type}${map.toString().padStart(3, "0")}`;
  }

  /* ===============================
   * フィリバスター
   * =============================== */
  if (rawId === 23000) {
    return "2_Inv000";
  }

  /* ===============================
   * フィリバスター（ゾンビ）
   * =============================== */
  if (rawId === 38000) {
    return "2Z_Inv000";
  }

  /* ===============================
   * その他通常カテゴリ（CATEGORY_TABLE）
   * =============================== */
  const upper = Math.floor(rawId / 1000);
  const index = rawId % 1000;

  const category = CATEGORY_TABLE[upper];
  if (!category) {
    return `${upper}${index.toString().padStart(3, "0")}`;
  }

  return `${category}${index.toString().padStart(3, "0")}`;
}
