import { useEffect, useState, useCallback } from "react";
import {
  LOCATIONS, ARCHETYPES, FIRST_NAMES, LAST_NAMES,
  RANDOM_EVENTS, CONTENT_TYPES,
  type Archetype, type Girl,
} from "./data";

export interface PlayerStats {
  charisma: number;
  hustle: number;
  business: number;
  lust: number;
}

export interface GameState {
  cash: number;
  reputation: number;
  stamina: number;
  maxStamina: number;
  day: number;
  locationLevel: number;
  moonshine: number;
  backlog: number;
  player: PlayerStats;
  girls: Girl[];
  log: string[];
  won: boolean;
}

const INITIAL: GameState = {
  cash: 350,
  reputation: 2,
  stamina: 100,
  maxStamina: 100,
  day: 1,
  locationLevel: 1,
  moonshine: 2,
  backlog: 0,
  player: { charisma: 3, hustle: 3, business: 1, lust: 4 },
  girls: [],
  log: [
    "Velkommen til Bustville, Alabama. Lukten av rust og muligheter.",
    "Du eier én trailer, $350, og en uforklarlig selvtillit.",
  ],
  won: false,
};

const STORAGE_KEY = "bustville-empire-v1";
const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const ri = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export function genGirl(playerCharisma: number, locLevel: number): Girl {
  const tier = Math.min(5, Math.floor(locLevel + Math.random() * 2));
  const pool: Archetype[] = locLevel >= 4
    ? [...ARCHETYPES]
    : ARCHETYPES.filter((a) => a !== "Exotic Import");
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

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const log = (s: GameState, msg: string): GameState => ({ ...s, log: [msg, ...s.log].slice(0, 40) });

  const reset = useCallback(() => setState(INITIAL), []);

  const doContent = useCallback((contentId: string, girlId?: string) => {
    setState((s) => {
      const ct = CONTENT_TYPES.find((c) => c.id === contentId);
      if (!ct) return s;
      if (s.locationLevel < ct.minLevel) return log(s, `${ct.name} krever Level ${ct.minLevel}.`);
      if (s.cash < ct.cost) return log(s, `Trenger $${ct.cost} for ${ct.name}.`);
      if (s.stamina < ct.stamina) return log(s, "For sliten. Sov, eller drikk moonshine.");
      const girl = s.girls.find((g) => g.id === girlId);
      const girlMult = girl ? 1 + (girl.beauty + girl.performance + girl.popularity) / 220 : 1;
      const hustleMult = 1 + s.player.hustle * 0.05;
      const earn = Math.floor(ct.basePay * girlMult * hustleMult * (0.85 + Math.random() * 0.3));
      const rep = ct.repGain + (girl ? Math.floor(girl.popularity / 30) : 0);
      let next = {
        ...s,
        cash: s.cash - ct.cost + earn,
        stamina: s.stamina - ct.stamina,
        reputation: s.reputation + rep,
        backlog: s.backlog + (ct.id === "feature" || ct.id === "glamour" ? 1 : 0),
      };
      // bumps
      if (girl) {
        next.girls = s.girls.map((g) => g.id === girl.id ? { ...g, popularity: Math.min(99, g.popularity + 2), loyalty: Math.min(99, g.loyalty + 1) } : g);
      }
      const who = girl ? ` med ${girl.name}` : "";
      return log(next, `🎬 ${ct.name}${who}: +$${earn}, +${rep} rep. ${ct.flavor}`);
    });
  }, []);

  const sellMoonshine = useCallback(() => {
    setState((s) => {
      if (s.moonshine <= 0) return log(s, "Tom for moonshine. Destilleriet hviler.");
      const earn = 140 + ri(0, 80) + s.player.hustle * 10;
      return log({ ...s, moonshine: s.moonshine - 1, cash: s.cash + earn },
        `🥃 Solgt en flaske moonshine til $${earn}. Sheriff Buck ser fortsatt en annen vei.`);
    });
  }, []);

  const brewMoonshine = useCallback(() => {
    setState((s) => {
      if (s.cash < 80) return log(s, "Trenger $80 til mais, gjær og rør.");
      if (s.stamina < 12) return log(s, "For sliten til å destillere.");
      return log({ ...s, cash: s.cash - 80, stamina: s.stamina - 12, moonshine: s.moonshine + 3 },
        "🔥 Brygget 3 nye flasker. Smaker som maling. Selger som varmt hvetebrød.");
    });
  }, []);

  const scoutGirl = useCallback(() => {
    setState((s) => {
      const cost = 120 + s.locationLevel * 60;
      if (s.cash < cost) return log(s, `Scouting koster $${cost}.`);
      if (s.girls.length >= 6) return log(s, "Maks 6 stjerner. Sparken noen først.");
      const g = genGirl(s.player.charisma, s.locationLevel);
      return log({ ...s, cash: s.cash - cost, girls: [...s.girls, g] },
        `💋 Signerte ${g.name} (${g.archetype}). Bea ${g.beauty} / Perf ${g.performance} / Pop ${g.popularity}.`);
    });
  }, []);

  const fireGirl = useCallback((id: string) => {
    setState((s) => {
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      return log({ ...s, girls: s.girls.filter((x) => x.id !== id) },
        `👋 ${g.name} ble sparket. Hun tok ringlyset med seg.`);
    });
  }, []);

  const trainGirl = useCallback((id: string) => {
    setState((s) => {
      if (s.cash < 200) return log(s, "Trening koster $200.");
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      const stat = ["beauty", "performance", "popularity"][ri(0, 2)] as keyof Girl;
      const inc = ri(2, 6);
      return log({
        ...s, cash: s.cash - 200,
        girls: s.girls.map((x) => x.id === id ? { ...x, [stat]: Math.min(99, (x as any)[stat] + inc) } : x),
      }, `🏋️ ${g.name} trente ${stat}. +${inc}.`);
    });
  }, []);

  const giftGirl = useCallback((id: string) => {
    setState((s) => {
      if (s.cash < 150) return log(s, "Gaver koster $150.");
      const g = s.girls.find((x) => x.id === id);
      if (!g) return s;
      return log({
        ...s, cash: s.cash - 150,
        girls: s.girls.map((x) => x.id === id ? { ...x, loyalty: Math.min(99, x.loyalty + ri(6, 14)) } : x),
      }, `🎁 Du ga ${g.name} en gave. Lojalitet opp.`);
    });
  }, []);

  const upgradeStat = useCallback((stat: keyof PlayerStats) => {
    setState((s) => {
      const cost = 300 + s.player[stat] * 250;
      if (s.cash < cost) return log(s, `Trenger $${cost} til å oppgradere ${stat}.`);
      return log({ ...s, cash: s.cash - cost, player: { ...s.player, [stat]: s.player[stat] + 1 } },
        `📈 ${stat} +1.`);
    });
  }, []);

  const throwParty = useCallback(() => {
    setState((s) => {
      const cost = 600 + s.locationLevel * 200;
      if (s.cash < cost) return log(s, `Fest koster $${cost}.`);
      if (s.moonshine < 2) return log(s, "Trenger minst 2 moonshine til en skikkelig fest.");
      const repGain = 8 + s.locationLevel * 2 + s.player.charisma;
      return log({
        ...s, cash: s.cash - cost, moonshine: s.moonshine - 2, reputation: s.reputation + repGain,
        girls: s.girls.map((g) => ({ ...g, loyalty: Math.min(99, g.loyalty + 5), popularity: Math.min(99, g.popularity + 3) })),
      }, `🎉 EPIC PARTY! +${repGain} rep. Jentene elsker deg. Naboene ringer politiet.`);
    });
  }, []);

  const upgradeLocation = useCallback(() => {
    setState((s) => {
      const next = LOCATIONS[s.locationLevel];
      if (!next) return log(s, "Du er allerede på toppen. Imperium oppnådd.");
      if (s.cash < next.unlockCash) return log(s, `Trenger $${next.unlockCash} til oppgradering.`);
      if (s.reputation < next.unlockRep) return log(s, `Trenger ${next.unlockRep} rep.`);
      return log({ ...s, cash: s.cash - next.unlockCash, locationLevel: next.level, maxStamina: s.maxStamina + 10 },
        `🏆 OPPGRADERT til ${next.name}! ${next.tagline}`);
    });
  }, []);

  const endWeek = useCallback(() => {
    setState((s) => {
      let next = { ...s, day: s.day + 7, stamina: Math.min(s.maxStamina, s.stamina + 70) };
      // pay salaries
      const wages = s.girls.reduce((a, g) => a + g.salary, 0);
      next.cash -= wages;
      // backlog royalties
      const royalty = s.backlog * 180;
      next.cash += royalty;
      // random event
      const pool = RANDOM_EVENTS.filter((e) => !e.minLevel || s.locationLevel >= e.minLevel);
      const ev = rand(pool);
      if (ev.cash) next.cash += ev.cash;
      if (ev.rep) next.reputation = Math.max(0, next.reputation + ev.rep);
      if (ev.stamina) next.stamina = Math.max(0, Math.min(next.maxStamina, next.stamina + ev.stamina));
      next = log(next, `📅 Uke ferdig. Lønn: -$${wages}. Royalties: +$${royalty}.`);
      next = log(next, ev.text);
      // win?
      if (next.locationLevel >= 5 && next.cash >= 250000 && next.reputation >= 140) {
        next.won = true;
        next = log(next, "👑 DU ER PORN KING OF THE SOUTH! Bustville Empire er din!");
      }
      return next;
    });
  }, []);

  return {
    state, loaded, reset,
    doContent, sellMoonshine, brewMoonshine,
    scoutGirl, fireGirl, trainGirl, giftGirl,
    upgradeStat, throwParty, upgradeLocation, endWeek,
  };
}
