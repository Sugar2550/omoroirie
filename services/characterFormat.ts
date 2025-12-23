import { CharacterEntry } from "./characterSearch.js";

export function formatSingle(c: CharacterEntry): string {
  return `${c.id} ${c.names[0]}\n${c.url}`;
}

export function formatMultiple(list: CharacterEntry[]): string {
  return list
    .map(c => `${c.id} ${c.names[0]}`)
    .join(", ");
}

export function formatWithLimit(list: CharacterEntry[], limit = 10): string {
  const shown = list.slice(0, limit);
  const base = shown
    .map(c => `${c.id} ${c.names[0]}`)
    .join(", ");

  return list.length > limit ? `${base}, etc…` : base;
}
