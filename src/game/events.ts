import type { GameState } from "./useGame";

export type PendingEventId =
  | "rival_billboard"
  | "sheriff_pressure"
  | "talent_request"
  | "supply_shortage"
  | "price_dump";

export interface EventChoiceEffect {
  cash?: number;
  reputation?: number;
  heatLevel?: number;
  stamina?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  summary: string;
  effect: EventChoiceEffect;
}

export interface PendingEvent {
  id: string;
  kind: PendingEventId;
  title: string;
  description: string;
  choices: EventChoice[];
  createdDay: number;
  expiresDay: number;
}

const EVENT_DEFS: Array<Omit<PendingEvent, "id" | "createdDay" | "expiresDay">> = [
  {
    kind: "rival_billboard",
    title: "📣 Rival billboard campaign",
    description: "Neon Fox kjøper byens beste billboard-plass.",
    choices: [
      { id: "counter", label: "Counter-campaign", summary: "Svar med egen kampanje", effect: { cash: -250, reputation: 3 } },
      { id: "ignore", label: "Ignore it", summary: "Spar cash, ta liten hit", effect: { reputation: -2 } },
    ],
  },
  {
    kind: "sheriff_pressure",
    title: "🚓 Sheriff pressure",
    description: "Sheriffen varsler økt kontroll i nabolaget.",
    choices: [
      { id: "legal", label: "Clean paperwork", summary: "Bruk tid/penger på rydding", effect: { cash: -180, heatLevel: -10 } },
      { id: "risk", label: "Ride the risk", summary: "Spill videre med høyere heat", effect: { heatLevel: 8 } },
    ],
  },
  {
    kind: "talent_request",
    title: "⭐ Talent request",
    description: "En kjendispromotør vil booke en av stjernene dine.",
    choices: [
      { id: "accept", label: "Accept request", summary: "Rask gevinst, litt slitasje", effect: { cash: 320, stamina: -12 } },
      { id: "decline", label: "Decline politely", summary: "Behold driftstempo", effect: { reputation: -1 } },
    ],
  },
  {
    kind: "supply_shortage",
    title: "📦 Supply shortage",
    description: "Leverandøren mangler filmstock og logistikk stopper opp.",
    choices: [
      { id: "pay", label: "Pay premium", summary: "Sikre leveranse nå", effect: { cash: -220, reputation: 1 } },
      { id: "delay", label: "Delay shoots", summary: "Utsett planer", effect: { stamina: -8, reputation: -2 } },
    ],
  },
  {
    kind: "price_dump",
    title: "💸 Rival price dump",
    description: "Rivalene dumper priser i markedet denne uka.",
    choices: [
      { id: "match", label: "Match prices", summary: "Hold andel, lavere margin", effect: { cash: -200, reputation: 2 } },
      { id: "premium", label: "Stay premium", summary: "Beskytt cash, mist litt moment", effect: { reputation: -2 } },
    ],
  },
];

export function maybeGenerateEvent(state: GameState): PendingEvent | null {
  if (Math.random() > 0.12 || state.activeEvents.length >= 3) return null;
  const def = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)];
  return {
    ...def,
    id: `${def.kind}-${state.day}-${Math.floor(Math.random() * 9999)}`,
    createdDay: state.day,
    expiresDay: state.day + 2,
  };
}

export function applyEventChoice(state: GameState, event: PendingEvent, choiceId: string): { state: GameState; summary: string } {
  const choice = event.choices.find((c) => c.id === choiceId) ?? event.choices[0];
  const next: GameState = {
    ...state,
    cash: Math.max(0, state.cash + (choice.effect.cash ?? 0)),
    reputation: Math.max(0, state.reputation + (choice.effect.reputation ?? 0)),
    heatLevel: Math.max(0, Math.min(100, state.heatLevel + (choice.effect.heatLevel ?? 0))),
    stamina: Math.max(0, Math.min(state.maxStamina, state.stamina + (choice.effect.stamina ?? 0))),
    activeEvents: state.activeEvents.filter((e) => e.id !== event.id),
  };
  return { state: next, summary: `🧾 ${event.title}: ${choice.label} (${choice.summary}).` };
}

export function expireEvents(state: GameState): { state: GameState; summaries: string[] } {
  const expired = state.activeEvents.filter((e) => state.day > e.expiresDay);
  if (!expired.length) return { state, summaries: [] };
  return {
    state: { ...state, activeEvents: state.activeEvents.filter((e) => state.day <= e.expiresDay) },
    summaries: expired.map((e) => `⌛ ${e.title} expired without response.`),
  };
}
