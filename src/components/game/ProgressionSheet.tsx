import { X } from "lucide-react";
import {
  DOWNTOWN_UNLOCK_GATE,
  deriveProgressionSnapshot,
  getDowntownUnlockDeltas,
} from "@/game/progression";
import type { GameState } from "@/game/useGame";

export function ProgressionSheet({ state, onClose }: { state: GameState; onClose: () => void }) {
  const snapshot = deriveProgressionSnapshot(state);
  const downtown = getDowntownUnlockDeltas(state);
  const checks = [
    {
      label: `Cash $${state.cash.toLocaleString()} / $${DOWNTOWN_UNLOCK_GATE.cash.toLocaleString()}`,
      done: downtown.cash === 0,
    },
    {
      label: `Rep ${state.reputation} / ${DOWNTOWN_UNLOCK_GATE.reputation}`,
      done: downtown.reputation === 0,
    },
    { label: "First Hit milestone", done: downtown.milestone.length === 0 },
    {
      label: `Heat ≤ ${DOWNTOWN_UNLOCK_GATE.maxHeat}% (current ${state.heatLevel}%)`,
      done: downtown.heat === 0,
    },
  ];
  const nextStep =
    downtown.cash > 0
      ? "Earn cash through quickies, webcam shows or odd jobs."
      : downtown.reputation > 0
        ? "Run better productions or local networking."
        : downtown.milestone.length > 0
          ? "Improve quality and produce more releases."
          : downtown.heat > 0
            ? "Lay low and use safer actions to reduce heat."
            : "Downtown gate is ready. Use the map exit to travel.";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-20">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Progression
            </p>
            <h2 className="font-display text-lg uppercase tracking-wider text-accent">
              {snapshot.currentPhaseLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-background/70 p-1.5 hover:border-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-4 text-xs">
          <div className="mb-3 rounded border border-primary/40 bg-primary/10 p-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Next Unlock
            </p>
            <p className="font-semibold text-primary">{snapshot.nextMajorUnlock}</p>
            <div className="mt-2 space-y-1">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={`rounded border px-2 py-1 ${check.done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-border/50 bg-background/40"}`}
                >
                  {check.done ? "✅" : "⬜"} {check.label}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-accent">Next best step: {nextStep}</p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {snapshot.blockedReasons.map((reason) => (
              <div key={reason.id} className="rounded border border-border/50 bg-background/40 p-2">
                <p className="font-semibold">🔒 {reason.label}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {reason.requirementText.join(" · ")}
                </p>
                <ul className="mt-1 space-y-0.5 font-mono text-[10px]">
                  {reason.deltas.cash > 0 && (
                    <li>Cash short: ${reason.deltas.cash.toLocaleString()}</li>
                  )}
                  {reason.deltas.reputation > 0 && <li>Rep short: {reason.deltas.reputation}</li>}
                  {reason.deltas.heat > 0 && (
                    <li>Heat too high: +{reason.deltas.heat}% over cap</li>
                  )}
                  {reason.deltas.milestone.length > 0 && (
                    <li>Milestone missing: {reason.deltas.milestone.join(", ")}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded border border-border/40 bg-background/30 p-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Suggested actions
            </p>
            <ul className="mt-1 list-disc pl-4 text-[11px]">
              {snapshot.suggestedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
