import { search, BaseEntry } from "./searchBase.js";

export type MusicEntry = BaseEntry & {
  playlist: number[];
};

export const searchMusic = search<MusicEntry>("data/music.json");