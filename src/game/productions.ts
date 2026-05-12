export type StageId = "briefing" | "casting" | "shooting" | "editing" | "release";

export interface StageDef {
  id: StageId;
  label: string;
  emoji: string;
  cost: number;        // paid when entering the stage
  hours: number;       // wait time inside the stage
  staminaCost: number; // drained on entry
  flavor: string;
}

export interface TierDef {
  id: string;
  name: string;
  minLevel: number;       // location level required
  basePayout: number;     // average gross at release
  baseRep: number;
  stages: StageDef[];
  flavorTitles: string[]; // random working title pool
  description: string;
}

const stages = (
  c: [number, number, number, number, number],
  h: [number, number, number, number, number],
  s: [number, number, number, number, number],
): StageDef[] => [
  { id: "briefing", label: "Briefing",   emoji: "📝", cost: c[0], hours: h[0], staminaCost: s[0],
    flavor: "Du tegner storyboard på en serviette." },
  { id: "casting",  label: "Casting",    emoji: "💋", cost: c[1], hours: h[1], staminaCost: s[1],
    flavor: "Auditions, kontrakter, NDAer kruset på pizzakartong." },
  { id: "shooting", label: "Innspilling",emoji: "🎬", cost: c[2], hours: h[2], staminaCost: s[2],
    flavor: "Lys. Kamera. Snubl-i-kabler. Action." },
  { id: "editing",  label: "Redigering", emoji: "🎞️", cost: c[3], hours: h[3], staminaCost: s[3],
    flavor: "Du sitter foran datamaskinen i 14 timer på rad." },
  { id: "release",  label: "Utgivelse",  emoji: "🚀", cost: c[4], hours: h[4], staminaCost: s[4],
    flavor: "Premiere. Bobler. Bobler-vann om budsjettet er stramt." },
];

export const TIERS: TierDef[] = [
  {
    id: "quickie", name: "Quickie", minLevel: 1, basePayout: 800, baseRep: 3,
    stages: stages([20, 50, 120, 40, 30], [2, 3, 4, 3, 2], [2, 4, 14, 6, 2]),
    flavorTitles: ["Trailer Trash Tuesdays", "Moonshine Mama", "Backseat Buick", "Sheriff's Day Off"],
    description: "Lav-budsjett kortfilm. Rask runde fra brief til release.",
  },
  {
    id: "glamour", name: "Glamour Feature", minLevel: 3, basePayout: 3200, baseRep: 7,
    stages: stages([80, 200, 500, 180, 120], [4, 6, 10, 8, 4], [3, 6, 20, 10, 3]),
    flavorTitles: ["Silk & Sin", "Midnight Boulevard", "Velvet Hours", "Champagne Dreams"],
    description: "Glossy produksjon med fancy belysning.",
  },
  {
    id: "feature", name: "Feature Film", minLevel: 4, basePayout: 9500, baseRep: 14,
    stages: stages([200, 600, 1600, 500, 400], [6, 10, 18, 14, 6], [4, 8, 28, 12, 4]),
    flavorTitles: ["Empire of the Heart", "Bustville Confidential", "Red Curtain Saga", "The Producer"],
    description: "Skikkelig manus, faktiske skuespillere, faktisk premiere.",
  },
  {
    id: "blockbuster", name: "Blockbuster", minLevel: 5, basePayout: 32000, baseRep: 28,
    stages: stages([800, 2000, 6500, 2200, 1500], [10, 16, 28, 22, 10], [5, 10, 36, 16, 6]),
    flavorTitles: ["Vixens of Vegas", "International Affair", "The Bustville Job", "Pink Diamond"],
    description: "Multi-stjerne, multinasjonal, multi-millioner.",
  },
];

// Role a cast member fills on a production. Determines which stage they buff.
export type CastRole = "casting" | "shooting" | "editing" | "release";

export const CAST_ROLES: { id: CastRole; label: string; emoji: string; hint: string }[] = [
  { id: "casting",  label: "Audition lead", emoji: "💋", hint: "Charmer auditions — bedre casting-rull." },
  { id: "shooting", label: "Performer",     emoji: "🎬", hint: "På sett under innspilling — kvalitet + suksess." },
  { id: "editing",  label: "Crew/Continuity", emoji: "🎞️", hint: "Hjelper i redigering — færre rework." },
  { id: "release",  label: "PR & Promo",    emoji: "📣", hint: "Pusher kampanjen ved utgivelse — mindre flopp-risiko." },
];

export const ROLE_LABEL: Record<CastRole, string> =
  Object.fromEntries(CAST_ROLES.map((r) => [r.id, r.label])) as Record<CastRole, string>;

export interface Production {
  id: string;
  tierId: string;
  title: string;
  stageIdx: number;
  hoursLeft: number;
  girlIds: string[];
  roles?: Record<string, CastRole>; // girlId → role (default "shooting")
  quality: number;
  startedDay: number;
  reworks: number;
  flopped?: boolean;
  releasedGross?: number;
  genreId?: string;     // valgt genre (romance/wild/glamour/fetish)
  campaign?: 0 | 1 | 2 | 3; // marketing-kampanje-nivå
}

export const STAGE_ORDER: StageId[] = ["briefing", "casting", "shooting", "editing", "release"];

export function getTier(id: string): TierDef | undefined {
  return TIERS.find((t) => t.id === id);

}
