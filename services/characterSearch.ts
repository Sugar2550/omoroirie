import { buildSearch, BaseEntry } from "./searchBase.js";

export type CharacterEntry = BaseEntry;

export const searchCharacter = buildSearch<CharacterEntry>(
  "data/charaname.json"
);

