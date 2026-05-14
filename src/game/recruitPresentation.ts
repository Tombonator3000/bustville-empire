import type { Archetype, Girl } from "./data";

const TAGS = [
  "Solo",
  "Anal",
  "Fetish",
  "F/F",
  "M/F",
  "Group",
  "Hardcore",
  "Softcore",
  "Glamour",
  "Kink",
  "Premium",
  "Boudoir",
  "Couples",
  "Webcam",
  "Roleplay",
  "Studio Feature",
  "XXX Feature",
  "Amateur",
] as const;

type Phase = "trailer" | "downtown" | "empire";
const ri = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
const rand = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

const PHASE_ARCHETYPES: Record<Phase, Archetype[]> = {
  trailer: [
    "Trailer Park Veteran",
    "Local Webcam Hopeful",
    "Bar Stage Regular",
    "Garage Glamour Girl",
    "Small-Town Flirt",
    "VHS Amateur",
    "Divorced Bombshell",
    "Rough-Cut Performer",
    "Backyard Pin-Up",
    "Late-Night Caller",
    "Amateur Sweetheart",
    "Girl Next Door",
    "MILF Next Door",
  ],
  downtown: [
    "Wild Party Girl",
    "Glamour Model",
    "Studio Starlet",
    "Fetish Specialist",
    "Club Velvet Headliner",
    "Local Webcam Hopeful",
    "Garage Glamour Girl",
  ],
  empire: [
    "Premium Performer",
    "International Import",
    "Influencer Bombshell",
    "Award-Night Diva",
    "Studio Starlet",
    "Fetish Specialist",
    "Exotic Import",
    "Ice Queen Pornstar",
  ],
};

const PROFESSIONS: Record<Phase, string[]> = {
  trailer: [
    "Local VHS Regular",
    "Webcam Hopeful",
    "Bar Stage Regular",
    "Trailer Park Flirt",
    "Amateur Starlet",
    "Gas Station Pin-Up",
    "Late-Night Caller",
    "Backyard Model",
    "Local Party Hostess",
    "Garage Glamour Girl",
  ],
  downtown: [
    "Club Dancer",
    "Glamour Model",
    "Boutique Performer",
    "Indie Performer",
    "Camroom Regular",
    "Studio Newcomer",
    "Promotional Model",
    "Velvet Lounge Regular",
    "Fetish Model",
    "VHS Cover Model",
  ],
  empire: [
    "Premium Performer",
    "Studio Headliner",
    "International Starlet",
    "Influencer Bombshell",
    "Award-Night Diva",
    "Fetish Specialist",
    "National Feature Star",
    "Contract Performer",
    "Brand Ambassador",
    "Empire Exclusive",
  ],
};

export function getPhaseByLocationLevel(locLevel: number): Phase {
  return locLevel <= 2 ? "trailer" : locLevel === 3 ? "downtown" : "empire";
}
export function pickArchetypeForPhase(locLevel: number): Archetype {
  return rand(PHASE_ARCHETYPES[getPhaseByLocationLevel(locLevel)]);
}

export function getRecruitStars(
  girl: Pick<Girl, "beauty" | "performance" | "popularity">,
): 1 | 2 | 3 | 4 | 5 {
  const avg = (girl.beauty + girl.performance + girl.popularity) / 3;
  return avg < 40 ? 1 : avg < 55 ? 2 : avg < 70 ? 3 : avg < 85 ? 4 : 5;
}
export const getRecruitRarityLabel = (s: 1 | 2 | 3 | 4 | 5) =>
  ["Rough Start", "Local Talent", "Rising Star", "Premium Recruit", "Bustville Bombshell"][s - 1];

export function getRecruitPreferences(locLevel: number): string[] {
  const phase = getPhaseByLocationLevel(locLevel);
  const count = ri(2, 4);
  const pool = [...TAGS];
  const weighted =
    phase === "trailer"
      ? ["Amateur", "Solo", "Webcam", "Softcore", "Couples", "Fetish", "Roleplay"]
      : phase === "downtown"
        ? ["Glamour", "Anal", "F/F", "M/F", "Fetish", "Group", "Boudoir"]
        : ["Premium", "Studio Feature", "XXX Feature", "Hardcore", "Fetish", "Glamour", "Group"];
  weighted.forEach((t) => pool.unshift(t as (typeof TAGS)[number]));
  const picked = new Set<string>();
  while (picked.size < count) picked.add(rand(pool));
  return [...picked];
}

export function maybeHiddenPotential(
  stars: 1 | 2 | 3 | 4 | 5,
  locLevel: number,
): Girl["hiddenPotential"] {
  const phase = getPhaseByLocationLevel(locLevel);
  const chance =
    phase === "trailer"
      ? stars === 1
        ? 0.35
        : stars === 2
          ? 0.25
          : stars === 3
            ? 0.15
            : 0.05
      : phase === "downtown"
        ? stars === 2
          ? 0.2
          : stars === 3
            ? 0.15
            : stars === 4
              ? 0.1
              : 0.04
        : stars === 3
          ? 0.1
          : stars === 4
            ? 0.07
            : stars === 5
              ? 0.05
              : 0.03;
  if (Math.random() > chance) return undefined;
  return rand([
    "late_bloomer",
    "camera_loves_her",
    "loyal_workhorse",
    "niche_magnet",
    "cheap_star",
  ] as const);
}

export function generateRecruitPresentation(girl: Girl, locLevel: number) {
  const phase = getPhaseByLocationLevel(locLevel);
  const starRating = getRecruitStars(girl);
  return {
    age: phase === "trailer" ? ri(21, 55) : phase === "downtown" ? ri(21, 45) : ri(21, 42),
    profession: rand(PROFESSIONS[phase]),
    preferences: getRecruitPreferences(locLevel),
    starRating,
    hiddenPotential: maybeHiddenPotential(starRating, locLevel),
    tagline:
      phase === "trailer"
        ? "Not glamorous, but reliable and hungry for better gear."
        : phase === "downtown"
          ? "Polished enough for city work and aiming higher."
          : "Top-tier talent with expensive expectations.",
    recruitRarityLabel: getRecruitRarityLabel(starRating),
  };
}
