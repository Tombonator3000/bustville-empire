import type { Girl } from "./data";

const PROFESSIONS = [
  "Webcam Teaser",
  "Club Dancer",
  "Glamour Model",
  "Trailer Park Flirt",
  "Late-Night Host",
  "Amateur Starlet",
  "Studio Newcomer",
  "Fetish Model",
  "Party Hostess",
  "Boutique Performer",
  "VHS Cover Model",
  "Neon Lounge Dancer",
  "Indie Performer",
  "Camroom Regular",
  "Promotional Model",
] as const;

const TAGS = ["Solo","Anal","Fetish","F/F","M/F","Group","Hardcore","Softcore","Glamour","Kink","Premium","Boudoir","Couples","Webcam","Roleplay","Studio Feature"] as const;
const PREMIUM_TAGS = ["Premium", "Studio Feature", "Roleplay", "Boudoir", "Couples"] as const;

const TAGLINES = [
  "Small-town trouble with camera-ready confidence.",
  "A neon sweetheart with dangerous ambition.",
  "Cheap lights, big hustle, zero shame.",
  "She knows exactly how to sell the fantasy.",
  "A local favorite looking for a bigger stage.",
  "Trailer park chaos with studio potential.",
  "Built for late-night clicks and bad decisions.",
  "One good contract away from becoming a star.",
  "She walked in like she already owned the place.",
  "A risky hire, but the numbers look good.",
] as const;

const rand = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const ri = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export function getRecruitStars(girl: Pick<Girl, "beauty" | "performance" | "popularity">): 1 | 2 | 3 | 4 | 5 {
  const avg = (girl.beauty + girl.performance + girl.popularity) / 3;
  if (avg < 40) return 1;
  if (avg < 55) return 2;
  if (avg < 70) return 3;
  if (avg < 85) return 4;
  return 5;
}

export function getRecruitRarityLabel(starRating: 1 | 2 | 3 | 4 | 5): string {
  return ["Rough Start", "Local Talent", "Rising Star", "Premium Recruit", "Bustville Bombshell"][starRating - 1];
}

export function getRecruitPreferences(locLevel: number): string[] {
  const count = ri(2, locLevel >= 4 ? 4 : 3);
  const pool = [...TAGS];
  if (locLevel >= 3 && Math.random() < 0.65) {
    const p = rand(PREMIUM_TAGS);
    pool.unshift(p);
  }
  const picked = new Set<string>();
  while (picked.size < count) picked.add(rand(pool));
  return [...picked];
}

export function generateRecruitPresentation(girl: Girl, locLevel: number, playerCharisma: number) {
  const starRating = getRecruitStars(girl);
  const age = ri(21, 39);
  const proIndex = Math.min(PROFESSIONS.length - 1, Math.max(0, Math.floor((locLevel + playerCharisma) / 2) + ri(-2, 2)));
  return {
    age,
    profession: PROFESSIONS[proIndex],
    preferences: getRecruitPreferences(locLevel),
    starRating,
    tagline: rand(TAGLINES),
    recruitRarityLabel: getRecruitRarityLabel(starRating),
  };
}
