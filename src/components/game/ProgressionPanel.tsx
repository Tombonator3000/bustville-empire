import { deriveProgressionSnapshot } from "@/game/progression";
import type { GameState } from "@/game/useGame";

export function ProgressionPanel({ state }: { state: GameState }) {
  const snapshot = deriveProgressionSnapshot(state);

  return (
    <section className="mx-auto mt-2 w-full max-w-7xl px-4">
      <div className="rounded-lg border border-border/60 bg-card/80 p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Progression
            </p>
            <h2 className="font-display text-sm uppercase tracking-wider text-accent">
              {snapshot.currentPhaseLabel}
            </h2>
          </div>
          <span className="rounded border border-primary/50 bg-primary/15 px-2 py-1 font-mono text-primary">
            Next: {snapshot.nextMajorUnlock}
          </span>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
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
                {reason.deltas.heat > 0 && <li>Heat too high: +{reason.deltas.heat}% over cap</li>}
                {reason.deltas.milestone.length > 0 && (
                  <li>Milestone missing: {reason.deltas.milestone.join(", ")}</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded border border-border/40 bg-background/30 p-2">
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
    </section>
  );
}
