import { searchBase, BaseEntry } from "./searchBase.js";

export type MusicEntry = BaseEntry & {
  playlist: number[];
};

export const searchMusic = searchBase<MusicEntry>("data/music.json");