const TELEMETRY_KEY = "bustville.telemetry.v1";
const TELEMETRY_CAP = 500;

export type TelemetryEvent =
  | { type: "action_use"; at: string; locationId: string; actionId: string; girlId?: string }
  | { type: "lead_gen"; at: string; source: "scout_local"; leadId: string }
  | { type: "recruit_hire"; at: string; source: "casting_board"; recruitId: string }
  | { type: "production_start"; at: string; productionId: string; tierId: string; genreId?: string }
  | {
      type: "production_stage";
      at: string;
      productionId: string;
      fromStage: string;
      toStage: string;
      success: boolean;
      rework: boolean;
    }
  | {
      type: "production_release";
      at: string;
      productionId: string;
      title: string;
      flopped: boolean;
      cashDelta: number;
      reputationDelta: number;
    }
  | { type: "goal_completion"; at: string; goalId: string }
  | { type: "event_choice"; at: string; eventId: string; eventKind: string; choiceId: string }
  | { type: "downtown_unlock"; at: string; via: "district_switch" | "hq_upgrade" };

export function trackTelemetry(event: TelemetryEvent): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const raw = window.localStorage.getItem(TELEMETRY_KEY);
    const parsed = raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
    const next = [...(Array.isArray(parsed) ? parsed : []), event].slice(-TELEMETRY_CAP);
    window.localStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
  } catch {
    // Telemetry must never break gameplay.
  }
}

export function getTelemetrySnapshot(): TelemetryEvent[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(TELEMETRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TelemetryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function exportTelemetry(): { filename: string; json: string } {
  try {
    const events = getTelemetrySnapshot();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return {
      filename: `bustville-telemetry-${stamp}.json`,
      json: JSON.stringify(events, null, 2),
    };
  } catch {
    return { filename: "bustville-telemetry-export-error.json", json: "[]" };
  }
}
