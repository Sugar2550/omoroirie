import { EnemyEntry } from "./enemySearch.js";

export function formatEnemySingle(e: EnemyEntry): string {
  return `${e.id} ${e.names[0]}\n${e.url}`;
}

export function formatEnemyMultiple(list: EnemyEntry[]): string {
  return (
    "```" +
    list.map(e => `${e.id} ${e.names[0]}`).join("\n") +
    "```"
  );
}

export function formatEnemyWithLimit(
  list: EnemyEntry[],
  limit: number
): string {
  return (
    "```" +
    list
      .slice(0, limit)
      .map(e => `${e.id} ${e.names[0]}`)
      .join("\n") +
    "\n...more" +
    "```"
  );
}
