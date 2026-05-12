import { useState } from "react";
import { VISIT_TYPES, VISIT_UPGRADE_COST, ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { absHour, INTENSITIES, type GameState, type Intensity } from "@/game/useGame";
import { activeSTD } from "@/game/health";

export function VisitModal({
  state, onClose, onRun, onUpgrade,
}: {
  state: GameState;
  onClose: () => void;
  onRun: (visitId: string, girlId: string | undefined, intensity: Intensity) => void;
  onUpgrade: () => void;
}) {
  const [girlId, setGirlId] = useState<string | undefined>();
  const [visitId, setVisitId] = useState<string>(VISIT_TYPES[0].id);
  const [intensity, setIntensity] = useState<Intensity>("standard");

  const visit = VISIT_TYPES.find((v) => v.id === visitId)!;
  const locked = visit.level > state.trailerLevel;
  const maxLvl = Math.max(...VISIT_TYPES.map((v) => v.level));
  const upgradeCost = state.trailerLevel < maxLvl ? VISIT_UPGRADE_COST(state.trailerLevel) : 0;

  const nowAbs = absHour(state);
  const isAvailable = (g: Girl) => !g.mission && (!g.busyUntil || g.busyUntil <= nowAbs);
  const selectedGirl = girlId ? state.girls.find((g) => g.id === girlId) : undefined;
  const selectedBlocked = selectedGirl && !isAvailable(selectedGirl);
  const std = selectedGirl ? activeSTD(selectedGirl, state.day) : null;
  const needsGirl = visit.needsGirl && !girlId;

  const earnPreview = Math.floor(
    visit.basePay
      * (selectedGirl ? 1 + (selectedGirl.beauty + selectedGirl.performance + selectedGirl.popularity) / 220 : 1)
      * (1 + state.player.charisma * 0.05)
      * (intensity === "chill" ? 0.7 : intensity === "intense" ? 1.45 : 1)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-3" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/60 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-secondary/90 backdrop-blur p-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-accent">Trailer · Privat besøk</div>
            <h3 className="font-display text-2xl uppercase neon-text">🚪 Ta imot besøk</h3>
            <p className="text-[10px] text-muted-foreground">Tilbud-nivå {state.trailerLevel}/{maxLvl} · Heat {state.heatLevel}%</p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-2 py-1 text-xs">✕</button>
        </div>

        <div className="space-y-3 p-3">
          {/* Visit types */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Type besøk</div>
            <div className="grid grid-cols-1 gap-1.5">
              {VISIT_TYPES.map((v) => {
                const vLocked = v.level > state.trailerLevel;
                const on = visitId === v.id;
                return (
                  <button key={v.id} onClick={() => !vLocked && setVisitId(v.id)}
                    disabled={vLocked}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition ${
                      vLocked ? "cursor-not-allowed border-destructive/40 bg-destructive/5 opacity-60"
                        : on ? "border-primary bg-primary/15" : "border-border bg-secondary/40 hover:border-primary/60"
                    }`}>
                    <span className="text-2xl leading-none">{v.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold truncate">{v.label}</span>
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">~${v.basePay} · {v.hours}t · ${v.cost}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{v.flavor}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[9px]">
                        <Tag>+{v.rep} rep</Tag>
                        <Tag hot>+{v.heat} heat</Tag>
                        {v.needsGirl && <Tag accent>Krever stjerne</Tag>}
                        {v.risky && <Tag hot>STD-risiko ved intense</Tag>}
                        {vLocked && <Tag hot>🔒 Lv {v.level}</Tag>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgrade */}
          {state.trailerLevel < maxLvl && (
            <button onClick={onUpgrade}
              disabled={state.cash < upgradeCost}
              className="w-full rounded-lg border border-accent/60 bg-accent/15 px-3 py-2 text-left transition hover:bg-accent/25 disabled:opacity-50">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-accent">🛋️ Oppgrader trailer-tilbud → Lv {state.trailerLevel + 1}</span>
                <span className="text-xs">${upgradeCost}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Låser opp: {VISIT_TYPES.find((v) => v.level === state.trailerLevel + 1)?.label}
              </div>
            </button>
          )}

          {/* Girl picker */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Hvem tar imot? {visit.needsGirl && <span className="text-destructive">*påkrevd</span>}
            </div>
            <div className="flex flex-wrap gap-1">
              {!visit.needsGirl && (
                <button onClick={() => setGirlId(undefined)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    !girlId ? "border-primary bg-primary/20" : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                  }`}>
                  Du selv
                </button>
              )}
              {state.girls.length === 0 && <span className="text-[10px] text-muted-foreground">Ingen stjerner i staben.</span>}
              {state.girls.map((g) => {
                const ok = isAvailable(g);
                const on = girlId === g.id;
                const sick = activeSTD(g, state.day);
                return (
                  <button key={g.id} disabled={!ok} onClick={() => setGirlId(g.id)}
                    title={ok ? g.archetype : "Utilgjengelig"}
                    className={`flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                      on ? "border-primary bg-primary/20" : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                    } ${!ok ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <img src={ARCHETYPE_PORTRAITS[g.archetype]} alt="" className="h-4 w-4 rounded-full object-cover" />
                    {on ? "★ " : ""}{g.name}{sick ? ` ${sick.emoji}` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Intensitet</div>
            <div className="grid grid-cols-3 gap-1">
              {INTENSITIES.map((m) => (
                <button key={m.id} onClick={() => setIntensity(m.id)} title={m.hint}
                  className={`rounded-md border px-2 py-1 text-[10px] transition ${
                    intensity === m.id ? "border-primary bg-primary/20" : "border-border bg-background/60 text-muted-foreground hover:border-primary/60"
                  }`}>
                  <div className="text-base leading-none">{m.emoji}</div>
                  <div className="mt-0.5 font-bold">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-md border border-border bg-background/40 p-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forventet inntekt</span>
              <span className="font-mono font-bold text-primary">~${earnPreview}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heat-tillegg</span>
              <span className="font-mono">+{visit.heat + (intensity === "intense" ? 2 : 0)}</span>
            </div>
            {std && (
              <div className="mt-1 text-[10px] text-destructive">
                {std.emoji} {selectedGirl!.name} har {std.name} — påvirker payout og kan blokkere VIP.
              </div>
            )}
            {visit.risky && intensity === "intense" && (
              <div className="mt-1 text-[10px] text-amber-300">
                🧪 STD-risiko-roll. Du har {state.condoms} condom(s) — brukes auto.
              </div>
            )}
          </div>

          <button
            disabled={locked || !!selectedBlocked || needsGirl || state.cash < visit.cost}
            onClick={() => { onRun(visit.id, girlId, intensity); onClose(); }}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-bold uppercase text-primary-foreground hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed">
            {locked ? "🔒 Låst"
              : needsGirl ? "⛔ Velg en stjerne"
              : selectedBlocked ? "⛔ Stjernen er opptatt"
              : `${visit.emoji} Slipp inn ${visit.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, hot, accent }: { children: React.ReactNode; hot?: boolean; accent?: boolean }) {
  return (
    <span className={`rounded px-1 py-0.5 font-bold uppercase tracking-wider ${
      hot ? "bg-destructive/25 text-destructive-foreground" : accent ? "bg-accent/20 text-accent" : "bg-secondary/60 text-muted-foreground"
    }`}>{children}</span>
  );
}
