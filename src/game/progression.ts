import type { GameState } from "./useGame";


export const DOWNTOWN_UNLOCK_GATE = {
  cash: 12000,
  reputation: 30,
  maxHeat: 60,
  requiresFirstHit: true,
} as const;

export interface DowntownUnlockDeltas {
  cash: number;
  reputation: number;
  heat: number;
  milestone: string[];
}

export function getDowntownUnlockDeltas(state: GameState): DowntownUnlockDeltas {
  const req = DOWNTOWN_UNLOCK_GATE;
  return {
    cash: Math.max(0, req.cash - state.cash),
    reputation: Math.max(0, req.reputation - state.reputation),
    heat: Math.max(0, state.heatLevel - req.maxHeat),
    milestone: req.requiresFirstHit && !state.milestones.firstHit ? ["First Hit"] : [],
  };
}

export function canUnlockDowntown(state: GameState): boolean {
  const d = getDowntownUnlockDeltas(state);
  return d.cash === 0 && d.reputation === 0 && d.heat === 0 && d.milestone.length === 0;
}

export function formatDowntownRemainingRequirements(state: GameState): string {
  const d = getDowntownUnlockDeltas(state);
  const needs: string[] = [];
  if (d.cash > 0) needs.push(`+$${d.cash.toLocaleString()} cash`);
  if (d.reputation > 0) needs.push(`+${d.reputation} rep`);
  if (d.heat > 0) needs.push(`${d.heat}% less heat`);
  if (d.milestone.length > 0) needs.push("First Hit milestone");
  if (!needs.length) return "Downtown unlock requirements met.";
  if (needs.length === 1) return `Need ${needs[0]}.`;
  if (needs.length === 2) return `Need ${needs[0]} and ${needs[1]}.`;
  return `Need ${needs.slice(0,-1).join(', ')}, and ${needs[needs.length-1]}.`;
}

export interface CompanyRankMeta {
  id: CompanyRankId;
  name: string;
  flavor: string;
  badgeLabel: string;
  color: string;
}

export type CompanyRankId = "hustler" | "operator" | "producer" | "studio" | "mogul" | "empire";

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
  {
    id: "hustler",
    name: "Backlot Hustler",
    flavor: "One trailer, big nerve.",
    badgeLabel: "HUSTLER",
    color: "zinc",
    minScore: 0,
  },
  {
    id: "operator",
    name: "Local Operator",
    flavor: "Bustville knows your name.",
    badgeLabel: "OPERATOR",
    color: "emerald",
    minScore: 130,
  },
  {
    id: "producer",
    name: "Regional Producer",
    flavor: "You ship titles, not promises.",
    badgeLabel: "PRODUCER",
    color: "sky",
    minScore: 280,
  },
  {
    id: "studio",
    name: "Studio Force",
    flavor: "Crews move when you call.",
    badgeLabel: "STUDIO",
    color: "violet",
    minScore: 470,
  },
  {
    id: "mogul",
    name: "Market Mogul",
    flavor: "Rivals price around your moves.",
    badgeLabel: "MOGUL",
    color: "amber",
    minScore: 690,
  },
  {
    id: "empire",
    name: "Bustville Empire",
    flavor: "You are the benchmark now.",
    badgeLabel: "EMPIRE",
    color: "rose",
    minScore: 950,
  },
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
    Math.max(0, input.locationLevel - 1) * 70 +
    Math.max(0, input.studioLevel - 1) * 55 +
    Math.max(0, input.distilleryLevel - 1) * 40 +
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
      : Math.max(
          0,
          Math.min(1, (score - currentDef.minScore) / (nextDef.minScore - currentDef.minScore)),
        );

  return {
    id: currentDef.id,
    index: idx,
    progress,
    current: rankMeta(currentDef),
    nextRank: nextDef ? rankMeta(nextDef) : null,
  };
}

interface ProgressRequirements {
  cash?: number;
  reputation?: number;
  heatMax?: number;
  firstHit?: boolean;
  locationLevel?: number;
  studioLevel?: number;
  trailerLevel?: number;
  webcamLevel?: number;
}

interface ProgressUnlockDef {
  id: string;
  label: string;
  requirements: ProgressRequirements;
  suggestion: string;
}

export interface ProgressBlockedReason {
  id: string;
  label: string;
  deltas: {
    cash: number;
    reputation: number;
    heat: number;
    milestone: string[];
  };
  requirementText: string[];
}

export interface ProgressionSnapshot {
  currentPhaseLabel: string;
  nextMajorUnlock: string;
  blockedReasons: ProgressBlockedReason[];
  suggestedActions: string[];
}

