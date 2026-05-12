import type { Archetype } from "./data";

export type GenreId = "romance" | "wild" | "glamour" | "fetish";

export interface GenreDef {
  id: GenreId;
  name: string;
  emoji: string;
  blurb: string;
  matches: Archetype[]; // arketyper som passer denne genren
}

export const GENRES: GenreDef[] = [
  {
    id: "romance", name: "Romance", emoji: "💕",
    blurb: "Søte, varme, langsomme. Stort publikum, lavt sjokk.",
    matches: ["Amateur Sweetheart", "Girl Next Door"],
  },
  {
    id: "wild", name: "Wild Party", emoji: "🎉",
    blurb: "Hardcore, kaotisk, energisk. Yngre marked, høy heat.",
    matches: ["Wild Party Girl", "MILF Next Door"],
  },
  {
    id: "glamour", name: "Glamour", emoji: "💎",
    blurb: "Stilig, kunstnerisk, kostbart. Premium-kjøpere.",
    matches: ["Ice Queen Pornstar", "Exotic Import"],
  },
  {
    id: "fetish", name: "Fetish", emoji: "⛓️",
    blurb: "Nisje, lojale fans. Ekstra premium på riktig cast.",
    matches: ["Wild Party Girl", "Ice Queen Pornstar"],
  },
];

export const GENRE_IDS: GenreId[] = ["romance", "wild", "glamour", "fetish"];

export const emptyFans = (): Record<GenreId, number> => ({
  romance: 0, wild: 0, glamour: 0, fetish: 0,
});

/** Fans → payout-multiplier. 0 fans = 1.0×, 600 fans = 2.0× (cap). */
export function fanMultiplier(fans: number): number {
  return 1 + Math.min(1, Math.max(0, fans) / 600);
}

export function getGenre(id?: string): GenreDef | undefined {
  return GENRES.find((g) => g.id === id);
}

/**
 * Returnerer multiplier basert på hvor godt casten matcher genren.
 * Full match (alle stjerner matcher) → 1.25. Ingen match → 0.85. Mix interpolerer.
 */
export function genreMatchMult(genreId: string | undefined, archetypes: Archetype[]): number {
  if (!genreId || archetypes.length === 0) return 1;
  const def = getGenre(genreId);
  if (!def) return 1;
  const matchCount = archetypes.filter((a) => def.matches.includes(a)).length;
  const ratio = matchCount / archetypes.length;
  return 0.85 + ratio * 0.4; // 0.85 .. 1.25
}
