import { buildSearch, BaseEntry } from "./searchBase.js";

export type EnemyEntry = BaseEntry;

export const searchEnemy = buildSearch<EnemyEntry>(
  "data/enemyname.json"
);


