import { useState } from "react";
import { TIERS, STAGE_ORDER, getTier, CAST_ROLES, type Production, type CastRole } from "@/game/productions";
import {
  getStudioMods, stageCost, stageHours,
  EQUIPMENT_LABELS, EQUIPMENT_UPGRADE_COST,
  type GameState, type EquipmentKind,
} from "@/game/useGame";
import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { GENRES, getGenre } from "@/game/genres";

interface Props {
  state: GameState;
  onClose: () => void;
  onStart: (tierId: string, girlIds: string[], genreId?: string) => void;
  onAdvance: (id: string) => void;
  onAssign: (id: string, girlId: string) => void;
  onSetRole: (id: string, girlId: string, role: CastRole) => void;
  onCancel: (id: string) => void;
  onUpgradeEquipment: (kind: EquipmentKind) => void;
}

export function ProductionsSheet({ state, onClose, onStart, onAdvance, onAssign, onSetRole, onCancel, onUpgradeEquipment }: Props) {
  const mods = getStudioMods(state);
  const activeCount = state.productions.filter((p) => p.stageIdx < STAGE_ORDER.length).length;
  const full = activeCount >= mods.capacity;
  const [genreId, setGenreId] = useState<string>("romance");

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

        {/* Studio efficiency panel */}
        <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-sm uppercase tracking-widest text-accent">Studio Lv {state.studioLevel}</h3>
            <span className={`text-[11px] font-mono ${full ? "text-destructive" : "text-foreground"}`}>
              🎬 {activeCount}/{mods.capacity} kø
            </span>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
            <div>Kost <span className="text-foreground font-mono">×{mods.costMult.toFixed(2)}</span></div>
            <div>Tid <span className="text-foreground font-mono">×{mods.hoursMult.toFixed(2)}</span></div>
            <div>Q-tak <span className="text-foreground font-mono">{mods.qualityCap}</span></div>
          </div>

          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {(Object.keys(EQUIPMENT_LABELS) as EquipmentKind[]).map((kind) => {
              const lvl = state.equipment[kind];
              const meta = EQUIPMENT_LABELS[kind];
              return (
                <div
                  key={kind}
                  title={meta.blurb}
                  className="rounded-md border border-border bg-background/60 p-2 text-left text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{meta.emoji} {meta.label}</span>
                    <span className="text-accent">Lv {lvl}/3</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 rounded-md border border-dashed border-border bg-background/40 p-2 text-[10px] text-muted-foreground">
            🛒 Oppgrader utstyret hos <span className="text-foreground">📷 Sparky's Camera Shack</span>.
            Filmstock fra Sparky's, kostymer fra <span className="text-foreground">👗 Glitter & Garter</span>,
            audition-vouchers fra <span className="text-foreground">🎟️ Open Mic Casting</span>.
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
            <span className="rounded bg-background/60 px-2 py-1 text-center">🎞️ {state.filmstock}</span>
            <span className="rounded bg-background/60 px-2 py-1 text-center">👗 {state.costumes}</span>
            <span className="rounded bg-background/60 px-2 py-1 text-center">🎟️ {state.auditionVouchers}</span>
          </div>
        </div>

        {/* New project */}
        <h3 className="mt-4 font-display text-sm uppercase tracking-widest text-accent">Start nytt prosjekt</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TIERS.map((t) => {
            const locked = state.locationLevel < t.minLevel;
            const cost = stageCost(t.stages[0], mods);
            const totalHours = t.stages.reduce((a, s) => a + stageHours(s, mods), 0);
            const blocked = locked || state.cash < cost || full;
            return (
              <button
                key={t.id}
                disabled={blocked}
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
                  {locked ? `🔒 Lv ${t.minLevel}` : full ? "🚫 Kø full" : `Briefing: $${cost} · ${totalHours}t total`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active productions */}
        <h3 className="mt-5 font-display text-sm uppercase tracking-widest text-accent">
          Aktive produksjoner ({activeCount}/{mods.capacity})
        </h3>
        <div className="mt-2 space-y-3">
          {state.productions.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Ingen prosjekter. Start ditt første over.
            </p>
          )}
          {state.productions.map((p) => (
            <ProductionCard key={p.id} p={p} girls={state.girls} mods={mods}
              onAdvance={onAdvance} onAssign={onAssign} onSetRole={onSetRole}
              onCancel={onCancel} cash={state.cash} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductionCard({ p, girls, mods, onAdvance, onAssign, onSetRole, onCancel, cash }: {
  p: Production; girls: Girl[]; cash: number;
  mods: ReturnType<typeof getStudioMods>;
  onAdvance: (id: string) => void;
  onAssign: (id: string, gid: string) => void;
  onSetRole: (id: string, gid: string, role: CastRole) => void;
  onCancel: (id: string) => void;
}) {
  const tier = getTier(p.tierId)!;
  const isDone = p.stageIdx >= STAGE_ORDER.length;
  const currentStage = isDone ? null : tier.stages[p.stageIdx];
  const nextStage = !isDone && p.stageIdx < STAGE_ORDER.length - 1 ? tier.stages[p.stageIdx + 1] : null;
  const canAdvance = !isDone && p.hoursLeft <= 0;
  const stageCostToAdvance = canAdvance && p.stageIdx < STAGE_ORDER.length - 1 ? stageCost(nextStage!, mods) : 0;
  const isReleaseReady = canAdvance && p.stageIdx === STAGE_ORDER.length - 1;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-bold">{p.title}</p>
          <p className="text-[10px] uppercase tracking-wider text-accent">
            {tier.name} · Q{Math.round(p.quality)}/{mods.qualityCap}
            {p.reworks > 0 && <span className="ml-1 text-destructive">· {p.reworks} rework</span>}
          </p>
        </div>
        {isDone ? (
          p.flopped
            ? <span className="rounded bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">💀 Flopp</span>
            : <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">Hit</span>
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

      {/* Cast with role assignment */}
      {!isDone && (
        <div className="mt-2 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Cast & roller ({p.girlIds.length})
          </div>

          {/* Pool: tap to toggle in/out of cast */}
          <div className="flex flex-wrap gap-1">
            {girls.length === 0 && (
              <span className="text-[11px] text-muted-foreground">Ingen stjerner i roster.</span>
            )}
            {girls.map((g) => {
              const on = p.girlIds.includes(g.id);
              const locked = p.stageIdx > 1 || !!g.mission;
              return (
                <button key={g.id}
                  disabled={locked && !on}
                  onClick={() => onAssign(p.id, g.id)}
                  title={g.mission ? `Opptatt: ${g.mission.label}` : g.name}
                  className={`flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                    on ? "border-primary bg-primary/20 text-foreground"
                       : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                  } ${locked && !on ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <img src={ARCHETYPE_PORTRAITS[g.archetype]} alt="" width={18} height={18}
                    className="h-4 w-4 rounded-full object-cover" loading="lazy" />
                  {on ? "★ " : ""}{g.name}{g.mission ? " ⏳" : ""}
                </button>
              );
            })}
          </div>

          {/* Role assignment for each cast member */}
          {p.girlIds.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-border/60 bg-background/40 p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sett rolle per stjerne — påvirker risikorull og kvalitet på det steget.
              </div>
              {p.girlIds.map((gid) => {
                const g = girls.find((x) => x.id === gid);
                if (!g) return null;
                const current = (p.roles?.[gid] ?? "shooting") as CastRole;
                return (
                  <div key={gid} className="flex items-center gap-2">
                    <img src={ARCHETYPE_PORTRAITS[g.archetype]} alt="" width={20} height={20}
                      className="h-5 w-5 rounded-full object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-bold">{g.name}</span>
                    <div className="flex gap-1">
                      {CAST_ROLES.map((r) => {
                        const stageIdx = STAGE_ORDER.indexOf(r.id);
                        const past = stageIdx >= 0 && p.stageIdx > stageIdx;
                        const active = current === r.id;
                        return (
                          <button
                            key={r.id}
                            disabled={past}
                            onClick={() => onSetRole(p.id, gid, r.id)}
                            title={past ? `${r.label} – steget er ferdig` : r.hint}
                            className={`rounded border px-1.5 py-0.5 text-[10px] transition ${
                              active
                                ? "border-primary bg-primary/30 text-foreground"
                                : "border-border bg-background/60 text-muted-foreground hover:border-primary/60"
                            } ${past ? "opacity-30 cursor-not-allowed" : ""}`}
                          >
                            {r.emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              ? `Start ${nextStage!.label} ($${stageCostToAdvance})`
              : `Vent ${p.hoursLeft}t…`}
        </button>
      )}
    </div>
  );
}
