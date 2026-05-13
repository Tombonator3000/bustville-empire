import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  LOCATIONS,
  ARCHETYPES,
  FIRST_NAMES,
  LAST_NAMES,
  RANDOM_EVENTS,
  GIRL_MISSIONS,
  WEBCAM_SHOWS,
  WEBCAM_UPGRADE_COST,
  VISIT_TYPES,
  VISIT_UPGRADE_COST,
  type Archetype,
  type Girl,
  type MissionDef,
  type GalleryScene,
} from "./data";
import { LOCATION_DEFS, LOCATION_ACTIONS, type LocationId, type DistrictId } from "./locations";
import { TIERS, getTier, STAGE_ORDER, type Production } from "./productions";
import { getGenre, emptyFans, GENRE_IDS, type GenreId } from "./genres";
import { INITIAL_RIVALS, tickRivals, dailyHeadline, type Rival } from "./rivals";
import { BODY_PROCEDURES } from "./clinic";
import { rollDrama } from "./drama";
import { rollSTD, STDS, activeSTD, isBlockedByStd, payoutMult, type STDState } from "./health";
import { deriveProductionReleaseForecast, roleScoreForProduction } from "./productionForecast";
import { deriveCompanyRank } from "./progression";
import { EQUIPMENT_LEVEL_ZERO_FLAVOR, getLowEquipmentPenalties } from "./balanceConstants";

// Toast queue — populated inside setState updaters, flushed via effect to avoid
// double-firing under React StrictMode.
type ToastItem = { kind: "success" | "info" | "error"; title: string; description?: string };
const _toastQueue: ToastItem[] = [];
const _seenToastIds = new Set<string>();
function enqueueToast(id: string, item: ToastItem) {
  if (_seenToastIds.has(id)) return;
  _seenToastIds.add(id);
  _toastQueue.push(item);
}

export const absHour = (s: { day: number; hour: number }) => s.day * 24 + s.hour;

// Eksempel (targetHour=7): absNow=3 -> +4t (07:00 samme dag), absNow=7 -> +24t (07:00 neste dag), absNow=20 -> +11t (07:00 neste dag).
export function hoursUntilNextClockTime(absNow: number, targetHour: number): number {
  const dayStart = Math.floor(absNow / 24) * 24;
  const todayTarget = dayStart + targetHour;
  const nextTarget = absNow < todayTarget ? todayTarget : todayTarget + 24;
  return nextTarget - absNow;
}

export type Intensity = "chill" | "standard" | "intense";

function busyHoursLeft(g: Girl, s: { day: number; hour: number }): number {
  const until = g.busyUntil ?? 0;
  return Math.max(0, until - absHour(s));
}

function busyLog(g: Girl, s: { day: number; hour: number }, context = "denne handlingen"): string {
  const hoursLeft = busyHoursLeft(g, s);
  return `💤 ${g.name} er i cooldown (${hoursLeft}t igjen) og kan ikke tildeles til ${context}.`;
}

export const INTENSITIES: { id: Intensity; label: string; emoji: string; hint: string }[] = [
  {
    id: "chill",
    label: "Avslappet",
    emoji: "🌙",
    hint: "0.7× lønn, mindre heat. For trøtte stjerner.",
  },
  { id: "standard", label: "Standard", emoji: "⚖️", hint: "Vanlig økt — balansert risiko." },
  { id: "intense", label: "Hardcore", emoji: "🔥", hint: "1.45× lønn, +heat. Skru opp innsatsen." },
];

type HeatContext = "perform" | "webcam" | "visit";
type HeatBreakdown = { total: number; baseApplied: number; intensityBonus: number };

function applyIntensityHeat(
  baseHeat: number,
  intensity: Intensity,
  _context: HeatContext,
): HeatBreakdown {
  const safeBase = Math.max(0, Math.floor(baseHeat));
  if (intensity === "chill") {
    const loweredBase = safeBase > 0 ? Math.max(0, safeBase - 1) : 0;
    return { total: loweredBase, baseApplied: loweredBase, intensityBonus: 0 };
  }
  if (intensity === "intense") {
    const intensityBonus = safeBase > 0 ? Math.max(1, Math.ceil(safeBase * 0.5)) : 2;
    return { total: safeBase + intensityBonus, baseApplied: safeBase, intensityBonus };
  }
  return { total: safeBase, baseApplied: safeBase, intensityBonus: 0 };
}
function mitigatedHeatGain(s: GameState, amount: number) {
  return Math.max(0, amount - staffMods(s).heatMitigation);
}

export function previewHeat(baseHeat: number, intensity: Intensity): HeatBreakdown {
  return applyIntensityHeat(baseHeat, intensity, "perform");
}

export function intensityCooldownHours(baseHours: number, intensity: Intensity): number {
  const cdBase = Math.max(2, baseHours);
  if (intensity === "intense") return Math.ceil(cdBase * 1.5);
  if (intensity === "chill") return Math.max(1, Math.floor(cdBase * 0.7));
  return cdBase;
}

export interface PlayerStats {
  charisma: number;
  hustle: number;
  business: number;
  lust: number;
}

export interface MilestoneEventPayload {
  id: "firstHit";
  title: string;
  body: string;
  rewards: string[];
}

export interface GameMilestones {
  firstHit: boolean;
}
export type StaffRole = "editor" | "scout" | "marketer" | "fixer";
export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  level: number;
  bonus: number;
  salary: number;
  trait: string;
}

export interface GameState {
  cash: number;
  reputation: number;
  stamina: number;
  maxStamina: number;
  day: number; // 1+
  hour: number; // 0-23
  locationLevel: number;
  moonshine: number;
  backlog: number;
  player: PlayerStats;
  girls: Girl[];
  staff: StaffMember[];
  log: string[];
  won: boolean;
  district: DistrictId;
  activeLocation: LocationId | null;
  // economy / risk
  heatLevel: number; // 0-100 → razzia risk
  bribedUntilDay: number;
  bribeStreak: number; // diminishing returns counter
  lastBribeDay: number; // 0 if never
  loan: number;
  loanDueDay: number;
  distilleryLevel: number; // 1-3
  studioLevel: number; // 1-3
  equipment: { camera: number; lighting: number; editing: number }; // 0-3 each
  productions: Production[];
  // shop inventory
  filmstock: number;
  costumes: number;
  auditionVouchers: number;
  distribBonus: number; // % bonus applied to next release payout
  campaignBonus: number; // % marketing-kampanje-bonus, brukes opp ved neste release
  rivals: Rival[];
  news: string[]; // siste byens overskrifter (nyeste først)
  rivalDigest: string[]; // kompakt ukesdigest med +/- share
  webcamLevel: number; // 1-3, hvor mange webcam-show typer låst opp
  trailerLevel: number; // 1-4, hvor mange visit-typer er låst opp
  condoms: number; // forbrukbare beskyttelse — brukes auto i risikable scener
  fans: Record<GenreId, number>; // genre-vektor: bygges av releases, drives marketing-mål
  milestones: GameMilestones;
  milestoneEvent: MilestoneEventPayload | null;
  distributionDeals: DistributionDeal[];
}
export type DistributionDealType = "streaming" | "dvd" | "cable" | "theatrical";
export interface DistributionDeal {
  id: string;
  label: string;
  dealType: DistributionDealType;
  durationWeeks: number;
  royaltyPct: number;
  genrePreference?: GenreId;
  minQuality: number;
  minReputation: number;
  advancePayment?: number;
  activeFromDay?: number;
  expiresDay?: number;
}

export type EquipmentKind = "camera" | "lighting" | "editing";

export const EQUIPMENT_LABELS: Record<
  EquipmentKind,
  { label: string; emoji: string; blurb: string }
> = {
  camera: {
    label: "Kameraer",
    emoji: "📷",
    blurb: "Bedre opptak → høyere kvalitet, raskere innspilling.",
  },
  lighting: {
    label: "Lyssetting",
    emoji: "💡",
    blurb: "Rigget lys → mindre rework, billigere produksjon.",
  },
  editing: {
    label: "Redigering",
    emoji: "🖥️",
    blurb: "Raskere maskiner → kortere redigeringstid og bedre finish.",
  },
};

// Studio + equipment efficiency modifiers — applied to all productions.
export function getStudioMods(s: GameState) {
  const eqSum = s.equipment.camera + s.equipment.lighting + s.equipment.editing;
  const studioBoost = s.studioLevel - 1; // 0..2
  const lowEqPenalties = getLowEquipmentPenalties(eqSum);
  // Cost: -8% per studio level above 1, -4% per equipment level. Floor 50%.
  const costMult = Math.max(0.5, 1 - 0.08 * studioBoost - 0.04 * eqSum);
  // Hours: -6% per studio level, -3% per equipment level. Floor 50%.
  const hoursMult = Math.max(0.5, 1 - 0.06 * studioBoost - 0.03 * eqSum);
  const shootHoursMult = lowEqPenalties.shootHoursMult;
  const editHoursMult = lowEqPenalties.editHoursMult;
  // Quality cap: 70 base + 6/studio level + 2/eq level, with low-equipment penalty.
  const qualityCap = Math.max(45, Math.min(100, 70 + studioBoost * 6 + eqSum * 2 - lowEqPenalties.qualityCapPenalty));
  // Parallel capacity: 1 base + studio level + 1 per 2 equipment levels.
  const capacity = 1 + studioBoost + Math.floor(eqSum / 2);
  return { costMult, hoursMult, qualityCap, capacity, eqSum, shootHoursMult, editHoursMult };
}

export function stageCost(stage: { cost: number }, mods: { costMult: number }) {
  return Math.max(1, Math.ceil(stage.cost * mods.costMult));
}
export function stageHours(stage: { hours: number }, mods: { hoursMult: number }) {
  return Math.max(1, Math.round(stage.hours * mods.hoursMult));
}
function stageHoursWithStaff(
  stage: { id?: string; hours: number },
  mods: { hoursMult: number; shootHoursMult: number; editHoursMult: number },
  s: GameState,
) {
  const roleMult = stage.id === "shooting"
    ? mods.shootHoursMult
    : stage.id === "editing"
      ? mods.editHoursMult
      : 1;
  const base = Math.max(1, Math.round(stageHours(stage, mods) * roleMult));
  if (stage.id !== "editing") return base;
  return Math.max(1, Math.round(base * staffMods(s).editingHoursMult));
}

export const EQUIPMENT_UPGRADE_COST = (level: number, studioLevel: number) =>
  Math.floor(600 * Math.pow(level + 1, 1.6) * (0.8 + studioLevel * 0.3));

export function getEquipmentLevelLabel(kind: EquipmentKind, level: number) {
  return level === 0 ? EQUIPMENT_LEVEL_ZERO_FLAVOR[kind] : `Lv ${level}`;
}

const INITIAL: GameState = {
  cash: 350,
  reputation: 2,
  stamina: 100,
  maxStamina: 100,
  day: 1,
  hour: 8,
  locationLevel: 1,
  moonshine: 2,
  backlog: 0,
  player: { charisma: 3, hustle: 3, business: 1, lust: 4 },
  girls: [],
  staff: [],
  log: [
    "Velkommen til Bustville, Alabama. Lukten av rust og muligheter.",
    "Du eier én trailer, $350, og en uforklarlig selvtillit.",
    "Klikk på en bygning for å komme i gang.",
  ],
  won: false,
  district: "park",
  activeLocation: null,
  heatLevel: 5,
  bribedUntilDay: 0,
  bribeStreak: 0,
  lastBribeDay: 0,
  loan: 0,
  loanDueDay: 0,
  distilleryLevel: 1,
  studioLevel: 1,
  equipment: { camera: 0, lighting: 0, editing: 0 },
  productions: [],
  filmstock: 0,
  costumes: 0,
  auditionVouchers: 0,
  distribBonus: 0,
  campaignBonus: 0,
  rivals: INITIAL_RIVALS,
  news: ["📰 Bustville Bugle: 'Ny gründer i Trailer Park — hva i all verden brygger han på?'"],
  rivalDigest: ["Rival watch online. Første ukesrapport kommer dag 8."],
  webcamLevel: 1,
  trailerLevel: 1,
  condoms: 2,
  fans: emptyFans(),
  milestones: { firstHit: false },
  milestoneEvent: null,
  distributionDeals: [
    { id: "deal-stream-1", label: "NeonFlix Midnight", dealType: "streaming", durationWeeks: 6, royaltyPct: 8, genrePreference: "glamour", minQuality: 45, minReputation: 12, advancePayment: 350 },
    { id: "deal-dvd-1", label: "Red State DVD Club", dealType: "dvd", durationWeeks: 10, royaltyPct: 6, genrePreference: "wild", minQuality: 35, minReputation: 8 },
    { id: "deal-cable-1", label: "AfterDark Cable", dealType: "cable", durationWeeks: 8, royaltyPct: 7, minQuality: 50, minReputation: 15, advancePayment: 500 },
  ],
};
const STAFF_POOLS: Record<StaffRole, { names: string[]; traits: string[] }> = {
  editor: { names: ["Marty Cut", "Joan Razor", "Vince Splice"], traits: ["Night Owl", "Precision", "Fast Hands"] },
  scout: { names: ["Rita Radar", "Duke Finder", "Nina Nose"], traits: ["Street Ear", "Charm Magnet", "Lucky Hunch"] },
  marketer: { names: ["Penny Hype", "Lex Promo", "Cindy Clicks"], traits: ["Copy Wizard", "Trend Sniffer", "Billboard Brain"] },
  fixer: { names: ["Buck Quiet", "Mara Cool", "Iggy Ice"], traits: ["Discreet", "Backchannel", "Crisis Calm"] },
};
function staffMods(s: GameState) {
  const byRole = (r: StaffRole) => s.staff.filter((m) => m.role === r);
  const rolePower = (r: StaffRole) => byRole(r).reduce((a, m) => a + m.bonus + m.level * 2, 0);
  return {
    editingHoursMult: Math.max(0.75, 1 - rolePower("editor") * 0.01),
    scoutingQuality: Math.min(4, Math.floor(rolePower("scout") / 6)),
    marketingMult: 1 + rolePower("marketer") * 0.015,
    heatMitigation: Math.min(8, Math.floor(rolePower("fixer") / 5)),
  };
}


