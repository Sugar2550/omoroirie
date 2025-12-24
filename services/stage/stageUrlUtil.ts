import { StageCategory } from "./stageIdUtil.js";

export function buildStageUrl(
  category: StageCategory,
  mapIndex: number
): string {
  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${category.key}&map=${mapIndex}`;
}
