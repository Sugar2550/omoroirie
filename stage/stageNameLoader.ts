import fs from "fs";
import path from "path";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .trim();
}

export function loadStageNames(
  file: string,
  prefix?: string
): string[][] {
  const raw = fs.readFileSync(file, "utf-8");
  const lines = raw.split("\n");

  const result: string[][] = [];

  for (const line of lines) {
    const cols = line.split(",").map(c => c.trim());
    if (cols.includes("@")) break;

    const names = cols
      .filter(Boolean)
      .map(n => prefix ? `${prefix} ${n}` : n)
      .map(normalize);

    if (names.length > 0) {
      result.push(names);
    }
  }

  return result;
}
