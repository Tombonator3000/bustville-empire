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

        <h3 className="mt-4 font-display text-sm uppercase tracking-widest text-accent">Stats</h3>
        <div className="mt-2 space-y-1.5">
          {stats.map((s) => {
            const cost = 300 + state.player[s] * 250;
            return (
              <button key={s} onClick={() => onUpgrade(s)}
                className="flex w-full items-center justify-between rounded-md bg-secondary/50 px-2.5 py-2 text-left hover:bg-secondary">
                <span className="capitalize">{s}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-bold text-accent">{state.player[s]}</span>
                  <span className="text-[10px] text-muted-foreground">+1 ${cost}</span>
                </span>
              </button>
            );
          })}
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Imperium</h3>
        <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-2.5">
          <p className="text-sm font-bold">Lv {loc.level} · {loc.name}</p>
          <p className="text-[11px] text-muted-foreground">{loc.tagline}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Oppgrader bolig fra <span className="text-accent">Din Trailer</span>.
          </p>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Win Condition</h3>
        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px]">
          <div className="rounded bg-secondary/40 p-2">
            <div className="text-muted-foreground">Level</div>
            <div className="font-mono font-bold">{state.locationLevel}/5</div>
          </div>
          <div className="rounded bg-secondary/40 p-2">
            <div className="text-muted-foreground">Cash</div>
            <div className="font-mono font-bold">${state.cash}/<span className="text-muted-foreground">{winCash}</span></div>
          </div>
          <div className="rounded bg-secondary/40 p-2">
            <div className="text-muted-foreground">Rep</div>
            <div className="font-mono font-bold">{state.reputation}/{winRep}</div>
          </div>
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Rival Watch</h3>
        <div className="mt-2 space-y-1.5">
          {state.rivals.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-secondary/30 p-2">
              <p className="text-xs font-semibold">{r.emoji} {r.name}</p>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[11px]">
                <span>Share <b>{Math.round(r.share)}%</b></span>
                <span>Momentum <b>{r.momentum > 0 ? "+" : ""}{r.momentum}</b></span>
                <span>Δ <b>{r.lastDelta > 0 ? "+" : ""}{r.lastDelta.toFixed(1)}%</b></span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.weeklyMove}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Weekly Rival Digest</h3>
        <div className="mt-2 space-y-1 text-[11px]">
          {state.rivalDigest.map((line, i) => (
            <p key={`${i}-${line.slice(0, 8)}`} className="rounded bg-secondary/40 px-2 py-1">{line}</p>
          ))}
        </div>

        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">Full Logg</h3>
        <div className="mt-2 max-h-72 space-y-0.5 overflow-y-auto text-xs">
          {state.log.map((line, i) => (
            <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
