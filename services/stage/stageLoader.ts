import { indexStages } from "./stageSearch.js";
import { loadStageEntries } from "./stageDataLoader.js"; // CSV/JSON 読み込み用

let loaded = false;

export function initStageSearch() {
  if (loaded) return;

  const entries = loadStageEntries();
  indexStages(entries);

  loaded = true;
}
