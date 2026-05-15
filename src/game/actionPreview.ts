import { LOCATION_ACTIONS, LOCATION_DEFS, type LocationId } from "@/game/locations";
import { absHour, previewHeat, type GameState, type Intensity } from "@/game/useGame";

export interface ActionPreviewRow {
  label: string;
  value: string;
}

export interface ActionPreview {
  rows: ActionPreviewRow[];
  requirements: string[];
  disabledReason?: string;
}

const CASH_BY_ACTION: Record<
  string,
  { min?: number; max?: number; fixed?: number; cost?: number }
> = {
  webcam: { min: 130, max: 360, cost: 40 },
  visit: { min: 180, max: 450 },
  oddJob: { min: 80, max: 240 },
  sellTrucker: { min: 80, max: 240 },
  brew: { cost: 80 },
  supplies: { cost: 60 },
  gasCondoms: { cost: 80 },
  postFlyer: { cost: 40 },
  buyFilm: { cost: 300 },
  buyCostume: { cost: 240 },
  bookAudition: { cost: 180 },
  openCall: { cost: 500 },
  campaignS: { cost: 300 },
  campaignM: { cost: 800 },
  campaignL: { cost: 2000 },
};

function actionById(locationId: LocationId, actionId: string) {
  return LOCATION_ACTIONS[locationId].find((a) => a.id === actionId);
}

function isLocationOpen(state: GameState, locationId: LocationId) {
  const [open, close] = LOCATION_DEFS[locationId].openHours;
  const hour = absHour(state) % 24;
  return hour >= open && hour < close;
}

export function getActionPreview({
  locationId,
  actionId,
  state,
  intensity = "standard",
}: {
  locationId: LocationId;
  actionId: string;
  state: GameState;
  intensity?: Intensity;
}): ActionPreview {
  const action = actionById(locationId, actionId);
  if (!action) return { rows: [], requirements: [], disabledReason: "Ukjent handling." };

  const staminaCost = action.hours * 4;
  const heat = previewHeat(actionId === "visit" ? 2 : 0, intensity).total;
  const cash = CASH_BY_ACTION[actionId] ?? {};

  const rows: ActionPreviewRow[] = [
    { label: "Tid", value: action.hours > 0 ? `~${action.hours}t` : "Ingen tidsbruk" },
    {
      label: "Stamina",
      value: staminaCost > 0 ? `-${staminaCost}` : "0",
    },
    {
      label: "Cash",
      value:
        typeof cash.cost === "number"
          ? `-$${cash.cost}`
          : typeof cash.fixed === "number"
            ? `$${cash.fixed}`
            : typeof cash.min === "number" && typeof cash.max === "number"
              ? `$${cash.min}–$${cash.max} (RNG)`
              : "Varierer",
    },
    {
      label: "Rep",
      value: ["webcam", "visit", "network", "drink"].includes(actionId)
        ? "+1 til +3"
        : actionId === "snitch"
          ? "-1"
          : "0 / situasjon",
    },
    {
      label: "Heat",
      value:
        actionId === "visit"
          ? `+${heat} (risiko)`
          : actionId === "layLow"
            ? "Senkes"
            : heat > 0
              ? `+${heat}`
              : "Lav",
    },
  ];

  const requirements: string[] = [];
  if (cash.cost) requirements.push(`Krever minst $${cash.cost}`);
  if (staminaCost > 0) requirements.push(`Krever ${staminaCost} stamina`);
  if (["sellLocal"].includes(actionId)) requirements.push("Krever moonshine på lager");
  if (["buyFilm"].includes(actionId)) requirements.push("Output: +5 filmstock");
  if (["buyCostume"].includes(actionId)) requirements.push("Output: +3 kostymer");
  if (["bookAudition"].includes(actionId)) requirements.push("Output: +1 audition-voucher");
  if (["postFlyer"].includes(actionId)) requirements.push("Output: +1 casting lead");

  let disabledReason: string | undefined;
  if (!isLocationOpen(state, locationId)) disabledReason = "Stengt nå (feil tidsvindu).";
  else if (cash.cost && state.cash < cash.cost) disabledReason = `Mangler cash ($${cash.cost}).`;
  else if (staminaCost > 0 && state.stamina < staminaCost) disabledReason = "For lite stamina.";
  else if (actionId === "sellLocal" && state.moonshine < 1) disabledReason = "Mangler moonshine.";
  else if (actionId === "sellTrucker" && state.heatLevel >= 90)
    disabledReason = "For høy heat akkurat nå.";
  else if ((actionId === "webcam" || actionId === "visit") && state.girls.length === 0)
    disabledReason = "Mangler performer i roster.";

  return { rows, requirements, disabledReason };
}
