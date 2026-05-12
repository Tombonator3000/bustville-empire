/** Dramatiske hendelser mellom stjerner — rulles ukentlig. */
import type { Girl } from "./data";

export interface DramaResult {
  girls: Girl[];
  cashDelta: number;
  repDelta: number;
  heatDelta: number;
  log: string;
}

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DRAMAS = [
  // [type, weight]
  "catfight",
  "jealousy",
  "scandal",
  "romance",
  "paparazzi",
  "addiction",
] as const;

export function rollDrama(girls: Girl[], nowAbs: number): DramaResult | null {
  if (girls.length < 2) return null;
  if (Math.random() > 0.55) return null; // ~55% sjanse per uke

  const type = pick([...DRAMAS]);
  const [a, b] = (() => {
    const shuffled = [...girls].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  })();

  switch (type) {
    case "catfight": {
      const dmg = ri(6, 14);
      return {
        girls: girls.map(g => g.id === a.id || g.id === b.id
          ? { ...g, loyalty: Math.max(0, g.loyalty - dmg), popularity: Math.min(99, g.popularity + 2) }
          : g),
        cashDelta: 0, repDelta: -2, heatDelta: 3,
        log: `💥 Catfight! ${a.name} og ${b.name} havnet i håra på hverandre på et nattklubb. Begge −${dmg} loy, +2 pop. Rep −2.`,
      };
    }
    case "jealousy": {
      const raise = ri(150, 400);
      return {
        girls: girls.map(g => g.id === a.id ? { ...g, loyalty: Math.min(99, g.loyalty + 4) } : g),
        cashDelta: -raise, repDelta: 0, heatDelta: 0,
        log: `😤 ${a.name} så at ${b.name} fikk større rolle. Krevde $${raise} ekstra. Du betalte. +4 loy.`,
      };
    }
    case "scandal": {
      return {
        girls: girls.map(g => g.id === a.id ? { ...g, popularity: Math.min(99, g.popularity + 8), loyalty: Math.max(0, g.loyalty - 4) } : g),
        cashDelta: 0, repDelta: -3, heatDelta: 8,
        log: `📰 Skandale! ${a.name} ble tatt på fersk gjerning i en limousine. +8 pop, −4 loy. Heat +8.`,
      };
    }
    case "romance": {
      return {
        girls: girls.map(g => g.id === a.id || g.id === b.id
          ? { ...g, loyalty: Math.min(99, g.loyalty + 8) } : g),
        cashDelta: 0, repDelta: 2, heatDelta: 0,
        log: `💕 ${a.name} og ${b.name} ble sett hånd-i-hånd ut av studio. Folk elsker det. Begge +8 loy, +2 rep.`,
      };
    }
    case "paparazzi": {
      const $ = ri(200, 600);
      return {
        girls: girls.map(g => g.id === a.id ? { ...g, popularity: Math.min(99, g.popularity + 5) } : g),
        cashDelta: $, repDelta: 1, heatDelta: 0,
        log: `📸 Paparazzi tok bilder av ${a.name} på rød løper. Tabloid betalte $${$}. +5 pop.`,
      };
    }
    case "addiction": {
      const restHours = ri(36, 72);
      return {
        girls: girls.map(g => g.id === a.id
          ? { ...g, busyUntil: Math.max(g.busyUntil ?? 0, nowAbs + restHours), performance: Math.max(10, g.performance - 5) }
          : g),
        cashDelta: 0, repDelta: -1, heatDelta: 2,
        log: `🍾 ${a.name} sporet av i et white-powder-helvete. Borte i ${restHours}t. Perf −5, rep −1.`,
      };
    }
  }
  return null;
}
