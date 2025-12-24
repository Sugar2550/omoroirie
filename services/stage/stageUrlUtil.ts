import { resolveStageId } from "./stageIdUtil.js";

export function buildStageUrl(id: number): string | null {
  const resolved = resolveStageId(id);
  if (!resolved) return null;

  const { mapKey, mapIndex } = resolved;

  return `https://jarjarblink.github.io/JDB/map.html?cc=ja&type=${mapKey}&map=${mapIndex}`;
}