export interface DowntownUnlockRequirements {
  cash: number;
  reputation: number;
  maxHeat: number;
  requiresFirstHit: boolean;
  minTalent?: number;
}

export const DOWNTOWN_UNLOCK_REQUIREMENTS: DowntownUnlockRequirements = {
  cash: 24500,
  reputation: 55,
  maxHeat: 45,
  requiresFirstHit: true,
  minTalent: 3,
};


const FIRST_HIT_REQUIREMENTS = {
  minQuality: 58,
  minGross: 3000,
  minReputation: 20,
  maxHeat: 55,
};

function isQuickieRelease(tierId: string): boolean {
  return tierId === "quickie";
}

export function hasFirstHit(state: GameState): boolean {
  return state.productions.some((p) => !!p.releasedGross && !p.flopped);
}

export function meetsDowntownUnlockRequirements(state: GameState): boolean {
  const req = DOWNTOWN_UNLOCK_REQUIREMENTS;
  if (state.cash < req.cash) return false;
  if (state.reputation < req.reputation) return false;
  if (state.heatLevel > req.maxHeat) return false;
  if (req.requiresFirstHit && !hasFirstHit(state)) return false;
  if (req.minTalent !== undefined && state.girls.length < req.minTalent) return false;
  return true;
}

const STORAGE_KEY = "bustville-empire-v2";

type SaveStorageVersion = "bustville-empire-v2";
const CURRENT_STORAGE_VERSION: SaveStorageVersion = STORAGE_KEY;

type SaveLike = Partial<GameState> & {
  rank?: unknown;
  departments?: unknown;
  storageVersion?: unknown;
};

interface VersionedSaveEnvelope {
  storageVersion: SaveStorageVersion;
  state: SaveLike;
}

const SAVE_MIGRATIONS: Record<SaveStorageVersion, (raw: SaveLike) => SaveLike> = {
  "bustville-empire-v2": (raw) => ({
    ...raw,
    milestones:
      raw.milestones && typeof raw.milestones === "object"
        ? { ...INITIAL.milestones, ...raw.milestones }
        : { ...INITIAL.milestones },
    departments: Array.isArray(raw.departments) ? raw.departments : [],
    staff: Array.isArray(raw.staff) ? raw.staff : [],
    distributionDeals: Array.isArray(raw.distributionDeals)
      ? raw.distributionDeals
      : [...INITIAL.distributionDeals],
  }),
};

function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function migrateByVersion(rawState: SaveLike, version: unknown): SaveLike {
  const resolvedVersion: SaveStorageVersion =
    version === "bustville-empire-v2" ? version : "bustville-empire-v2";
  return SAVE_MIGRATIONS[resolvedVersion](rawState);
}

function normalizeGameState(raw: unknown): GameState {
  const base = raw && typeof raw === "object" ? (raw as SaveLike) : {};
  const migrated = migrateByVersion(base, base.storageVersion);
  const { rank: _rank, storageVersion: _storageVersion, departments: _departments, ...rest } = migrated;
  return {
    ...INITIAL,
    ...rest,
    milestones:
      rest.milestones && typeof rest.milestones === "object"
        ? { ...INITIAL.milestones, ...rest.milestones }
        : { ...INITIAL.milestones },
    staff: Array.isArray(rest.staff) ? rest.staff : [],
    distributionDeals: Array.isArray(rest.distributionDeals)
      ? rest.distributionDeals
      : [...INITIAL.distributionDeals],
    rivalDigest: Array.isArray(rest.rivalDigest) ? rest.rivalDigest : INITIAL.rivalDigest,
  };
}

function serializeStateForStorage(state: GameState): VersionedSaveEnvelope {
  const normalized = normalizeGameState(state);
  const { rank: _rank, ...clean } = normalized as GameState & { rank?: unknown };
  return { storageVersion: CURRENT_STORAGE_VERSION, state: clean };
}


export interface SaveSlotMeta {
  slot: number;
  label: string;
  savedAt: number;
  day: number;
  cash: number;
}

export function listSaveSlots(): SaveSlotMeta[] {
  if (typeof window === "undefined") return [];
  const out: SaveSlotMeta[] = [];
  for (let i = 1; i <= 3; i++) {
    const raw = localStorage.getItem(`${STORAGE_KEY}:slot:${i}`);
    if (!raw) continue;
    try {
      const m = JSON.parse(raw);
      out.push({
        slot: i,
        label: m.label ?? `Save ${i}`,
        savedAt: m.savedAt ?? 0,
        day: m.day ?? m.state?.day ?? 0,
        cash: m.cash ?? m.state?.cash ?? 0,
      });
    } catch {}
  }
  return out;
}
const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const ri = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export function dayName(day: number) {
  return ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"][(day - 1) % 7];
}
/**
 * Ukentlig grense er dag 8, 15, 22, ... (dag 1 er startankeret og skal ikke trigge weekTick ved init).
 * Dette tilsvarer én uketick hver gang vi går inn i en ny 7-dagers blokk etter oppstartsuken.
 */
export function isWeeklyBoundary(day: number): boolean {
  return day > 1 && (day - 1) % 7 === 0;
}
export function timeStr(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}
export function isOpen(locId: LocationId, hour: number) {
  const [a, b] = LOCATION_DEFS[locId].openHours;
  return hour >= a && hour < b;
}

function genGirl(playerCharisma: number, locLevel: number, qualityMod = 0): Girl {
  const tier = Math.max(1, Math.min(5, locLevel + qualityMod));
  const pool: Archetype[] =
    locLevel >= 4 ? [...ARCHETYPES] : ARCHETYPES.filter((a) => a !== "Exotic Import");
  const archetype = rand(pool);
  const base = 25 + tier * 8 + playerCharisma * 2;
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
    archetype,
    beauty: Math.min(99, base + ri(-10, 20)),
    performance: Math.min(99, base - 5 + ri(-10, 20)),
    popularity: Math.min(99, 15 + tier * 6 + ri(0, 15)),
    loyalty: 45 + ri(0, 25),
    salary: 60 + tier * 35 + ri(0, 40),
  };
}

/** Genererer kontrakt-tilbud basert på stjernens kvalitet. */
export function genContract(
  g: Girl,
  currentDay: number,
  lengthWeeks: 4 | 8 | 12 = 8,
): import("./data").Contract {
  const rating = (g.beauty + g.performance + g.popularity) / 3; // 0-99
  // Lengre kontrakt = høyere signing bonus + lavere ukentlig minimum (de "binder seg")
  const lengthMult = lengthWeeks === 4 ? 0.6 : lengthWeeks === 8 ? 1 : 1.6;
  const signingBonus = Math.round((200 + rating * 18) * lengthMult);
  const minBase = Math.round(
    g.salary * (lengthWeeks === 12 ? 0.95 : lengthWeeks === 4 ? 1.25 : 1.1),
  );
  return {
    signingBonus,
    weeklyMin: minBase,
    signedDay: currentDay,
    lengthWeeks,
    expiresDay: currentDay + lengthWeeks * 7,
  };
}

/** Returnerer effektiv ukentlig lønn (kontrakt-min vs. salary). */
export function effectiveSalary(g: Girl): number {
  if (g.contract) return Math.max(g.salary, g.contract.weeklyMin);
  return g.salary;
}

