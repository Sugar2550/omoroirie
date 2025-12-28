export function encodeMapId(mapIdRaw: number): string {
  // ==========================================
  // 日本・未来・宇宙（通常章）
  // 3000〜3008
  // ==========================================
  if (mapIdRaw >= 3000 && mapIdRaw <= 3008) {
    const type = Math.floor((mapIdRaw - 3000) / 3); // 0,1,2
    const map = (mapIdRaw - 3000) % 3;
    return `${type}${map}`;
  }

  // ==========================================
  // ゾンビ章
  // 日本:20000〜20002 / 未来:21000〜21002 / 宇宙:22000〜22002
  // ==========================================
  if (mapIdRaw >= 20000 && mapIdRaw <= 22002) {
    const base = Math.floor((mapIdRaw - 20000) / 1000); // 0,1,2
    const map = mapIdRaw % 1000;
    return `${base}Z${map}`;
  }

  // ==========================================
  // フィリバスター
  // ==========================================
  if (mapIdRaw === 23000) {
    return `2_Inv0`;
  }

  // ==========================================
  // フィリバスターゾンビ
  // ==========================================
  if (mapIdRaw === 38000) {
    return `2Z_Inv0`;
  }

  // ==========================================
  // 通常マップ（G011 / S061 など）
  // ==========================================
  const type = String.fromCharCode(Math.floor(mapIdRaw / 1000) + 64);
  const map = mapIdRaw % 1000;
  return `${type}${map.toString().padStart(3, "0")}`;
}

/**
 * JDB 用 URL を生成
 */
export function mapUrl(mapIdRaw: number): string {
  // 通常章
  if (mapIdRaw >= 3000 && mapIdRaw <= 3008) {
    const type = Math.floor((mapIdRaw - 3000) / 3);
    const map = (mapIdRaw - 3000) % 3;
    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
  }

  // ゾンビ章
  if (mapIdRaw >= 20000 && mapIdRaw <= 22002) {
    const base = Math.floor((mapIdRaw - 20000) / 1000);
    const map = mapIdRaw % 1000;
    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${base}Z&map=${map}`;
  }

  // フィリバスター
  if (mapIdRaw === 23000) {
    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=2_Inv&map=0`;
  }

  // フィリバスターゾンビ
  if (mapIdRaw === 38000) {
    return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=2Z_Inv&map=0`;
  }

  // 通常
  const type = String.fromCharCode(Math.floor(mapIdRaw / 1000) + 64);
  const map = mapIdRaw % 1000;
  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${type}&map=${map}`;
}