const MAJOR_UNLOCKS: ProgressUnlockDef[] = [
  {
    id: "downtown",
    label: "Downtown district",
    requirements: { cash: DOWNTOWN_UNLOCK_GATE.cash, reputation: DOWNTOWN_UNLOCK_GATE.reputation, heatMax: DOWNTOWN_UNLOCK_GATE.maxHeat, firstHit: DOWNTOWN_UNLOCK_GATE.requiresFirstHit },
    suggestion: "Push location upgrades in Park to unlock district travel.",
  },
  {
    id: "first-hit",
    label: "First Hit milestone",
    requirements: { cash: 15000, reputation: 20, heatMax: 65, firstHit: true },
    suggestion: "Release a stronger production while keeping heat under control.",
  },
  {
    id: "studio-lv2",
    label: "Studio Lv 2",
    requirements: { studioLevel: 2, cash: 4000 },
    suggestion: "Bank enough cash to upgrade studio throughput.",
  },
  {
    id: "webcam-lv2",
    label: "Webcam tier 2 shows",
    requirements: { webcamLevel: 2, cash: 900 },
    suggestion: "Upgrade webcam rig to unlock higher-paying show types.",
  },
  {
    id: "trailer-lv2",
    label: "Trailer visit tier 2",
    requirements: { trailerLevel: 2, cash: 1200 },
    suggestion: "Upgrade trailer offers for better visit payouts.",
  },
];

function formatReqText(req: ProgressRequirements): string[] {
  const lines: string[] = [];
  if (req.locationLevel !== undefined) lines.push(`Location Lv ${req.locationLevel}`);
  if (req.studioLevel !== undefined) lines.push(`Studio Lv ${req.studioLevel}`);
  if (req.webcamLevel !== undefined) lines.push(`Webcam Lv ${req.webcamLevel}`);
  if (req.trailerLevel !== undefined) lines.push(`Trailer Lv ${req.trailerLevel}`);
  if (req.cash !== undefined) lines.push(`Cash $${req.cash.toLocaleString()}`);
  if (req.reputation !== undefined) lines.push(`Rep ${req.reputation}`);
  if (req.heatMax !== undefined) lines.push(`Heat ≤ ${req.heatMax}%`);
  if (req.firstHit) lines.push("Milestone: First Hit");
  return lines;
}

function calcDeltas(state: GameState, req: ProgressRequirements) {
  return {
    cash: Math.max(0, (req.cash ?? 0) - state.cash),
    reputation: Math.max(0, (req.reputation ?? 0) - state.reputation),
    heat: req.heatMax === undefined ? 0 : Math.max(0, state.heatLevel - req.heatMax),
    milestone: req.firstHit && !state.milestones.firstHit ? ["First Hit"] : [],
    locationLevel: Math.max(0, (req.locationLevel ?? 0) - state.locationLevel),
    studioLevel: Math.max(0, (req.studioLevel ?? 0) - state.studioLevel),
    webcamLevel: Math.max(0, (req.webcamLevel ?? 0) - state.webcamLevel),
    trailerLevel: Math.max(0, (req.trailerLevel ?? 0) - state.trailerLevel),
  };
}

function isMet(state: GameState, req: ProgressRequirements) {
  const d = calcDeltas(state, req);
  return (
    d.cash === 0 &&
    d.reputation === 0 &&
    d.heat === 0 &&
    d.locationLevel === 0 &&
    d.studioLevel === 0 &&
    d.webcamLevel === 0 &&
    d.trailerLevel === 0 &&
    d.milestone.length === 0
  );
}

export function deriveProgressionSnapshot(state: GameState): ProgressionSnapshot {
  const phase = deriveCompanyRank({
    locationLevel: state.locationLevel,
    cash: state.cash,
    reputation: state.reputation,
    studioLevel: state.studioLevel,
    distilleryLevel: state.distilleryLevel,
    totalGirls: state.girls.length,
    releasedProductions: state.productions.filter((p) => p.stageIdx >= p.stages.length).length,
  });

  const blockedReasons: ProgressBlockedReason[] = [];
  const actionPool: string[] = [];

  for (const unlock of MAJOR_UNLOCKS) {
    const deltas = calcDeltas(state, unlock.requirements);
    if (!isMet(state, unlock.requirements)) {
      blockedReasons.push({
        id: unlock.id,
        label: unlock.label,
        deltas: {
          cash: deltas.cash,
          reputation: deltas.reputation,
          heat: deltas.heat,
          milestone: deltas.milestone,
        },
        requirementText: formatReqText(unlock.requirements),
      });
      actionPool.push(unlock.suggestion);
    }
  }

  const nextMajor = blockedReasons[0]?.label ?? "All core systems unlocked";
  const suggestions = Array.from(new Set(actionPool)).slice(0, 3);

  if (state.cash < 1000) suggestions.push("Run quick cash actions and avoid long idle time.");
  if (state.heatLevel > 65)
    suggestions.push("Use low-heat actions or rest to stabilize heat before risky jobs.");

  return {
    currentPhaseLabel: phase.current.name,
    nextMajorUnlock: nextMajor,
    blockedReasons,
    suggestedActions: suggestions.slice(0, 4),
  };
}