/** Pakker en nyrekruttert stjerne med en 8-ukers kontrakt. */
function withContract(g: Girl, day: number, lengthWeeks: 4 | 8 | 12 = 8): Girl {
  return { ...g, contract: genContract(g, day, lengthWeeks) };
}

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = safeParseJson(raw);
        const incoming = parsed && typeof parsed === "object" && "state" in parsed
          ? (parsed as { state?: unknown }).state
          : parsed;
        setState(normalizeGameState(incoming));
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeStateForStorage(state)));
    // Flush queued toasts after commit
    while (_toastQueue.length) {
      const t = _toastQueue.shift()!;
      toast[t.kind](t.title, t.description ? { description: t.description } : undefined);
    }
  }, [state, loaded]);

  // Idle auto-tick: hvis spilleren er inaktiv, la klokken sive sakte fremover.
  // 1 time hvert 25. sekund. Hopper over splash-skjerm og vinn-skjerm.
  useEffect(() => {
    if (!loaded) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (s.won) return s;
        if (s.day === 1 && s.hour === 8 && s.girls.length === 0) return s; // splash
        return advance(s, 1);
      });
    }, 25000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const log = (s: GameState, msg: string): GameState => ({
    ...s,
    log: [msg, ...s.log].slice(0, 60),
  });

  const reset = useCallback(() => setState(INITIAL), []);

  const saveToSlot = useCallback(
    (slot: number, label?: string) => {
      const meta = {
        state,
        savedAt: Date.now(),
        label: label || `Save ${slot}`,
        day: state.day,
        cash: state.cash,
      };
      localStorage.setItem(`${STORAGE_KEY}:slot:${slot}`, JSON.stringify({ ...meta, state: serializeStateForStorage(state).state, storageVersion: CURRENT_STORAGE_VERSION }));
    },
    [state],
  );

  const loadFromSlot = useCallback((slot: number) => {
    const raw = localStorage.getItem(`${STORAGE_KEY}:slot:${slot}`);
    if (!raw) return false;
    try {
      const parsed = safeParseJson(raw);
      if (!parsed || typeof parsed !== "object") return false;
      const incoming = "state" in parsed ? (parsed as { state?: unknown }).state : parsed;
      setState(normalizeGameState(incoming));
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteSlot = useCallback((slot: number) => {
    localStorage.removeItem(`${STORAGE_KEY}:slot:${slot}`);
  }, []);

  const exportSave = useCallback(() => JSON.stringify(serializeStateForStorage(state), null, 2), [state]);

  const importSave = useCallback((json: string) => {
    try {
      const parsed = safeParseJson(json);
      if (!parsed || typeof parsed !== "object") return false;
      const incoming = "state" in parsed ? (parsed as { state?: unknown }).state : parsed;
      setState(normalizeGameState(incoming));
      return true;
    } catch {
      return false;
    }
  }, []);
  const isDealEligibleForProduction = (deal: DistributionDeal, p: Production, s: GameState) =>
    (p.genreId ? !deal.genrePreference || deal.genrePreference === p.genreId : !deal.genrePreference) &&
    Math.round(Math.max(0, Math.min(getStudioMods(s).qualityCap, p.quality))) >= deal.minQuality &&
    s.reputation >= deal.minReputation;

  // === TIME ENGINE ============================================
  // Advance time by N hours, drain stamina, complete missions, tick productions
  function advance(s: GameState, hours: number): GameState {
    let next = { ...s };
    next.stamina = Math.max(0, next.stamina - hours * 4);
    next.productions = next.productions.map((p) =>
      p.stageIdx >= STAGE_ORDER.length ? p : { ...p, hoursLeft: Math.max(0, p.hoursLeft - hours) },
    );
    next.hour += hours;
    while (next.hour >= 24) {
      next.hour -= 24;
      next.day += 1;
      next.heatLevel = Math.max(0, next.heatLevel - 3);
      // Daglig overskrift (60% sjanse for å unngå spam)
      if (Math.random() < 0.6) {
        const headline = dailyHeadline(next.rivals);
        next.news = [headline, ...next.news].slice(0, 12);
      }
      // Dag-anker: weekTick kjøres på dag 8, 15, 22, ... (ikke dag 1), altså nøyaktig én gang per ukegrense.
      if (isWeeklyBoundary(next.day)) next = weekTick(next);
      if (next.loan > 0 && next.day >= next.loanDueDay) {
        if (next.cash >= next.loan) {
          next = log(next, `🏦 Lån betalt automatisk: -$${next.loan}.`);
          next.cash -= next.loan;
          next.loan = 0;
        } else {
          const penalty = Math.floor(next.loan * 0.1);
          next = log(next, `🏦 Lån forfalt! Renter +$${penalty}.`);
          next.loan += penalty;
          next.loanDueDay = next.day + 7;
        }
      }
    }
    // Complete any missions whose end time has passed — consolidated log + toast
    const nowAbs = absHour(next);
    const completed: {
      name: string;
      label: string;
      payout: number;
      rep: number;
      toastId: string;
      mid: string;
    }[] = [];
    next.girls = next.girls.map((g) => {
      if (g.mission && g.mission.endsAt <= nowAbs) {
        const m = g.mission;
        completed.push({
          name: g.name,
          label: m.label,
          payout: m.payout,
          rep: m.rep,
          mid: m.id,
          toastId: `mission:${g.id}:${m.endsAt}`,
        });
        const scene: GalleryScene = {
          id: `${g.id}-mission-${m.id}-${nowAbs}`,
          day: next.day,
          title: m.label,
          kind: `mission-${m.id}`,
          emoji: "💼",
          hue: (m.id.length * 47) % 360,
        };
        return {
          ...g,
          mission: undefined,
          gallery: [...(g.gallery ?? []), scene].slice(-40),
          lastActivity: `✅ ${m.label}: +$${m.payout}, +${m.rep} rep`,
          lastActivityDay: next.day,
        };
      }
      return g;
    });
    if (completed.length) {
      const payouts = completed.reduce((a, c) => a + c.payout, 0);
      const repGain = completed.reduce((a, c) => a + c.rep, 0);
      next.cash += payouts;
      next.reputation += repGain;
      const details = completed
        .map((c) => `${c.name} — ${c.label}: +$${c.payout}, +${c.rep} rep`)
        .join(" · ");
      const summary =
        completed.length === 1
          ? `✅ ${completed[0].name} fullførte ${completed[0].label}: +$${payouts}, +${repGain} rep.`
          : `✅ ${completed.length} oppdrag fullført: +$${payouts}, +${repGain} rep. (${details})`;
      next = log(next, summary);
      const toastId = completed.map((c) => c.toastId).join("|");
      enqueueToast(toastId, {
        kind: "success",
        title:
          completed.length === 1
            ? `${completed[0].name} er tilbake fra ${completed[0].label}`
            : `${completed.length} jenter ferdige med oppdrag`,
        description: `+$${payouts.toLocaleString()} · +${repGain} rep${completed.length > 1 ? `\n${details}` : ""}`,
      });
    }
    return next;
  }

  function weekTick(s: GameState): GameState {
    let next = { ...s };
    const wages = next.girls.reduce((a, g) => a + effectiveSalary(g), 0);
    const royalty = next.backlog * 180;
    next.cash += royalty - wages;
    next = log(next, `📅 Ukens lønn: -$${wages}. Royalties: +$${royalty}.`);
    const royaltyLines: string[] = [];
    let dealRoyaltyTotal = 0;
    for (const p of next.productions) {
      if (!p.releasedGross || !p.distributionDealId) continue;
      const deal = next.distributionDeals.find((d) => d.id === p.distributionDealId);
      if (!deal || !deal.activeFromDay || !deal.expiresDay) continue;
      if (next.day > deal.expiresDay) continue;
      const payout = Math.floor(p.releasedGross * (deal.royaltyPct / 100));
      if (payout <= 0) continue;
      dealRoyaltyTotal += payout;
      royaltyLines.push(`💿 Deal royalty: "${p.title}" via ${deal.label} +$${payout} (${deal.royaltyPct}%).`);
    }
    if (dealRoyaltyTotal > 0) {
      next.cash += dealRoyaltyTotal;
      next.news = [`💿 Ukens deal-royalties: +$${dealRoyaltyTotal}.`, ...next.news].slice(0, 12);
      royaltyLines.forEach((line) => {
        next = log(next, line);
      });
    }
    // Kontrakt-utløp: marker som free agent, gi liten loyalty-hit
    const expiring = next.girls.filter((g) => g.contract && next.day >= g.contract.expiresDay);
    if (expiring.length) {
      next.girls = next.girls.map((g) => {
        if (g.contract && next.day >= g.contract.expiresDay) {
          return { ...g, contract: undefined, loyalty: Math.max(0, g.loyalty - 8) };
        }
        return g;
      });
      next = log(
        next,
        `📜 Kontrakt utløp: ${expiring.map((g) => g.name).join(", ")}. Re-sign dem før de stikker.`,
      );
    }
    const pool = RANDOM_EVENTS.filter((e) => !e.minLevel || next.locationLevel >= e.minLevel);
    const ev = rand(pool);
    if (ev.cash) next.cash += ev.cash;
    if (ev.rep) next.reputation = Math.max(0, next.reputation + ev.rep);
    if (ev.stamina)
      next.stamina = Math.max(0, Math.min(next.maxStamina, next.stamina + ev.stamina));
    next = log(next, ev.text);
    // Rival/marked-tick
    const { rivals: rawRivals, news: weeklyNews } = tickRivals(next.rivals, next.reputation);
    let newRivals = [...rawRivals];
    const counterLines: string[] = [];
    if (next.campaignBonus >= 20 || next.reputation >= 55) {
      newRivals = newRivals.map((r) => ({ ...r, share: Math.max(5, r.share - 0.8), momentum: Math.max(-100, r.momentum - 8), lastDelta: r.lastDelta - 0.8 }));
      counterLines.push("📢 PR push: du vant narrativet i lokalpressen (-share rivaler).");
    }
    const retained = next.girls.filter((g) => g.contract && g.loyalty >= 60).length;
    if (retained >= 2) {
      newRivals = newRivals.map((r) => ({ ...r, notoriety: Math.max(0, r.notoriety - 2), momentum: Math.max(-100, r.momentum - 5) }));
      counterLines.push("🤝 Talent retention: rivalenes signeringsraid bremset.");
    }
    const activeDeals = next.distributionDeals.filter((d) => d.activeFromDay && d.expiresDay && next.day <= d.expiresDay).length;
    if (activeDeals > 0 || next.distribBonus > 0) {
      newRivals = newRivals.map((r) => ({ ...r, share: Math.max(5, r.share - 0.5), lastDelta: r.lastDelta - 0.5 }));
      counterLines.push("💿 Undercut response: distribusjonsnettet ditt spiser marginene deres.");
    }
    next.rivals = newRivals;
    if (weeklyNews.length) {
      next.news = [...weeklyNews, ...next.news].slice(0, 12);
      next = log(next, weeklyNews[0]);
    }
    if (counterLines.length) {
      next.news = [...counterLines, ...next.news].slice(0, 12);
      counterLines.forEach((line) => {
        next = log(next, line);
      });
    }
    const digest = newRivals.map((r) => {
      const delta = r.lastDelta >= 0 ? `+${r.lastDelta.toFixed(1)}` : r.lastDelta.toFixed(1);
      return `${r.emoji} ${r.name}: ${Math.round(r.share)}% (${delta}) • ${r.weeklyMove}`;
    });
    next.rivalDigest = digest.slice(0, 4);
    // STD-tick: ukentlig loyalty-drain for syke jenter, og kronisk-varsel
    const sickGirls = next.girls.filter((g) => g.std);
    if (sickGirls.length) {
      next.girls = next.girls.map((g) => {
        if (!g.std) return g;
        const def = STDS[g.std.id];
        // Drain: kurerbar = -2, kronisk = -5
        const drain = def.curable ? 2 : 5;
        return { ...g, loyalty: Math.max(0, g.loyalty - drain) };
      });
      next = log(
        next,
        `🧪 ${sickGirls.length} stjerne(r) lider av smitte — loyalty drypper. Behandle hos Doc Lonnie.`,
      );
    }
    const drama = rollDrama(next.girls, absHour(next));
    if (drama) {
      next.girls = drama.girls;
      next.cash += drama.cashDelta;
      next.reputation = Math.max(0, next.reputation + drama.repDelta);
      next.heatLevel = Math.min(100, next.heatLevel + drama.heatDelta);
      next = log(next, drama.log);
    }
    if (
      next.heatLevel > 40 &&
      next.day >= next.bribedUntilDay &&
      Math.random() < next.heatLevel / 200
    ) {
      const loss = Math.min(next.cash, 200 + next.heatLevel * 10);
      const lostShine = Math.min(next.moonshine, 3);
      next.cash -= loss;
      next.moonshine -= lostShine;
      next.heatLevel = Math.max(0, next.heatLevel - 20);
      next = log(next, `🚓 RAZZIA! Politiet beslagla $${loss} og ${lostShine} 🥃.`);
    }
    // win?
    if (next.locationLevel >= 5 && next.cash >= 250000 && next.reputation >= 140) {
      next.won = true;
      next = log(next, "👑 DU ER PORN KING OF THE SOUTH! Bustville Empire er din!");
    }
    return next;
  }

  // === NAVIGATION ============================================
  const goTo = useCallback((id: LocationId) => {
    setState((s) => {
      const def = LOCATION_DEFS[id];
      if (def.unlockLevel && s.locationLevel < def.unlockLevel)
        return log(s, `${def.name} låses opp på Level ${def.unlockLevel}.`);
      if (!isOpen(id, s.hour))
        return log(
          s,
          `${def.name} er stengt nå. Åpningstider ${def.openHours[0]}-${def.openHours[1]}.`,
        );
      // small travel cost
      const next = advance(s, 1);
      return { ...next, activeLocation: id };
    });
  }, []);

  const backToMap = useCallback(() => {
    setState((s) => ({ ...s, activeLocation: null }));
  }, []);

  const switchDistrict = useCallback(() => {
    setState((s) => {
      const target: DistrictId = s.district === "park" ? "downtown" : "park";
      if (target === "downtown" && s.locationLevel < 3)
        return log(s, "Du har ikke råd til Downtown ennå. Bli Level 3 først.");
      const next = advance(s, 2);
      return log(
        { ...next, district: target, activeLocation: null },
        `🚗 Kjørte til ${target === "park" ? "Trailer Park" : "Downtown"}.`,
      );
    });
  }, []);

  /**
   * Bruker condom hvis tilgjengelig, ellers ruller smitterisiko.
   * Returnerer { state, log? } — kalleren slår sammen log-strengen i sin egen melding.
   */
  function rollEncounter(
    s: GameState,
    girlId: string | undefined,
    baseChance: number,
  ): { state: GameState; tag: string } {
    if (!girlId) return { state: s, tag: "" };
    const g = s.girls.find((x) => x.id === girlId);
    if (!g) return { state: s, tag: "" };
    // Ingen risiko hvis allerede smittet (én STD om gangen)
    if (g.std) return { state: s, tag: "" };
    // Condom beskytter
    if (s.condoms > 0) {
      return { state: { ...s, condoms: s.condoms - 1 }, tag: " 🧪✓" };
    }
    const newId = rollSTD(baseChance);
    if (!newId) return { state: s, tag: "" };
    const std: STDState = { id: newId, contractedDay: s.day };
    const stdDef = STDS[newId];
    enqueueToast(`std:${girlId}:${s.day}:${newId}`, {
      kind: "error",
      title: `${stdDef.emoji} ${g.name} fikk ${stdDef.name}`,
      description: `${stdDef.effect} ${stdDef.curable ? "Behandles hos Doc Lonnie." : "Ikke kurerbar."}`,
    });
    return {
      state: {
        ...s,
        girls: s.girls.map((x) => (x.id === girlId ? { ...x, std } : x)),
      },
      tag: ` ${stdDef.emoji}!`,
    };
  }

  // === ACTIONS ===============================================
  const perform = useCallback(
    (locId: LocationId, actionId: string, girlId?: string, intensity: Intensity = "standard") => {
      setState((s) => {
        const action = LOCATION_ACTIONS[locId].find((a) => a.id === actionId);
        // Pre-check: girl exists, isn't on mission, isn't on cooldown
        if (girlId) {
          const g = s.girls.find((x) => x.id === girlId);
          if (!g) return s;
          if (g.mission) return log(s, `⛔ ${g.name} er opptatt: ${g.mission.label}.`);
          const nowAbs = absHour(s);
          if (g.busyUntil && g.busyUntil > nowAbs) {
            return log(s, busyLog(g, s, "denne handlingen"));
          }
        }
        const before = s;
        let after = doAction(s, locId, actionId, girlId, intensity, advance);
        // STD-risiko ved intense, jente-involvert, betalt scene
        if (
          girlId &&
          intensity === "intense" &&
          action &&
          action.hours > 0 &&
          after.cash > before.cash
        ) {
          const enc = rollEncounter(after, girlId, 0.07);
          after = enc.state;
          if (enc.tag) after = log(after, `Risikabel scene${enc.tag}`);
        }
        // Apply cooldown to the working girl if action consumed time
        if (girlId && action && action.hours > 0 && after !== before) {
          const cd = intensityCooldownHours(action.hours, intensity);
          const until = absHour(after) + cd;
          after = {
            ...after,
            girls: after.girls.map((g) => (g.id === girlId ? { ...g, busyUntil: until } : g)),
          };
        }
        return after;
      });
    },
    [],
  );

  function doAction(
    s: GameState,
    locId: LocationId,
    actionId: string,
    girlId: string | undefined,
    intensity: Intensity,
    advanceFn: (s: GameState, h: number) => GameState,
  ): GameState {
    const action = LOCATION_ACTIONS[locId].find((a) => a.id === actionId);
    if (!action) return s;
    const girl = girlId ? s.girls.find((g) => g.id === girlId) : undefined;
    const girlMult = girl ? 1 + (girl.beauty + girl.performance + girl.popularity) / 220 : 1;
    const hustleMult = 1 + s.player.hustle * 0.05;
    const intensityMult = intensity === "chill" ? 0.7 : intensity === "intense" ? 1.45 : 1;
    let next = s;

    const earn = (base: number) =>
      Math.floor(base * girlMult * hustleMult * intensityMult * (0.85 + Math.random() * 0.3));
    const checkStam = (h: number) =>
      next.stamina >= h * 4 || ((next.log[0] = "For sliten — sov i traileren."), false);

    switch (`${locId}:${actionId}`) {
      // Trailer
      case "trailer:sleep": {
        const delta = hoursUntilNextClockTime(absHour(next), 7);
        next = advanceFn(next, delta);
        next.stamina = next.maxStamina;
        return log(next, `😴 Du sov til ${timeStr(next.hour)}. Full stamina.`);
      }
      case "trailer:webcam": {
        if (next.cash < 40) return log(next, "Trenger $40 til ringlys-batterier.");
        if (!checkStam(action.hours)) return next;
        const $ = earn(180);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - 40 + $, reputation: next.reputation + 1 },
          `💻 Webcam show${girl ? ` med ${girl.name}` : ""}: +$${$}, +1 rep.`,
        );
      }
      case "trailer:visit": {
        if (!checkStam(action.hours)) return next;
        const $ = earn(220);
        const heat = applyIntensityHeat(2, intensity, "perform");
        const finalHeat = mitigatedHeatGain(next, heat.total);
        next = advanceFn(next, action.hours);
        next = {
          ...next,
          cash: next.cash + $,
          reputation: next.reputation + 1,
          heatLevel: Math.min(100, next.heatLevel + finalHeat),
        };
        return log(
          next,
          `🚪 Mystisk besøk: +$${$}. Heat +${finalHeat}.`,
        );
      }
      case "trailer:roster":
        return next; // handled in UI (opens sheet)
      case "trailer:upgrade": {
        const nextLoc = LOCATIONS[next.locationLevel];
        if (!nextLoc) return log(next, "Du er allerede på toppen.");
        if (nextLoc.level === 3) {
          const req = DOWNTOWN_UNLOCK_REQUIREMENTS;
          if (next.cash < req.cash) return log(next, `Trenger $${req.cash}.`);
          if (next.reputation < req.reputation) return log(next, `Trenger ${req.reputation} rep.`);
          if (req.requiresFirstHit && !hasFirstHit(next)) return log(next, "Trenger First Hit (minst én vellykket release).");
          if (next.heatLevel > req.maxHeat) return log(next, `Heat må ned til ${req.maxHeat}% eller lavere.`);
          if (req.minTalent !== undefined && next.girls.length < req.minTalent)
            return log(next, `Trenger minst ${req.minTalent} talenter i roster.`);
        } else {
          if (next.cash < nextLoc.unlockCash) return log(next, `Trenger $${nextLoc.unlockCash}.`);
          if (next.reputation < nextLoc.unlockRep)
            return log(next, `Trenger ${nextLoc.unlockRep} rep.`);
        }
        return log(
          {
            ...next,
            cash: next.cash - nextLoc.unlockCash,
            locationLevel: nextLoc.level,
            maxStamina: next.maxStamina + 10,
          },
          `🏆 OPPGRADERT til ${nextLoc.name}! ${nextLoc.tagline}`,
        );
      }

      // Moonshine
      case "moonshine:brew": {
        if (next.cash < 80) return log(next, "Trenger $80.");
        if (!checkStam(action.hours)) return next;
        const yieldShine = 2 + next.distilleryLevel;
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - 80,
            moonshine: next.moonshine + yieldShine,
            heatLevel: Math.min(100, next.heatLevel + 3),
          },
          `🔥 Brygget ${yieldShine} flasker. Heat +3.`,
        );
      }
      case "moonshine:distillUp": {
        if (next.distilleryLevel >= 3) return log(next, "Destilleriet er maks oppgradert.");
        const cost = 600 * next.distilleryLevel;
        if (next.cash < cost) return log(next, `Oppgradering koster $${cost}.`);
        return log(
          { ...next, cash: next.cash - cost, distilleryLevel: next.distilleryLevel + 1 },
          `🛠️ Destilleri Lv ${next.distilleryLevel + 1}. Mer per batch.`,
        );
      }

      // Bar
      case "bar:sellLocal": {
        if (next.moonshine < 1) return log(next, "Ingen moonshine å selge.");
        const $ = 130 + ri(0, 80) + next.player.hustle * 10;
        next = advanceFn(next, action.hours);
        return log(
          { ...next, moonshine: next.moonshine - 1, cash: next.cash + $ },
          `🥃 Solgt en flaske til Dan: +$${$}.`,
        );
      }
      case "bar:rumor": {
        next = advanceFn(next, action.hours);
        const ev = rand(
          RANDOM_EVENTS.filter((e) => !e.minLevel || next.locationLevel >= e.minLevel),
        );
        if (ev.cash) next.cash += ev.cash;
        if (ev.rep) next.reputation = Math.max(0, next.reputation + ev.rep);
        return log(next, `👂 ${ev.text}`);
      }
      case "bar:scoutBar": {
        const cost = 180;
        if (next.cash < cost) return log(next, `Drinks til en danser: $${cost}.`);
        if (next.girls.length >= 6) return log(next, "Maks 6 stjerner.");
        next = advanceFn(next, action.hours);
        const raw = genGirl(next.player.charisma, next.locationLevel, -1 + staffMods(next).scoutingQuality);
        const g = withContract(raw, next.day, 8);
        const upfront = cost + g.contract!.signingBonus;
        if (next.cash < upfront)
          return log(
            next,
            `${raw.name} vil ha $${g.contract!.signingBonus} i signing bonus. Du har ikke råd.`,
          );
        return log(
          { ...next, cash: next.cash - upfront, girls: [...next.girls, g] },
          `💃 ${g.name} signerte 8-ukers kontrakt. Bonus $${g.contract!.signingBonus}, min $${g.contract!.weeklyMin}/uke.`,
        );
      }
      case "bar:drink": {
        if (next.cash < 30) return log(next, "Du har ikke råd til en runde.");
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - 30, reputation: next.reputation + 1 },
          "🍺 En runde til alle. Bra for ryktet, dårlig for hodet.",
        );
      }

      // Sheriff
      case "sheriff:bribe": {
        const gap = next.lastBribeDay > 0 ? next.day - next.lastBribeDay : Infinity;
        const streak = gap > 10 ? 0 : gap <= 5 ? next.bribeStreak : next.bribeStreak; // reset only after 10d gap
        const cost = Math.ceil((200 + next.heatLevel * 8) * (1 + 0.5 * streak));
        if (next.cash < cost) return log(next, `Buck vil ha $${cost}.`);
        const heatDrop = Math.max(5, 25 - streak * 5) + staffMods(next).heatMitigation;
        const newStreak = gap <= 5 ? streak + 1 : gap > 10 ? 1 : streak + 1;
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost,
            heatLevel: Math.max(0, next.heatLevel - heatDrop),
            bribedUntilDay: next.day + 3,
            bribeStreak: newStreak,
            lastBribeDay: next.day,
          },
          `💵 Buck tok $${cost}. Heat -${heatDrop}, beskyttet i 3 dager.${streak > 0 ? ` (Bribe-streak ×${newStreak} — han blir grådig.)` : ""}`,
        );
      }
      case "sheriff:snitch": {
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash + 120, reputation: Math.max(0, next.reputation - 4) },
          "🤐 Du tystet på naboen. +$120, -4 rep. Skammelig.",
        );
      }

      // Gas station
      case "gas:sellTrucker": {
        if (next.moonshine < 1) return log(next, "Tom for moonshine.");
        const $ = 180 + ri(0, 60) + next.player.hustle * 8;
        next = advanceFn(next, action.hours);
        return log(
          { ...next, moonshine: next.moonshine - 1, cash: next.cash + $ },
          `🚛 Trucker tok flaska: +$${$}.`,
        );
      }
      case "gas:supplies": {
        if (next.cash < 60) return log(next, "Trenger $60.");
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - 60, stamina: Math.min(next.maxStamina, next.stamina + 20) },
          "🥫 Energy-drikk og pølser. +20 stamina.",
        );
      }
      case "gas:gasCondoms": {
        const cost = 80;
        if (next.cash < cost) return log(next, `Condoms: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, condoms: next.condoms + 3 },
          "🧪 +3 condoms i hanskerommet.",
        );
      }
      case "gas:hitchhike": {
        next = advanceFn(next, action.hours);
        if (Math.random() < 0.5 && next.girls.length < 6) {
          const raw = genGirl(next.player.charisma, next.locationLevel, -2);
          const g = withContract(raw, next.day, 4); // haikere = kort kontrakt
          if (next.cash < g.contract!.signingBonus) {
            return log(
              next,
              `👠 ${raw.name} ville ha $${g.contract!.signingBonus} kontant. Du hadde ikke nok — hun hoppet av.`,
            );
          }
          return log(
            { ...next, cash: next.cash - g.contract!.signingBonus, girls: [...next.girls, g] },
            `👠 ${g.name} signerte 4-ukers prøvekontrakt. Bonus $${g.contract!.signingBonus}.`,
          );
        }
        const loss = 80;
        return log(
          { ...next, cash: Math.max(0, next.cash - loss) },
          `👠 Haiker stjal $${loss} fra hanskerommet. Klassisk.`,
        );
      }

      // Forest
      case "forest:scoutForest": {
        const cost = 60;
        if (next.cash < cost) return log(next, "Trenger $60 til lommelykt og lokkemat.");
        if (next.girls.length >= 6) return log(next, "Maks 6 stjerner.");
        next = advanceFn(next, action.hours);
        const raw = genGirl(next.player.charisma, next.locationLevel, -1 + staffMods(next).scoutingQuality);
        const g = withContract(raw, next.day, 4);
        const upfront = cost + g.contract!.signingBonus;
        if (next.cash < upfront)
          return log(next, `${raw.name} vil ha $${g.contract!.signingBonus} i bonus.`);
        return log(
          { ...next, cash: next.cash - upfront, girls: [...next.girls, g] },
          `🔦 ${g.name} signerte 4-ukers kontrakt. Bonus $${g.contract!.signingBonus}.`,
        );
      }
      case "forest:hideStash": {
        next = advanceFn(next, action.hours);
        return log(
          { ...next, heatLevel: Math.max(0, next.heatLevel - (15 + staffMods(next).heatMitigation)) },
          "🌲 Gjemte lageret. Razzia-risiko ned.",
        );
      }

      // Loft
      case "loft:glamour": {
        const cost = 250;
        if (next.cash < cost) return log(next, "Glamour koster $250.");
        if (!checkStam(action.hours)) return next;
        const $ = earn(1400);
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost + $,
            reputation: next.reputation + 4,
            backlog: next.backlog + 1,
          },
          `📸 Glamour shoot${girl ? ` m/ ${girl.name}` : ""}: +$${$}, +4 rep.`,
        );
      }
      case "loft:onlyfans": {
        const cost = 80;
        if (next.cash < cost) return log(next, "Trenger $80 til abonnement-bot.");
        if (!checkStam(action.hours)) return next;
        const $ = earn(520);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost + $, reputation: next.reputation + 2 },
          `🔥 OnlyFans-pakke: +$${$}.`,
        );
      }

      // Velvet
      case "velvet:network": {
        next = advanceFn(next, action.hours);
        const rep = 5 + next.player.charisma;
        return log({ ...next, reputation: next.reputation + rep }, `🤝 Nettverket. +${rep} rep.`);
      }
      case "velvet:party": {
        const cost = 600 + next.locationLevel * 200;
        if (next.cash < cost) return log(next, `Fest koster $${cost}.`);
        if (next.moonshine < 2) return log(next, "Trenger 2 🥃.");
        next = advanceFn(next, action.hours);
        const rep = 8 + next.locationLevel * 2 + next.player.charisma;
        return log(
          {
            ...next,
            cash: next.cash - cost,
            moonshine: next.moonshine - 2,
            reputation: next.reputation + rep,
            girls: next.girls.map((g) => ({
              ...g,
              loyalty: Math.min(99, g.loyalty + 5),
              popularity: Math.min(99, g.popularity + 3),
            })),
          },
          `🎉 Velvet-fest! +${rep} rep, jentene elsker deg.`,
        );
      }
      case "velvet:scoutVip": {
        const cost = 800;
        if (next.cash < cost) return log(next, `VIP-scout: $${cost}.`);
        if (next.girls.length >= 6) return log(next, "Maks 6 stjerner.");
        next = advanceFn(next, action.hours);
        const raw = genGirl(next.player.charisma, next.locationLevel, +1 + staffMods(next).scoutingQuality);
        const g = withContract(raw, next.day, 12); // VIP-stjerner = lange kontrakter
        const upfront = cost + g.contract!.signingBonus;
        if (next.cash < upfront)
          return log(
            next,
            `${raw.name} forventer $${g.contract!.signingBonus} i signing bonus. Du har ikke nok.`,
          );
        return log(
          { ...next, cash: next.cash - upfront, girls: [...next.girls, g] },
          `💎 ${g.name} signerte 12-ukers eksklusiv. Bonus $${g.contract!.signingBonus}, min $${g.contract!.weeklyMin}/uke.`,
        );
      }

      // Bank
      case "bank:loan": {
        if (next.loan > 0) return log(next, "Du har allerede et lån.");
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash + 5000, loan: 6500, loanDueDay: next.day + 28 },
          "💰 +$5000 lån. Tilbakebetal $6500 innen 4 uker.",
        );
      }
      case "bank:repay": {
        if (next.loan <= 0) return log(next, "Ingen lån.");
        if (next.cash < next.loan) return log(next, `Trenger $${next.loan}.`);
        return log({ ...next, cash: next.cash - next.loan, loan: 0 }, "💸 Lånet er nedbetalt.");
      }

      // Pro Studio
      case "studio:feature": {
        const cost = 900;
        if (next.cash < cost) return log(next, "Feature koster $900.");
        if (!checkStam(action.hours)) return next;
        const $ = earn(4800);
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost + $,
            reputation: next.reputation + 8,
            backlog: next.backlog + 1,
          },
          `🎬 Feature Film${girl ? ` m/ ${girl.name}` : ""}: +$${$}, +8 rep.`,
        );
      }
      case "studio:upgradeStudio": {
        if (next.studioLevel >= 3) return log(next, "Studio er maks oppgradert.");
        const cost = 4000 * next.studioLevel;
        if (next.cash < cost) return log(next, `Trenger $${cost}.`);
        return log(
          { ...next, cash: next.cash - cost, studioLevel: next.studioLevel + 1 },
          `🎥 Studio Lv ${next.studioLevel + 1}.`,
        );
      }

      // HQ
      case "hq:intl": {
        const cost = 3200;
        if (next.cash < cost) return log(next, "Internasjonal deal: $3200.");
        if (!checkStam(action.hours)) return next;
        const $ = earn(18500);
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost + $,
            reputation: next.reputation + 14,
            backlog: next.backlog + 2,
          },
          `🌍 Internasjonal deal: +$${$}, +14 rep.`,
        );
      }
      case "hq:empire": {
        next = advanceFn(next, action.hours);
        return log(
          { ...next, reputation: next.reputation + 12 },
          "👑 Empire-møte. +12 rep. Folk hvisker navnet ditt.",
        );
      }

      // Electronics — Sparky's Camera Shack
      case "electro:buyFilm": {
        const cost = 300;
        if (next.cash < cost) return log(next, `Filmstock: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, filmstock: next.filmstock + 5 },
          "📼 +5 ruller filmstock. Klare for innspilling.",
        );
      }
      case "electro:upgradeCamera":
      case "electro:upgradeLighting":
      case "electro:upgradeEditing": {
        const kind: EquipmentKind =
          actionId === "electro:upgradeCamera"
            ? "camera"
            : actionId === "electro:upgradeLighting"
              ? "lighting"
              : "editing";
        const realKind: EquipmentKind = actionId
          .replace("upgrade", "")
          .toLowerCase() as EquipmentKind;
        const k = (realKind in next.equipment ? realKind : kind) as EquipmentKind;
        const lvl = next.equipment[k];
        if (lvl >= 3) return log(next, `${EQUIPMENT_LABELS[k].label} er maks.`);
        const c = EQUIPMENT_UPGRADE_COST(lvl, next.studioLevel);
        if (next.cash < c) return log(next, `${EQUIPMENT_LABELS[k].label} Lv${lvl + 1}: $${c}.`);
        return log(
          { ...next, cash: next.cash - c, equipment: { ...next.equipment, [k]: lvl + 1 } },
          `${EQUIPMENT_LABELS[k].emoji} ${EQUIPMENT_LABELS[k].label} → Lv ${lvl + 1}.`,
        );
      }

      // Boutique — Glitter & Garter
      case "boutique:buyCostume": {
        const cost = 240;
        if (next.cash < cost) return log(next, `Kostymer: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, costumes: next.costumes + 3 },
          "👗 +3 kostymer på lager.",
        );
      }
      case "boutique:wardrobe": {
        const cost = 180;
        if (next.cash < cost) return log(next, `Garderobe-økt: $${cost}.`);
        if (next.girls.length === 0) return log(next, "Ingen jenter å style.");
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost,
            girls: next.girls.map((g) => ({
              ...g,
              popularity: Math.min(99, g.popularity + ri(2, 5)),
            })),
          },
          "💄 Garderobe-økt — alle jentene fikk +pop.",
        );
      }

      // Casting — Open Mic Casting
      case "casting:bookAudition": {
        const cost = 180;
        if (next.cash < cost) return log(next, `Audition-slot: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, auditionVouchers: next.auditionVouchers + 1 },
          "🎟️ +1 audition-voucher. Bruk i Casting-steget.",
        );
      }
      case "casting:openCall": {
        const cost = 500;
        if (next.cash < cost) return log(next, `Open call: $${cost}.`);
        if (next.girls.length >= 6) return log(next, "Maks 6 stjerner.");
        next = advanceFn(next, action.hours);
        if (Math.random() < 0.7) {
          const raw = genGirl(next.player.charisma, next.locationLevel, 0 + staffMods(next).scoutingQuality);
          const g = withContract(raw, next.day, 8);
          const upfront = cost + g.contract!.signingBonus;
          if (next.cash < upfront)
            return log(
              next,
              `${raw.name} vil ha $${g.contract!.signingBonus} i bonus. Du har ikke råd.`,
            );
          return log(
            { ...next, cash: next.cash - upfront, girls: [...next.girls, g] },
            `📣 ${g.name} signerte 8-ukers. Bonus $${g.contract!.signingBonus}, min $${g.contract!.weeklyMin}/uke.`,
          );
        }
        return log(
          { ...next, cash: next.cash - cost },
          "📣 Bare amatører i dag. Audition-vouchers var ikke verdt det.",
        );
      }

      // Distribution — Reel Republic
      case "distrib:signDeal": {
        next = advanceFn(next, action.hours);
        return log(
          { ...next, distribBonus: Math.min(50, next.distribBonus + 20) },
          "🤝 Distribusjons-deal: +20% på neste utgivelse.",
        );
      }
      case "distrib:presell": {
        if (next.backlog < 1) return log(next, "Ingen filmer på lager å pre-selge.");
        next = advanceFn(next, action.hours);
        const $ = 800 + ri(0, 500) + next.player.business * 80;
        return log(
          { ...next, cash: next.cash + $, backlog: next.backlog - 1 },
          `💼 Pre-solgte 1 tittel: +$${$}.`,
        );
      }
      case "distrib:campaignS":
      case "distrib:campaignM":
      case "distrib:campaignL": {
        const tier =
          actionId === "distrib:campaignS"
            ? { cost: 300, bonus: 20, emoji: "📣", name: "lokal" }
            : actionId === "distrib:campaignM"
              ? { cost: 800, bonus: 50, emoji: "📺", name: "regional" }
              : { cost: 2000, bonus: 100, emoji: "🚀", name: "nasjonal" };
        if (next.cash < tier.cost) return log(next, `${tier.emoji} Kampanje: $${tier.cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - tier.cost,
            campaignBonus: Math.min(200, next.campaignBonus + Math.round(tier.bonus * staffMods(next).marketingMult)),
          },
          `${tier.emoji} ${tier.name} kampanje aktivert: +${Math.round(tier.bonus * staffMods(next).marketingMult)}% på neste utgivelse.`,
        );
      }
      case "distrib:fansRomance":
      case "distrib:fansWild":
      case "distrib:fansGlamour":
      case "distrib:fansFetish": {
        const cost = 400;
        if (next.cash < cost) return log(next, `Fanboost: $${cost}.`);
        const gid = actionId.split(":")[1].replace("fans", "").toLowerCase() as GenreId;
        if (!GENRE_IDS.includes(gid)) return next;
        next = advanceFn(next, action.hours);
        const gain = 60;
        const meta = getGenre(gid);
        const newTotal = (next.fans[gid] ?? 0) + gain;
        return log(
          {
            ...next,
            cash: next.cash - cost,
            fans: { ...next.fans, [gid]: newTotal },
          },
          `${meta?.emoji ?? "📈"} Målrettet kampanje mot ${meta?.name ?? gid}-publikum: +${gain} fans (totalt ${newTotal}).`,
        );
      }

      case "clinic:heal": {
        const cost = 120;
        if (next.cash < cost) return log(next, `Sprøyte: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, stamina: next.maxStamina },
          "💉 Vitamin-cocktail. Full stamina.",
        );
      }
      case "clinic:detox": {
        const cost = 300;
        if (next.cash < cost) return log(next, `Detox: $${cost}.`);
        const target =
          next.girls.find((g) => g.id === girlId) ??
          next.girls.find((g) => g.busyUntil && g.busyUntil > absHour(next));
        if (!target) return log(next, "Ingen jente trenger detox.");
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost,
            girls: next.girls.map((g) => (g.id === target.id ? { ...g, busyUntil: undefined } : g)),
          },
          `🧴 ${target.name} er klar igjen.`,
        );
      }
      case "clinic:buyCondoms": {
        const cost = 200;
        if (next.cash < cost) return log(next, `Condoms: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          { ...next, cash: next.cash - cost, condoms: next.condoms + 10 },
          "🧪 +10 condoms i kofferten. Doc Lonnie blunker.",
        );
      }
      case "clinic:antibiotics": {
        const cost = 400;
        if (!girlId) return log(next, "Velg en stjerne for behandling.");
        const target = next.girls.find((g) => g.id === girlId);
        if (!target) return log(next, "Stjerne ikke funnet.");
        if (!target.std) return log(next, `${target.name} er allerede frisk.`);
        const def = STDS[target.std.id];
        if (!def.curable)
          return log(
            next,
            `${def.emoji} ${def.name} kan ikke kurereres med antibiotika. Prøv steroider for å undertrykke.`,
          );
        if (next.cash < cost) return log(next, `Antibiotika: $${cost}.`);
        next = advanceFn(next, action.hours);
        return log(
          {
            ...next,
            cash: next.cash - cost,
            girls: next.girls.map((g) => (g.id === target.id ? { ...g, std: undefined } : g)),
          },
          `💊 ${target.name} kurert for ${def.name}. Doc snur seg ikke under injeksjonen.`,
        );
      }
      case "clinic:steroids": {
        const cost = 700;
        if (!girlId) return log(next, "Velg en stjerne.");
        const target = next.girls.find((g) => g.id === girlId);
        if (!target) return log(next, "Stjerne ikke funnet.");
        if (!target.std) return log(next, `${target.name} har ingenting å undertrykke.`);
        if (next.cash < cost) return log(next, `Steroider: $${cost}.`);
        next = advanceFn(next, action.hours);
        const until = next.day + 5;
        const def = STDS[target.std.id];
        return log(
          {
            ...next,
            cash: next.cash - cost,
            girls: next.girls.map((g) =>
              g.id === target.id && g.std
                ? { ...g, std: { ...g.std, suppressedUntilDay: until } }
                : g,
            ),
          },
          `💉 Steroid-blokker: ${target.name}s ${def.name} er undertrykt til dag ${until}.`,
        );
      }
      case "clinic:enhanceLips":
      case "clinic:enhanceFit":
      case "clinic:enhanceBoob":
      case "clinic:enhanceButt": {
        const procId = actionId.replace("clinic:enhance", "").toLowerCase();
        const proc = BODY_PROCEDURES.find((p) => p.id === procId);
        if (!proc) return log(next, "Ukjent prosedyre.");
        if (!girlId) return log(next, `Velg en stjerne for ${proc.label}.`);
        const target = next.girls.find((g) => g.id === girlId);
        if (!target) return log(next, "Stjerne ikke funnet.");
        if (target.busyUntil && target.busyUntil > absHour(next))
          return log(next, `${target.name} er ikke klar enda.`);
        if (target.mission) return log(next, `${target.name} er på oppdrag.`);
        if (next.cash < proc.cost) return log(next, `${proc.label}: $${proc.cost}.`);
        next = advanceFn(next, action.hours);
        // Komplikasjon
        if (Math.random() < proc.risk) {
          const dmg = ri(3, 8);
          return log(
            {
              ...next,
              cash: next.cash - proc.cost,
              girls: next.girls.map((g) =>
                g.id === target.id
                  ? {
                      ...g,
                      busyUntil: absHour(next) + (proc.restDays + 3) * 24,
                      loyalty: Math.max(0, g.loyalty - dmg),
                    }
                  : g,
              ),
            },
            `🚑 ${proc.label} på ${target.name} gikk galt! Ekstra ${proc.restDays + 3} dager restitusjon, −${dmg} loy. Doc-rapport: "Hun blir bra. Sannsynligvis."`,
          );
        }
        const inc = ri(proc.inc[0], proc.inc[1]);
        return log(
          {
            ...next,
            cash: next.cash - proc.cost,
            girls: next.girls.map((g) =>
              g.id === target.id
                ? {
                    ...g,
                    [proc.stat]: Math.min(99, (g as any)[proc.stat] + inc),
                    busyUntil: absHour(next) + proc.restDays * 24,
                  }
                : g,
            ),
          },
          `${proc.emoji} ${target.name}: ${proc.label} +${inc} ${proc.stat}. Restitusjon ${proc.restDays} dager.`,
        );
      }
    }
    return next;
  }

  // direct manipulators for sheet
  const fireGirl = useCallback((id: string) => {
    setState((s) => {
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      return log({ ...s, girls: s.girls.filter((x) => x.id !== id) }, `👋 ${g.name} sparket.`);
    });
  }, []);
  const trainGirl = useCallback((id: string) => {
    setState((s) => {
      if (s.cash < 200) return log(s, "Trening koster $200.");
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      const stat = ["beauty", "performance", "popularity"][ri(0, 2)] as keyof Girl;
      const inc = ri(2, 6);
      return log(
        {
          ...s,
          cash: s.cash - 200,
          girls: s.girls.map((x) =>
            x.id === id ? { ...x, [stat]: Math.min(99, (x as any)[stat] + inc) } : x,
          ),
        },
        `🏋️ ${g.name} trente ${stat}. +${inc}.`,
      );
    });
  }, []);
  const giftGirl = useCallback((id: string) => {
    setState((s) => {
      if (s.cash < 150) return log(s, "Gaver koster $150.");
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      return log(
        {
          ...s,
          cash: s.cash - 150,
          girls: s.girls.map((x) =>
            x.id === id ? { ...x, loyalty: Math.min(99, x.loyalty + ri(6, 14)) } : x,
          ),
        },
        `🎁 ${g.name} fikk en gave.`,
      );
    });
  }, []);
  const resignGirl = useCallback((id: string, lengthWeeks: 4 | 8 | 12 = 8) => {
    setState((s) => {
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      if (g.contract)
        return log(
          s,
          `${g.name} har allerede en aktiv kontrakt (utløp dag ${g.contract.expiresDay}).`,
        );
      const contract = genContract(g, s.day, lengthWeeks);
      // Re-signing-rabatt for lojale stjerner
      const loyaltyDiscount = Math.round(contract.signingBonus * (g.loyalty / 200));
      const bonus = Math.max(50, contract.signingBonus - loyaltyDiscount);
      if (s.cash < bonus) return log(s, `${g.name} vil ha $${bonus} for å re-signe.`);
      return log(
        {
          ...s,
          cash: s.cash - bonus,
          girls: s.girls.map((x) =>
            x.id === id ? { ...x, contract: { ...contract, signingBonus: bonus } } : x,
          ),
        },
        `✍️ ${g.name} re-signerte ${lengthWeeks} uker. Bonus $${bonus}, min $${contract.weeklyMin}/uke.`,
      );
    });
  }, []);
  const upgradeStat = useCallback((stat: keyof PlayerStats) => {
    setState((s) => {
      const cost = 300 + s.player[stat] * 250;
      if (s.cash < cost) return log(s, `Trenger $${cost}.`);
      return log(
        { ...s, cash: s.cash - cost, player: { ...s.player, [stat]: s.player[stat] + 1 } },
        `📈 ${stat} +1.`,
      );
    });
  }, []);
  const hireStaff = useCallback((role: StaffRole) => {
    setState((s) => {
      const cost = 500 + s.staff.length * 250;
      if (s.cash < cost) return log(s, `Ansettelse koster $${cost}.`);
      const pool = STAFF_POOLS[role];
      const name = rand(pool.names);
      const trait = rand(pool.traits);
      const member: StaffMember = {
        id: Math.random().toString(36).slice(2, 10),
        name,
        role,
        level: 1,
        bonus: ri(2, 5),
        salary: 120 + ri(0, 80),
        trait,
      };
      return log({ ...s, cash: s.cash - cost, staff: [...s.staff, member] }, `🧑‍💼 Ansatt ${name} (${role}).`);
    });
  }, []);
  const upgradeStaff = useCallback((id: string) => {
    setState((s) => {
      const m = s.staff.find((x) => x.id === id);
      if (!m) return s;
      const cost = 250 + m.level * 200;
      if (s.cash < cost) return log(s, `Oppgradering koster $${cost}.`);
      return log({
        ...s,
        cash: s.cash - cost,
        staff: s.staff.map((x) => x.id === id ? { ...x, level: x.level + 1, bonus: x.bonus + 1, salary: x.salary + 30 } : x),
      }, `📈 ${m.name} oppgradert til Lv ${m.level + 1}.`);
    });
  }, []);

  // === PRODUCTION PIPELINE ====================================
  const startProduction = useCallback((tierId: string, girlIds: string[], genreId?: string) => {
    setState((s) => {
      const tier = getTier(tierId);
      if (!tier) return s;
      if (s.locationLevel < tier.minLevel)
        return log(s, `${tier.name} krever Level ${tier.minLevel}.`);
      const mods = getStudioMods(s);
      const activeCount = s.productions.filter((p) => p.stageIdx < STAGE_ORDER.length).length;
      if (activeCount >= mods.capacity)
        return log(
          s,
          `Studio-kapasitet full (${activeCount}/${mods.capacity}). Oppgrader utstyr eller fullfør et prosjekt.`,
        );
      const brief = tier.stages[0];
      const cost = stageCost(brief, mods);
      const hours = stageHoursWithStaff(brief, mods, s);
      if (s.cash < cost) return log(s, `Briefing koster $${cost}.`);
      if (s.stamina < brief.staminaCost) return log(s, "For sliten til å brife teamet.");
      const title = tier.flavorTitles[Math.floor(Math.random() * tier.flavorTitles.length)];
      const startQ = Math.min(mods.qualityCap, 10 + s.player.business * 2 + mods.eqSum);
      const roles: Record<string, "casting" | "shooting" | "editing" | "release"> = {};
      girlIds.forEach((id) => {
        roles[id] = "shooting";
      });
      const prod: Production = {
        id: Math.random().toString(36).slice(2, 10),
        tierId,
        title,
        stageIdx: 0,
        hoursLeft: hours,
        girlIds,
        roles,
        quality: startQ,
        startedDay: s.day,
        reworks: 0,
        genreId,
      };
      const genreLabel = genreId ? ` [${getGenre(genreId)?.name ?? genreId}]` : "";
      return log(
        {
          ...s,
          cash: s.cash - cost,
          stamina: s.stamina - brief.staminaCost,
          productions: [...s.productions, prod],
        },
        `📝 "${title}"${genreLabel} (${tier.name}) i briefing [$${cost}, ${hours}t]. ${brief.flavor}`,
      );
    });
  }, []);

  const advanceProduction = useCallback((id: string) => {
    setState((s) => {
      const idx = s.productions.findIndex((p) => p.id === id);
      if (idx === -1) return s;
      const p = s.productions[idx];
      const tier = getTier(p.tierId)!;
      if (p.stageIdx >= STAGE_ORDER.length) return log(s, "Allerede ferdig.");
      if (p.hoursLeft > 0)
        return log(s, `Vent ${p.hoursLeft}t til ${tier.stages[p.stageIdx].label} er ferdig.`);

      // Cast averages (used by risk + payout)
      const castStats = p.girlIds
        .map((gid) => s.girls.find((x) => x.id === gid))
        .filter(Boolean) as Girl[];
      const castAvg = castStats.length
        ? castStats.reduce((a, g) => a + (g.beauty + g.performance + g.popularity) / 3, 0) /
          castStats.length
        : 0;

      const mods = getStudioMods(s);

      // Per-role cast contribution helper.
      const roleScore = (role: "casting" | "shooting" | "editing" | "release") =>
        roleScoreForProduction(p, s.girls, role);

      // Release stage payout
      if (p.stageIdx === STAGE_ORDER.length - 1) {
        const qualityMult = (p.quality + castAvg) / 100;
        const release = roleScore("release"); // PR/promo cast cuts flop risk and boosts gross
        const { flopChance, expectedGross, conservativeGross, genreMult, fanMult } = deriveProductionReleaseForecast(p, {
          girls: s.girls,
          reputation: s.reputation,
          rivals: s.rivals,
          playerBusiness: s.player.business,
          playerHustle: s.player.hustle,
          studioLevel: s.studioLevel,
          equipmentSum: mods.eqSum,
          distribBonus: s.distribBonus || 0,
          campaignBonus: s.campaignBonus || 0,
          fans: s.fans,
        });
        const flopped = Math.random() < flopChance;
        let gross = expectedGross;
        let repGain = tier.baseRep + Math.floor(qualityMult * 5) + Math.floor(release.score / 40);
        if (flopped) {
          gross = conservativeGross;
          repGain = -Math.max(2, Math.floor(tier.baseRep / 3));
        }
        // Spillerens hit reduserer rivalenes andel
        const rivalsAfter = flopped
          ? s.rivals
          : s.rivals.map((r) => ({
              ...r,
              share: Math.max(5, r.share - 1 - Math.floor(qualityMult * 2)),
            }));
        const finalQuality = Math.round(Math.max(0, Math.min(mods.qualityCap, p.quality)));
        const campaignBonusConsumed = s.campaignBonus || 0;
        const distribBonusConsumed = s.distribBonus || 0;
        const genreTag = p.genreId ? ` ${getGenre(p.genreId)?.emoji ?? ""}` : "";
        const matchNote = p.genreId
          ? genreMult >= 1.15
            ? " (perfekt cast-match!)"
            : genreMult <= 0.95
              ? " (cast passet dårlig)"
              : ""
          : "";
        const campNote = (s.campaignBonus || 0) > 0 ? ` [kampanje +${s.campaignBonus}%]` : "";
        // Fanbase-gevinst: bygger genre-vektoren over tid
        const fanGain = p.genreId
          ? Math.max(
              2,
              Math.floor((flopped ? 6 : 28) * (0.6 + qualityMult) * (1 + release.count * 0.15)),
            )
          : 0;
        const newFans = { ...s.fans };
        if (p.genreId) {
          const gid = p.genreId as GenreId;
          newFans[gid] = (newFans[gid] ?? 0) + fanGain;
        }
        const fanGainByGenre: Partial<Record<GenreId, number>> = p.genreId
          ? { [p.genreId as GenreId]: fanGain }
          : {};
        const releaseSummary = {
          moneyDelta: gross,
          reputationDelta: repGain,
          finalQuality,
          flopped,
          fanGainByGenre,
          genreMatchEffect: Number(genreMult.toFixed(2)),
          campaignBonusConsumed,
          distribBonusConsumed,
        };
        const updated = s.productions.map((x, i) =>
          i === idx
            ? {
                ...x,
                stageIdx: STAGE_ORDER.length,
                flopped,
                releasedGross: gross,
                lastResult: releaseSummary,
              }
            : x,
        );
        const selectedDeal = p.distributionDealId
          ? s.distributionDeals.find((d) => d.id === p.distributionDealId)
          : undefined;
        const dealEligible = selectedDeal ? isDealEligibleForProduction(selectedDeal, p, s) : false;
        const dealAdvance = dealEligible ? selectedDeal?.advancePayment ?? 0 : 0;
        const updatedDeals = selectedDeal && dealEligible
          ? s.distributionDeals.map((d) =>
              d.id === selectedDeal.id
                ? { ...d, activeFromDay: s.day, expiresDay: s.day + selectedDeal.durationWeeks * 7 }
                : d,
            )
          : s.distributionDeals;
        const fanNote = p.genreId
          ? ` · +${fanGain} ${getGenre(p.genreId)?.name ?? ""} fans${fanMult > 1.05 ? ` (fanbase ×${fanMult.toFixed(2)})` : ""}`
          : "";
        const headline = flopped
          ? `💀 FLOPP!${genreTag} "${p.title}" floppet.`
          : `🎉${genreTag} "${p.title}" sluppet!`;
        const shortSummary = `${flopped ? "" : "+"}$${gross}, ${repGain >= 0 ? "+" : ""}${repGain} rep, Q${finalQuality}${fanNote}`;
        const structuredSummary = `release_summary=${JSON.stringify(releaseSummary)}`;
        const note = `${headline} ${shortSummary}${matchNote}${campNote}${release.count ? ` (PR-team x${release.count})` : ""}. ${structuredSummary}`;
        enqueueToast(`release:${p.id}:${s.day}:${s.hour}`, {
          kind: flopped ? "error" : "success",
          title: flopped ? `Flopp: "${p.title}"` : `Release: "${p.title}"`,
          description: shortSummary,
        });
        const girls = s.girls.map((g) => {
          if (!p.girlIds.includes(g.id)) return g;
          const scene: GalleryScene = {
            id: `${g.id}-prod-${p.id}`,
            day: s.day,
            title: flopped ? `Flopp: "${p.title}"` : `"${p.title}"`,
            kind: `production-${p.tierId}`,
            emoji: flopped ? "💀" : "🎬",
            hue: flopped ? 12 : (p.tierId.length * 67) % 360,
          };
          const withScene = { ...g, gallery: [...(g.gallery ?? []), scene].slice(-40) };
          return flopped
            ? {
                ...withScene,
                loyalty: Math.max(0, g.loyalty - 4),
                lastActivity: `Spilte i flopp "${p.title}"`,
                lastActivityDay: s.day,
              }
            : {
                ...withScene,
                popularity: Math.min(99, g.popularity + 5),
                loyalty: Math.min(99, g.loyalty + 2),
                lastActivity: `Slapp "${p.title}" 🎬`,
                lastActivityDay: s.day,
              };
        });
        const nextReputation = Math.max(0, s.reputation + repGain);
        const firstHitUnlocked =
          !s.milestones.firstHit &&
          !flopped &&
          isQuickieRelease(p.tierId) &&
          finalQuality >= FIRST_HIT_REQUIREMENTS.minQuality &&
          gross >= FIRST_HIT_REQUIREMENTS.minGross &&
          nextReputation >= FIRST_HIT_REQUIREMENTS.minReputation &&
          s.heatLevel <= FIRST_HIT_REQUIREMENTS.maxHeat;

        const milestoneEvent = firstHitUnlocked
          ? {
              id: "firstHit" as const,
              title: "🥇 Milestone låst opp: First Hit",
              body: `Din første breakout-release er i boks. "${p.title}" beviste at studioet leverer.`,
              rewards: [
                "Downtown-gating kan nå passeres når øvrige krav er møtt",
                `+Tillit i markedet (quality ${finalQuality}, gross $${gross.toLocaleString()})`,
              ],
            }
          : s.milestoneEvent;

        if (firstHitUnlocked) {
          enqueueToast(`milestone:first-hit:${p.id}`, {
            kind: "success",
            title: "🥇 First Hit unlocked!",
            description: `"${p.title}" traff målene — Downtown er ett steg nærmere.`,
          });
        }

        return log(
          {
            ...s,
            reputation: nextReputation,
            backlog: flopped ? s.backlog : s.backlog + 1,
            distribBonus: 0,
            campaignBonus: 0,
            rivals: rivalsAfter,
            productions: updated,
            girls,
            fans: newFans,
            distributionDeals: updatedDeals,
            milestones: firstHitUnlocked ? { ...s.milestones, firstHit: true } : s.milestones,
            milestoneEvent,
            cash: s.cash + gross + dealAdvance,
          },
          firstHitUnlocked
            ? `${note}${dealAdvance > 0 ? ` 🤝 Deal-forskudd +$${dealAdvance}.` : ""} 🥇 Milestone: First Hit unlocked.`
            : `${note}${dealAdvance > 0 ? ` 🤝 Deal-forskudd +$${dealAdvance}.` : ""}`,
        );
      }

      // Pay next stage and enter it
      const nextIdx = p.stageIdx + 1;
      const nextStage = tier.stages[nextIdx];
      const nextCost = stageCost(nextStage, mods);
      const nextHours = stageHoursWithStaff(nextStage, mods, s);
      if (s.cash < nextCost) return log(s, `${nextStage.label} koster $${nextCost}.`);
      if (s.stamina < nextStage.staminaCost) return log(s, "For sliten — hvil først.");
      if (nextStage.id === "shooting" && p.girlIds.length === 0)
        return log(s, "Kan ikke filme uten cast. Tilordne minst én stjerne.");
      // Inventory gates for new shops
      if (nextStage.id === "casting" && s.auditionVouchers < 1)
        return log(s, "🎟️ Trenger 1 audition-voucher fra Open Mic Casting.");
      if (nextStage.id === "shooting" && (s.filmstock < 1 || s.costumes < 1))
        return log(s, "📼👗 Trenger 1 filmstock (Sparky's) og 1 kostyme (Glitter & Garter).");

      // Role-tuned cast contribution for this stage's roll.
      const role = nextStage.id as "casting" | "shooting" | "editing" | "release";
      const roleInfo = roleScore(role);
      const roleBonus = roleInfo.score * 0.18 + roleInfo.count * 1.5; // success%
      const roleQ = roleInfo.score * 0.1 + roleInfo.count * 1.0; // quality

      // === RISK ROLL ===
      const stageBoost =
        (nextStage.id === "casting" ? s.player.charisma * 3 : 0) +
        (nextStage.id === "shooting"
          ? s.player.lust * 2 +
            s.studioLevel * 5 +
            castAvg * 0.2 +
            s.equipment.lighting * 4 +
            s.equipment.camera * 3
          : 0) +
        (nextStage.id === "editing"
          ? s.player.business * 3 + s.equipment.editing * 4 + s.equipment.camera * 2
          : 0) +
        (nextStage.id === "release" ? s.player.hustle * 3 : 0) +
        roleBonus;
      const difficulty = tier.minLevel * 6;
      const successPct = Math.max(35, Math.min(95, 65 + stageBoost - difficulty));
      const roll = Math.random() * 100;
      const isEarlyTier = p.tierId === "quickie" || p.tierId === "glamour";
      // Mild onboarding protection: first failure in early tiers becomes a narrow success.
      const firstFailProtected =
        isEarlyTier && p.reworks === 0 && roll > successPct && roll - successPct <= 5;
      const failed = !firstFailProtected && roll > successPct;

      // P4: cast-binding — sterk bonus når stjerne er tildelt riktig rolle, straff når den mangler
      const roleAssignmentMod =
        roleInfo.count === 0
          ? nextStage.id === "casting"
            ? -6
            : nextStage.id === "shooting"
              ? -8
              : -3
          : Math.min(8, roleInfo.count * 3);

      const qBonus =
        (nextStage.id === "casting" ? 4 + s.player.charisma : 0) +
        (nextStage.id === "shooting"
          ? 6 + s.player.lust + s.studioLevel * 2 + s.equipment.lighting + s.equipment.camera
          : 0) +
        (nextStage.id === "editing" ? 4 + s.player.business + s.equipment.editing * 2 : 0) +
        (nextStage.id === "release" ? 3 + s.player.hustle : 0) +
        roleQ +
        roleAssignmentMod;

      let next = {
        ...s,
        cash: s.cash - nextCost,
        stamina: Math.max(0, s.stamina - nextStage.staminaCost),
      };
      // consume inventory at stage entry
      if (nextStage.id === "casting") next.auditionVouchers -= 1;
      if (nextStage.id === "shooting") {
        next.filmstock -= 1;
        next.costumes -= 1;
      }

      if (failed && p.reworks < 2) {
        const reworkCost = Math.floor(nextCost * 0.5);
        const prevStage = tier.stages[p.stageIdx];
        const reworkHours = Math.max(1, Math.floor(stageHoursWithStaff(prevStage, mods, s) * 0.7));
        const qualityPenalty = -8;
        const totalDeducted = nextCost + reworkCost;
        const updated = next.productions.map((x, i) =>
          i === idx
            ? {
                ...x,
                hoursLeft: reworkHours,
                quality: Math.max(0, x.quality + qualityPenalty),
                reworks: x.reworks + 1,
              }
            : x,
        );
        next.cash = Math.max(0, next.cash - reworkCost);
        return log(
          { ...next, productions: updated },
          `⚠️ ${nextStage.label} feilet (sjanse ${successPct.toFixed(1)}%, roll ${roll.toFixed(1)}). ` +
            `Entry-kostnad -$${nextCost}. Rework penalty -$${reworkCost}. ` +
            `Quality ${qualityPenalty}. Ny ventetid ${reworkHours}t. Totalt trukket -$${totalDeducted}.`,
        );
      }

      const qDelta = failed ? -10 : qBonus;
      const flavor = failed
        ? "Vi dytter den ut uansett. Skadekontroll."
        : firstFailProtected
          ? `${nextStage.flavor} (første-fail protection reddet attempten)`
          : nextStage.flavor;
      const roleNote =
        roleInfo.count > 0
          ? ` (${roleInfo.count} i ${role}-rolle, +${Math.round(roleBonus)}%)`
          : ` (⚠️ ingen ${role}-rolle, Q${roleAssignmentMod})`;
      const updated = next.productions.map((x, i) =>
        i === idx
          ? {
              ...x,
              stageIdx: nextIdx,
              hoursLeft: nextHours,
              quality: Math.max(0, Math.min(mods.qualityCap, x.quality + qDelta)),
            }
          : x,
      );
      const prevStageLabel = tier.stages[p.stageIdx].label;
      const nextStageLabel = nextStage.label;
      const qualityAfter = Math.max(0, Math.min(mods.qualityCap, p.quality + qDelta));
      const qImpact = qDelta === 0 ? "Q ±0" : `Q ${qDelta > 0 ? "+" : ""}${Math.round(qDelta)}`;
      const costImpact = `kost -$${nextCost}`;
      return log(
        { ...next, productions: updated },
        `${nextStage.emoji} "${p.title}" ${prevStageLabel} → ${nextStageLabel} (${costImpact}, ${qImpact}, Q${Math.round(qualityAfter)}/${mods.qualityCap}, ${nextHours}t)${roleNote}. ${flavor}`,
      );
    });
  }, []);

  const assignToProduction = useCallback((id: string, girlId: string) => {
    setState((s) => {
      const idx = s.productions.findIndex((p) => p.id === id);
      if (idx === -1) return s;
      const p = s.productions[idx];
      if (p.stageIdx > 1) return log(s, "Casting er låst etter innspilling startet.");
      const target = s.girls.find((x) => x.id === girlId);
      if (!target) return s;
      if (target.mission) return log(s, `${target.name} er opptatt med ${target.mission.label}.`);
      // Design: cooldown blokkerer tildeling til cast (ikke bare utførelse).
      // Dette gjør planlegging konsistent med perform/webcamShow/acceptVisit.
      if (target.busyUntil && target.busyUntil > absHour(s)) {
        return log(s, busyLog(target, s, `cast i "${p.title}"`));
      }
      const has = p.girlIds.includes(girlId);
      const newCast = has ? p.girlIds.filter((x) => x !== girlId) : [...p.girlIds, girlId];
      const newRoles = { ...(p.roles ?? {}) };
      if (has) delete newRoles[girlId];
      else newRoles[girlId] = newRoles[girlId] ?? "shooting";
      return {
        ...s,
        productions: s.productions.map((x, i) =>
          i === idx ? { ...x, girlIds: newCast, roles: newRoles } : x,
        ),
      };
    });
  }, []);

  const setCastRole = useCallback(
    (id: string, girlId: string, role: "casting" | "shooting" | "editing" | "release") => {
      setState((s) => {
        const idx = s.productions.findIndex((p) => p.id === id);
        if (idx === -1) return s;
        const p = s.productions[idx];
        if (!p.girlIds.includes(girlId)) return s;
        // Lock role changes once that stage has already been completed
        const stageDoneIdx = STAGE_ORDER.indexOf(role);
        if (stageDoneIdx >= 0 && p.stageIdx > stageDoneIdx)
          return log(s, `${role}-rollen kan ikke endres — steget er allerede ferdig.`);
        const newRoles = { ...(p.roles ?? {}), [girlId]: role };
        return {
          ...s,
          productions: s.productions.map((x, i) => (i === idx ? { ...x, roles: newRoles } : x)),
        };
      });
    },
    [],
  );
  const assignDistributionDeal = useCallback((productionId: string, dealId: string) => {
    setState((s) => {
      const idx = s.productions.findIndex((p) => p.id === productionId);
      if (idx === -1) return s;
      const p = s.productions[idx];
      if (p.stageIdx !== STAGE_ORDER.length - 1) return log(s, "Deal kan kun settes rett før release.");
      const deal = s.distributionDeals.find((d) => d.id === dealId);
      if (!deal) return s;
      if (!isDealEligibleForProduction(deal, p, s)) return log(s, `Ikke kvalifisert for ${deal.label}.`);
      const updated = s.productions.map((prod, i) => i === idx ? { ...prod, distributionDealId: dealId } : prod);
      return log({ ...s, productions: updated }, `🤝 "${p.title}" tildelt deal: ${deal.label}.`);
    });
  }, []);

  const cancelProduction = useCallback((id: string) => {
    setState((s) => {
      const p = s.productions.find((x) => x.id === id);
      if (!p) return s;
      return log(
        { ...s, productions: s.productions.filter((x) => x.id !== id) },
        `🗑️ "${p.title}" avlyst. Sunk cost.`,
      );
    });
  }, []);

  const archiveProduction = useCallback((id: string) => {
    setState((s) => ({ ...s, productions: s.productions.filter((x) => x.id !== id) }));
  }, []);

  // === GIRL MISSIONS =========================================
  const startMission = useCallback((girlId: string, missionId: string) => {
    setState((s) => {
      const g = s.girls.find((x) => x.id === girlId);
      if (!g) return s;
      if (g.mission) return log(s, `${g.name} er allerede på oppdrag.`);
      // Don't allow if currently cast in an active production
      const inProd = s.productions.some(
        (p) => p.stageIdx < STAGE_ORDER.length && p.girlIds.includes(girlId),
      );
      if (inProd) return log(s, `${g.name} er castet på et prosjekt.`);
      const def = GIRL_MISSIONS.find((m) => m.id === missionId) as MissionDef | undefined;
      if (!def) return s;
      const stat = g[def.statKey];
      if (stat < def.min)
        return log(s, `${g.name} har for lav ${def.statKey} (${stat}/${def.min}).`);
      // STD-blokkering
      if (isBlockedByStd(g, s.day, def.id)) {
        const a = activeSTD(g, s.day)!;
        return log(s, `${a.emoji} ${g.name} kan ikke ta ${def.label} med ${a.name}.`);
      }
      const statBonus = 0.6 + stat / 100; // 0.6x–1.6x
      const loyBonus = 0.85 + g.loyalty / 200; // 0.85x–1.34x
      const stdMult = payoutMult(g, s.day); // 0..1 fra aktiv STD
      const payout = Math.floor(
        def.basePay * statBonus * loyBonus * stdMult * (0.9 + Math.random() * 0.2),
      );
      const rep = def.rep + (stat > 70 ? 1 : 0);
      const endsAt = absHour(s) + def.hours;
      const mission = { id: def.id, label: def.label, payout, rep, endsAt };
      // Risiko: høy-eksponering oppdrag (vip, tour, onlyfans) → STD-roll
      const riskByMission: Record<string, number> = {
        webcam: 0,
        club: 0.04,
        onlyfans: 0.06,
        vip: 0.14,
        tour: 0.1,
      };
      const baseRisk = riskByMission[def.id] ?? 0;
      let next: GameState = {
        ...s,
        girls: s.girls.map((x) =>
          x.id === girlId
            ? {
                ...x,
                mission,
                lastActivity: `${def.emoji} Startet ${def.label}`,
                lastActivityDay: s.day,
              }
            : x,
        ),
      };
      let extraTag = "";
      if (baseRisk > 0) {
        const enc = rollEncounter(next, girlId, baseRisk);
        next = enc.state;
        extraTag = enc.tag;
      }
      return log(
        next,
        `${def.emoji} ${g.name} sendt på ${def.label} (~$${payout}, ${def.hours}t).${extraTag}`,
      );
    });
  }, []);

  const cancelMission = useCallback((girlId: string) => {
    setState((s) => {
      const g = s.girls.find((x) => x.id === girlId);
      if (!g?.mission) return s;
      return log(
        {
          ...s,
          girls: s.girls.map((x) =>
            x.id === girlId
              ? {
                  ...x,
                  mission: undefined,
                  lastActivity: `Avbrøt ${g.mission!.label}`,
                  lastActivityDay: s.day,
                }
              : x,
          ),
        },
        `🚫 ${g.name} hentet hjem. Oppdrag avbrutt.`,
      );
    });
  }, []);

  const upgradeEquipment = useCallback((kind: EquipmentKind) => {
    setState((s) => {
      const lvl = s.equipment[kind];
      if (lvl >= 3) return log(s, `${EQUIPMENT_LABELS[kind].label} er maks oppgradert.`);
      const cost = EQUIPMENT_UPGRADE_COST(lvl, s.studioLevel);
      if (s.cash < cost) return log(s, `${EQUIPMENT_LABELS[kind].label} Lv${lvl + 1}: $${cost}.`);
      return log(
        {
          ...s,
          cash: s.cash - cost,
          equipment: { ...s.equipment, [kind]: lvl + 1 },
        },
        `${EQUIPMENT_LABELS[kind].emoji} ${EQUIPMENT_LABELS[kind].label} → Lv ${lvl + 1}.`,
      );
    });
  }, []);

  // === WEBCAM SHOWS ===========================================
  const webcamShow = useCallback(
    (showId: string, girlId?: string, intensity: Intensity = "standard") => {
      setState((s) => {
        const show = WEBCAM_SHOWS.find((w) => w.id === showId);
        if (!show) return s;
        if (show.level > s.webcamLevel)
          return log(s, `🔒 ${show.label} er låst — oppgrader webcam-rigg.`);
        if (s.cash < show.cost) return log(s, `${show.label}: $${show.cost}.`);
        if (s.stamina < show.hours * 4) return log(s, "For sliten — sov i traileren.");
        if (girlId) {
          const g = s.girls.find((x) => x.id === girlId);
          if (!g) return s;
          const nowAbs = absHour(s);
          if (g.mission) return log(s, `⛔ ${g.name} er opptatt: ${g.mission.label}.`);
          if (g.busyUntil && g.busyUntil > nowAbs) return log(s, busyLog(g, s, show.label));
        }
        const girl = girlId ? s.girls.find((x) => x.id === girlId) : undefined;
        const girlMult = girl ? 1 + (girl.beauty + girl.performance + girl.popularity) / 220 : 1;
        const hustleMult = 1 + s.player.hustle * 0.05;
        const intensityMult = intensity === "chill" ? 0.7 : intensity === "intense" ? 1.45 : 1;
        const stdMult = girl ? payoutMult(girl, s.day) : 1;
        const earned = Math.floor(
          show.basePay *
            girlMult *
            hustleMult *
            intensityMult *
            stdMult *
            (0.85 + Math.random() * 0.3),
        );
        let next = advance(s, show.hours);
        const heat = applyIntensityHeat(0, intensity, "webcam");
        const finalHeat = mitigatedHeatGain(next, heat.total);
        next = {
          ...next,
          cash: next.cash - show.cost + earned,
          reputation: next.reputation + show.rep,
          heatLevel: Math.min(100, next.heatLevel + finalHeat),
        };
        // Toy/intense webcam med jente kan smitte (lav sjanse — ikke fysisk møte, men sett-personell osv.)
        if (girlId && intensity === "intense" && show.id === "toys") {
          const enc = rollEncounter(next, girlId, 0.05);
          next = enc.state;
        }
        if (girlId) {
          const cd = intensityCooldownHours(show.hours, intensity);
          const until = absHour(next) + cd;
          const scene: GalleryScene = {
            id: `${girlId}-webcam-${show.id}-${absHour(next)}`,
            day: next.day,
            title: show.scene,
            kind: `webcam-${show.id}`,
            emoji: show.emoji,
            hue: show.hue,
          };
          next = {
            ...next,
            girls: next.girls.map((g) =>
              g.id === girlId
                ? {
                    ...g,
                    busyUntil: until,
                    gallery: [...(g.gallery ?? []), scene].slice(-40),
                    lastActivity: `${show.emoji} ${show.scene}: +$${earned}`,
                    lastActivityDay: next.day,
                  }
                : g,
            ),
          };
        }
        return log(
          next,
          `${show.emoji} ${show.label}${girl ? ` m/ ${girl.name}` : " (solo)"}: +$${earned}, +${show.rep} rep, +${finalHeat} heat.`,
        );
      });
    },
    [],
  );

  const upgradeWebcamLevel = useCallback(() => {
    setState((s) => {
      if (s.webcamLevel >= WEBCAM_SHOWS.length) return log(s, "Webcam-rigg er maks oppgradert.");
      const cost = WEBCAM_UPGRADE_COST(s.webcamLevel);
      if (s.cash < cost) return log(s, `Oppgradering: $${cost}.`);
      const nextShow = WEBCAM_SHOWS.find((w) => w.level === s.webcamLevel + 1);
      return log(
        { ...s, cash: s.cash - cost, webcamLevel: s.webcamLevel + 1 },
        `📡 Webcam-rigg → Lv ${s.webcamLevel + 1}. ${nextShow ? `Låste opp: ${nextShow.emoji} ${nextShow.label}.` : ""}`,
      );
    });
  }, []);

  // === TRAILER VISITS =========================================
  const acceptVisit = useCallback(
    (visitId: string, girlId?: string, intensity: Intensity = "standard") => {
      setState((s) => {
        const v = VISIT_TYPES.find((x) => x.id === visitId);
        if (!v) return s;
        if (v.level > s.trailerLevel)
          return log(s, `🔒 ${v.label} er låst — oppgrader trailer-tilbudet.`);
        if (s.cash < v.cost) return log(s, `${v.label}: $${v.cost}.`);
        if (s.stamina < v.hours * 4) return log(s, "For sliten — sov i traileren.");
        if (v.needsGirl && !girlId) return log(s, `${v.label} krever en stjerne tilstede.`);
        if (girlId) {
          const g = s.girls.find((x) => x.id === girlId);
          if (!g) return s;
          const nowAbs = absHour(s);
          if (g.mission) return log(s, `⛔ ${g.name} er opptatt: ${g.mission.label}.`);
          if (g.busyUntil && g.busyUntil > nowAbs) return log(s, busyLog(g, s, v.label));
          if (isBlockedByStd(g, s.day, "vip")) {
            const a = activeSTD(g, s.day)!;
            return log(s, `${a.emoji} ${g.name} kan ikke ta ${v.label} med ${a.name}.`);
          }
        }
        const girl = girlId ? s.girls.find((x) => x.id === girlId) : undefined;
        const girlMult = girl ? 1 + (girl.beauty + girl.performance + girl.popularity) / 220 : 1;
        const charisma = 1 + s.player.charisma * 0.05;
        const intMult = intensity === "chill" ? 0.7 : intensity === "intense" ? 1.45 : 1;
        const stdMult = girl ? payoutMult(girl, s.day) : 1;
        const earned = Math.floor(
          v.basePay * girlMult * charisma * intMult * stdMult * (0.85 + Math.random() * 0.3),
        );
        const heat = applyIntensityHeat(v.heat, intensity, "visit");
        let next = advance(s, v.hours);
        const finalHeat = mitigatedHeatGain(next, heat.total);
        next = {
          ...next,
          cash: next.cash - v.cost + earned,
          reputation: next.reputation + v.rep,
          heatLevel: Math.min(100, next.heatLevel + finalHeat),
        };
        // STD-roll på risikable visits ved intense
        if (girlId && v.risky && intensity === "intense") {
          const enc = rollEncounter(next, girlId, 0.09);
          next = enc.state;
        }
        // Cooldown + scene + lastActivity
        if (girlId) {
          const cd = intensityCooldownHours(v.hours, intensity);
          const until = absHour(next) + cd;
          const scene: GalleryScene = {
            id: `${girlId}-visit-${v.id}-${absHour(next)}`,
            day: next.day,
            title: v.scene,
            kind: `visit-${v.id}`,
            emoji: v.emoji,
            hue: v.hue,
          };
          next = {
            ...next,
            girls: next.girls.map((g) =>
              g.id === girlId
                ? {
                    ...g,
                    busyUntil: until,
                    gallery: [...(g.gallery ?? []), scene].slice(-40),
                    lastActivity: `${v.emoji} ${v.scene}: +$${earned}`,
                    lastActivityDay: next.day,
                  }
                : g,
            ),
          };
        }
        return log(
          next,
          `${v.emoji} ${v.label}${girl ? ` m/ ${girl.name}` : ""}: +$${earned}, +${v.rep} rep, +${finalHeat} heat.`,
        );
      });
    },
    [],
  );

  const upgradeTrailerLevel = useCallback(() => {
    setState((s) => {
      const maxLvl = Math.max(...VISIT_TYPES.map((v) => v.level));
      if (s.trailerLevel >= maxLvl) return log(s, "Trailer-tilbudet er maks oppgradert.");
      const cost = VISIT_UPGRADE_COST(s.trailerLevel);
      if (s.cash < cost) return log(s, `Oppgradering: $${cost}.`);
      const newType = VISIT_TYPES.find((v) => v.level === s.trailerLevel + 1);
      return log(
        { ...s, cash: s.cash - cost, trailerLevel: s.trailerLevel + 1 },
        `🛋️ Trailer-tilbud → Lv ${s.trailerLevel + 1}. ${newType ? `Låste opp: ${newType.emoji} ${newType.label}.` : ""}`,
      );
    });
  }, []);

  const advanceTime = useCallback((hours = 1) => {
    setState((s) => {
      if (s.won) return s;
      if (s.day === 1 && s.hour === 8 && s.girls.length === 0) return s; // splash
      const safeHours = Math.max(1, Math.floor(hours));
      const next = advance(s, safeHours);
      return log(next, `⏩ Tid hoppet +${safeHours}t til ${timeStr(next.hour)} (dag ${next.day}).`);
    });
  }, []);

  const endDay = useCallback(() => {
    setState((s) => {
      if (s.won) return s;
      if (s.day === 1 && s.hour === 8 && s.girls.length === 0) return s; // splash
      const remaining = Math.max(1, hoursUntilNextClockTime(absHour(s), 8));
      const next = advance(s, remaining);
      return log(
        next,
        `🌙 Dagen avsluttet (+${remaining}t). Ny morgen: ${timeStr(next.hour)} (dag ${next.day}).`,
      );
    });
  }, []);


  const companyRank = deriveCompanyRank({
    locationLevel: state.locationLevel,
    cash: state.cash,
    reputation: state.reputation,
    studioLevel: state.studioLevel,
    distilleryLevel: state.distilleryLevel,
    totalGirls: state.girls.length,
    releasedProductions: state.productions.filter((p) => p.stageIdx >= STAGE_ORDER.length).length,
  });

  return {
    state,
    loaded,
    companyRank,
    reset,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    exportSave,
    importSave,
    goTo,
    backToMap,
    switchDistrict,
    perform,
    fireGirl,
    trainGirl,
    giftGirl,
    resignGirl,
    upgradeStat,
    hireStaff,
    upgradeStaff,
    startProduction,
    advanceProduction,
    assignToProduction,
    setCastRole,
    assignDistributionDeal,
    cancelProduction,
    archiveProduction,
    startMission,
    cancelMission,
    upgradeEquipment,
    webcamShow,
    upgradeWebcamLevel,
    acceptVisit,
    upgradeTrailerLevel,
    advanceTime,
    endDay,
  };
}
