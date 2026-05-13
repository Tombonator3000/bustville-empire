export interface CompanyRankMeta {
  id: CompanyRankId;
  name: string;
  flavor: string;
  badgeLabel: string;
  color: string;
}

export type CompanyRankId =
  | "hustler"
  | "operator"
  | "producer"
  | "studio"
  | "mogul"
  | "empire";

export interface CompanyRankInput {
  locationLevel: number;
  cash: number;
  reputation: number;
  studioLevel: number;
  distilleryLevel: number;
  totalGirls: number;
  releasedProductions: number;
}

export interface CompanyRankResult {
  id: CompanyRankId;
  index: number;
  progress: number;
  nextRank: CompanyRankMeta | null;
  current: CompanyRankMeta;
}

interface RankDef {
  id: CompanyRankId;
  name: string;
  flavor: string;
  badgeLabel: string;
  color: string;
  minScore: number;
}

const COMPANY_RANKS: RankDef[] = [
  { id: "hustler", name: "Backlot Hustler", flavor: "One trailer, big nerve.", badgeLabel: "HUSTLER", color: "zinc", minScore: 0 },
  { id: "operator", name: "Local Operator", flavor: "Bustville knows your name.", badgeLabel: "OPERATOR", color: "emerald", minScore: 130 },
  { id: "producer", name: "Regional Producer", flavor: "You ship titles, not promises.", badgeLabel: "PRODUCER", color: "sky", minScore: 280 },
  { id: "studio", name: "Studio Force", flavor: "Crews move when you call.", badgeLabel: "STUDIO", color: "violet", minScore: 470 },
  { id: "mogul", name: "Market Mogul", flavor: "Rivals price around your moves.", badgeLabel: "MOGUL", color: "amber", minScore: 690 },
  { id: "empire", name: "Bustville Empire", flavor: "You are the benchmark now.", badgeLabel: "EMPIRE", color: "rose", minScore: 950 },
];

function rankMeta(def: RankDef): CompanyRankMeta {
  return {
    id: def.id,
    name: def.name,
    flavor: def.flavor,
    badgeLabel: def.badgeLabel,
    color: def.color,
  };
}

export function deriveCompanyRank(input: CompanyRankInput): CompanyRankResult {
  const milestoneScore =
    (Math.max(0, input.locationLevel - 1) * 70) +
    (Math.max(0, input.studioLevel - 1) * 55) +
    (Math.max(0, input.distilleryLevel - 1) * 40) +
    Math.min(180, input.releasedProductions * 15) +
    Math.min(90, input.totalGirls * 10);

  const economyScore = Math.min(300, Math.floor(Math.max(0, input.cash) / 1800) * 10);
  const reputationScore = Math.min(320, Math.max(0, input.reputation) * 2);
  const score = milestoneScore + economyScore + reputationScore;

  const idx = COMPANY_RANKS.reduce((best, r, i) => (score >= r.minScore ? i : best), 0);
  const currentDef = COMPANY_RANKS[idx];
  const nextDef = COMPANY_RANKS[idx + 1] ?? null;
  const progress =
    nextDef === null
      ? 1
      : Math.max(0, Math.min(1, (score - currentDef.minScore) / (nextDef.minScore - currentDef.minScore)));

  return {
    id: currentDef.id,
    index: idx,
    progress,
    current: rankMeta(currentDef),
    nextRank: nextDef ? rankMeta(nextDef) : null,
  };
}
