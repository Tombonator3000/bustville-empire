/** Helse- og STD-system. Risikable scener kan smitte stjerner; condoms beskytter. */

export type STDId = "chlamydia" | "gonorrhea" | "herpes" | "hiv";

export interface STDState {
  id: STDId;
  contractedDay: number;
  /** Hvis satt: stadiet er undertrykt (steroider) frem til denne dagen. */
  suppressedUntilDay?: number;
}

export interface STDDef {
  id: STDId;
  name: string;
  emoji: string;
  curable: boolean;
  effect: string;
  /** Multiplier på all payout fra jentas jobber. */
  payoutMult: number;
  /** Mission-id'er hun ikke kan ta. */
  blocksMissions: string[];
  /** Sjanse-vekt når en STD blir trukket etter en mislykket roll. */
  weight: number;
}

export const STDS: Record<STDId, STDDef> = {
  chlamydia: {
    id: "chlamydia", name: "Chlamydia", emoji: "🦠",
    curable: true, effect: "Lett betennelse — −15% payout.",
    payoutMult: 0.85, blocksMissions: [], weight: 45,
  },
  gonorrhea: {
    id: "gonorrhea", name: "Gonorrhea", emoji: "💢",
    curable: true, effect: "−20% payout, kan ikke ta VIP-eskorte.",
    payoutMult: 0.8, blocksMissions: ["vip"], weight: 35,
  },
  herpes: {
    id: "herpes", name: "Herpes", emoji: "🤢",
    curable: false, effect: "Halv payout, sterkt loyalty-tap.",
    payoutMult: 0.5, blocksMissions: [], weight: 16,
  },
  hiv: {
    id: "hiv", name: "HIV", emoji: "☣️",
    curable: false, effect: "Kan ikke jobbe i det hele tatt.",
    payoutMult: 0, blocksMissions: ["webcam","club","onlyfans","vip","tour"], weight: 4,
  },
};

const TOTAL_WEIGHT = Object.values(STDS).reduce((a, s) => a + s.weight, 0);

/** Trekker en STD basert på vekter. */
function pickSTD(): STDId {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of Object.values(STDS)) {
    r -= s.weight;
    if (r <= 0) return s.id;
  }
  return "chlamydia";
}

/**
 * Roll en risikabel scene.
 * @param baseChance Sjanse for STD når det IKKE er condom (0..1). Typisk 0.04–0.18.
 * @returns ny STD-id, eller null hvis trygt.
 */
export function rollSTD(baseChance: number): STDId | null {
  if (Math.random() > baseChance) return null;
  return pickSTD();
}

/** Effektiv STD — null hvis suppressed eller hvis ingen STD. */
export function activeSTD(g: { std?: STDState }, currentDay: number): STDDef | null {
  if (!g.std) return null;
  if (g.std.suppressedUntilDay && currentDay < g.std.suppressedUntilDay) return null;
  return STDS[g.std.id];
}

/** Sann hvis et oppdrag/aktivitet er blokkert av en aktiv STD. */
export function isBlockedByStd(g: { std?: STDState }, currentDay: number, missionId: string): boolean {
  const a = activeSTD(g, currentDay);
  if (!a) return false;
  return a.blocksMissions.includes(missionId);
}

/** Multiplier på payout (1 hvis frisk). */
export function payoutMult(g: { std?: STDState }, currentDay: number): number {
  const a = activeSTD(g, currentDay);
  return a ? a.payoutMult : 1;
}
