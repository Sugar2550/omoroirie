export type StageIdResolved = {
  mapKey: string;
  mapIndex: number;
};

/* ============================
 * カテゴリ定義
 * ============================ */
type CategoryRule = {
  prefix?: string;          // 英字ID（A, NA など）
  mapKey: string;           // URL type
  baseIndex: number;        // mapIndex の基準
};

/**
 * 上位ID（千・万の位） → ルール
 */
const CATEGORY_RULES: Record<number, CategoryRule> = {
  0:  { prefix: "N",  mapKey: "N",  baseIndex: 0  },
  1:  { prefix: "S",  mapKey: "S",  baseIndex: 0  },
  2:  { prefix: "C",  mapKey: "C",  baseIndex: 0  },
  4:  { prefix: "E",  mapKey: "E",  baseIndex: 0  },
  6:  { prefix: "T",  mapKey: "T",  baseIndex: 0  },
  7:  { prefix: "V",  mapKey: "V",  baseIndex: 0  },
  11: { prefix: "R",  mapKey: "R",  baseIndex: 0  },
  12: { prefix: "M",  mapKey: "M",  baseIndex: 0  },
  13: { prefix: "NA", mapKey: "NA", baseIndex: 0  },
  14: { prefix: "B",  mapKey: "B",  baseIndex: 0  },
  16: { prefix: "D",  mapKey: "D",  baseIndex: 0  },
  24: { prefix: "A",  mapKey: "A",  baseIndex: 0  },
  25: { prefix: "H",  mapKey: "H",  baseIndex: 0  },
  27: { prefix: "CA", mapKey: "CA", baseIndex: 0  },
  30: { prefix: "DM", mapKey: "DM", baseIndex: 0  },
  31: { prefix: "Q",  mapKey: "Q",  baseIndex: 0  },
  33: { prefix: "L",  mapKey: "L",  baseIndex: 0  },
  34: { prefix: "ND", mapKey: "ND", baseIndex: 0  },
  36: { prefix: "SR", mapKey: "SR", baseIndex: 0  },
  37: { prefix: "G",  mapKey: "G",  baseIndex: 0  }
};

/* ============================
 * 特殊カテゴリ
 * ============================ */
function resolveSpecial(id: number): StageIdResolved | null {
  // 日本・未来・宇宙編
  if (id >= 3000 && id <= 3008) {
    const type = Math.floor((id - 3000) / 3);
    const map = (id - 3000) % 3;
    return { mapKey: String(type), mapIndex: map };
  }

  // ゾンビ
  if (id >= 20000 && id <= 22002) {
    const base = Math.floor((id - 20000) / 1000);
    const map = (id % 1000);
    return { mapKey: `${base}Z`, mapIndex: map };
  }

  // フィリバスター
  if (id === 23000) return { mapKey: "2_Inv", mapIndex: 0 };
  if (id === 38000) return { mapKey: "2Z_Inv", mapIndex: 0 };

  return null;
}

/* ============================
 * 公開API
 * ============================ */
export function resolveStageId(id: number): StageIdResolved | null {
  const special = resolveSpecial(id);
  if (special) return special;

  const upper = Math.floor(id / 1000);
  const rule = CATEGORY_RULES[upper];
  if (!rule) return null;

  return {
    mapKey: rule.mapKey,
    mapIndex: id % 1000
  };
}

