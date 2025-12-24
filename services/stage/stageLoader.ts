import { indexStages } from "./stageSearch.js";
import { loadAllStages } from "./stageRepository.js";

let initialized = false;

export function initStageSearch() {
  if (initialized) return;
  initialized = true;

  const entries = loadAllStages();
  console.log(`[stage] loaded ${entries.length} entries`);

  indexStages(entries);
}
