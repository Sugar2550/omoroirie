import * as SearchModule from "./searchBase.js";

export type MusicEntry = SearchModule.BaseEntry & {
  playlist: number[];
};

export const searchMusic = SearchModule.searchBase<MusicEntry>("data/music.json");