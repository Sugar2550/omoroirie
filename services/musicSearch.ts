import { buildSearch, BaseEntry } from "./searchBase.js";

export type MusicEntry = BaseEntry & {
  playlist: number[];
};

export const searchMusic = buildSearch<MusicEntry>("data/music.json");