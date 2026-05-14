import { LOCATIONS } from "@/game/data";
import type { GameState } from "@/game/useGame";

export function StatsSheet({ state, onClose, onUpgrade }: {
  state: GameState; onClose: () => void;
  onUpgrade: (s: "charisma" | "hustle" | "business" | "lust") => void;
}) {
  const stats: Array<"charisma" | "hustle" | "business" | "lust"> = ["charisma", "hustle", "business", "lust"];
  const loc = LOCATIONS[state.locationLevel - 1];
  const winRep = 140, winCash = 250000;
  return (
    <div className="fixed inset-0 z-40 flex justify-start bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-sm overflow-y-auto border-r border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase neon-text">The Boss</h2>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">Lukk</button>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Rival Watch</h3>
        <div className="mt-2 space-y-1.5">
          {state.weeklyRivalSummary.rivals.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-secondary/30 p-2">
              <p className="text-xs font-semibold">{r.emoji} {r.name}</p>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[11px]">
                <span title="Market share moves from PR wins, legal pressure, and stronger distribution.">Share <b>{r.sharePct}%</b></span>
                <span>Weekly action</span>
                <span title="Positive means they gained momentum this week.">Δ <b>{r.deltaPct > 0 ? "+" : ""}{r.deltaPct.toFixed(1)}%</b></span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.weeklyAction}</p>
            </div>
          ))}
          {!!state.weeklyRivalSummary.effects.length && (
            <div className="rounded bg-secondary/40 p-2 text-[11px] text-muted-foreground">
              {state.weeklyRivalSummary.effects.map((effect, idx) => <p key={`${idx}-${effect}`}>{effect}</p>)}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground" title="Your share grows when rivals lose share.">Player share trend: <b>{state.weeklyRivalSummary.playerMarketSharePct}%</b> (week {state.weeklyRivalSummary.week})</p>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Distribution Panel</h3>
        <div className="mt-2 space-y-1.5">
          {state.distributionSummary.map((deal) => (
            <div key={deal.id} className="rounded border border-border bg-secondary/30 p-2 text-[11px]">
              <p className="font-semibold">{deal.label} · {deal.royaltyPct}%</p>
              <p className="text-muted-foreground">{deal.terms}</p>
              <p title="Weeks remaining only decreases while deal is active.">{deal.isActive ? `Active · ${deal.weeksRemaining}w left` : "Inactive"}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Royalties Summary</h3>
        <div className="mt-2 rounded border border-border bg-secondary/30 p-2 text-[11px]">
          <p>Week {state.weeklyRoyaltyBreakdown.week} payout</p>
          <p>Catalog base: <b>${state.weeklyRoyaltyBreakdown.baseCatalogPayout}</b></p>
          <p>Deal royalties: <b>${state.weeklyRoyaltyBreakdown.dealPayoutTotal}</b></p>
          {state.weeklyRoyaltyBreakdown.byTitle.map((row) => (
            <p key={`${row.title}-${row.dealLabel}`} className="text-muted-foreground">{row.title} via {row.dealLabel}: +${row.payout} ({row.royaltyPct}%)</p>
          ))}
        </div>

      </div>
    </div>
  );
}
