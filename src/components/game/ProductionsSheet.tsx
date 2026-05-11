import { TIERS, STAGE_ORDER, getTier, type Production } from "@/game/productions";
import type { GameState } from "@/game/useGame";
import type { Girl } from "@/game/data";

interface Props {
  state: GameState;
  onClose: () => void;
  onStart: (tierId: string, girlIds: string[]) => void;
  onAdvance: (id: string) => void;
  onAssign: (id: string, girlId: string) => void;
  onCancel: (id: string) => void;
}

export function ProductionsSheet({ state, onClose, onStart, onAdvance, onAssign, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase neon-text">Produksjon</h2>
            <p className="text-xs text-muted-foreground">Briefing → Casting → Innspilling → Redigering → Utgivelse.</p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">Lukk</button>
        </div>

        {/* New project */}
        <h3 className="mt-4 font-display text-sm uppercase tracking-widest text-accent">Start nytt prosjekt</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TIERS.map((t) => {
            const locked = state.locationLevel < t.minLevel;
            const cost = t.stages[0].cost;
            return (
              <button
                key={t.id}
                disabled={locked || state.cash < cost}
                onClick={() => onStart(t.id, [])}
                className={`rounded-lg border p-2.5 text-left transition ${
                  locked
                    ? "border-destructive/40 bg-destructive/10 opacity-50 cursor-not-allowed"
                    : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t.name}</span>
                  <span className="text-[10px] text-accent">~${t.basePayout.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t.description}</p>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {locked ? `🔒 Lv ${t.minLevel}` : `Briefing: $${cost} · ${t.stages.reduce((a, s) => a + s.hours, 0)}t total`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active productions */}
        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">
          Aktive produksjoner ({state.productions.filter((p) => p.stageIdx < STAGE_ORDER.length).length})
        </h3>
        <div className="mt-2 space-y-3">
          {state.productions.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Ingen prosjekter. Start ditt første over.
            </p>
          )}
          {state.productions.map((p) => (
            <ProductionCard key={p.id} p={p} girls={state.girls}
              onAdvance={onAdvance} onAssign={onAssign} onCancel={onCancel} cash={state.cash} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductionCard({ p, girls, onAdvance, onAssign, onCancel, cash }: {
  p: Production; girls: Girl[]; cash: number;
  onAdvance: (id: string) => void;
  onAssign: (id: string, gid: string) => void;
  onCancel: (id: string) => void;
}) {
  const tier = getTier(p.tierId)!;
  const isDone = p.stageIdx >= STAGE_ORDER.length;
  const currentStage = isDone ? null : tier.stages[p.stageIdx];
  const nextStage = !isDone && p.stageIdx < STAGE_ORDER.length - 1 ? tier.stages[p.stageIdx + 1] : null;
  const canAdvance = !isDone && p.hoursLeft <= 0;
  const stageCostToAdvance = canAdvance && p.stageIdx < STAGE_ORDER.length - 1 ? nextStage!.cost : 0;
  const isReleaseReady = canAdvance && p.stageIdx === STAGE_ORDER.length - 1;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-bold">{p.title}</p>
          <p className="text-[10px] uppercase tracking-wider text-accent">{tier.name} · Q{Math.round(p.quality)}</p>
        </div>
        {isDone ? (
          <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">Sluppet</span>
        ) : (
          <button onClick={() => onCancel(p.id)} className="rounded bg-destructive/70 px-2 py-0.5 text-[10px] text-destructive-foreground hover:bg-destructive">
            Avlys
          </button>
        )}
      </div>

      {/* Stage track */}
      <div className="mt-2 grid grid-cols-5 gap-1">
        {tier.stages.map((s, i) => {
          const done = i < p.stageIdx || isDone;
          const active = !isDone && i === p.stageIdx;
          return (
            <div key={s.id}
              className={`rounded p-1.5 text-center text-[10px] transition ${
                done ? "bg-accent/80 text-accent-foreground"
                : active ? "bg-primary text-primary-foreground neon-border"
                : "bg-background/60 text-muted-foreground"
              }`}>
              <div className="text-base leading-none">{s.emoji}</div>
              <div className="mt-0.5 font-bold">{s.label}</div>
            </div>
          );
        })}
      </div>

      {!isDone && currentStage && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="text-foreground">{currentStage.label}:</span> {currentStage.flavor}
          {p.hoursLeft > 0
            ? <span className="ml-2 font-mono text-accent">⏳ {p.hoursLeft}t igjen</span>
            : <span className="ml-2 font-mono text-accent">✅ klar</span>}
        </div>
      )}

      {/* Cast */}
      {!isDone && (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cast ({p.girlIds.length})</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {girls.length === 0 && (
              <span className="text-[11px] text-muted-foreground">Ingen stjerner i roster.</span>
            )}
            {girls.map((g) => {
              const on = p.girlIds.includes(g.id);
              const locked = p.stageIdx > 1;
              return (
                <button key={g.id}
                  disabled={locked}
                  onClick={() => onAssign(p.id, g.id)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                    on ? "border-primary bg-primary/20 text-foreground"
                       : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                  } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {on ? "★ " : ""}{g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advance button */}
      {!isDone && (
        <button
          onClick={() => onAdvance(p.id)}
          disabled={!canAdvance || (stageCostToAdvance > 0 && cash < stageCostToAdvance)}
          className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-bold uppercase text-primary-foreground hover:brightness-110 disabled:opacity-40 transition"
        >
          {isReleaseReady
            ? "🚀 Slipp filmen!"
            : canAdvance
              ? `Start ${nextStage!.label} ($${nextStage!.cost})`
              : `Vent ${p.hoursLeft}t…`}
        </button>
      )}
    </div>
  );
}
