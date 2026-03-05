import { createSearcher, BaseEntry } from "./searchBase.js";

export type MusicEntry = BaseEntry & {
  playlist: number[];
};

export const searchMusic = createSearcher<MusicEntry>("data/music.json");