import type { GameState } from "@/game/useGame";
import { EQUIPMENT_LABELS } from "@/game/useGame";

interface Props {
  state: GameState;
  onClose: () => void;
}

export function InventorySheet({ state, onClose }: Props) {
  const heatColor = state.heatLevel > 60 ? "text-destructive" : state.heatLevel > 30 ? "text-accent" : "text-muted-foreground";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card/95 shadow-[0_0_60px_oklch(0.7_0.28_350/0.3)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Lager</p>
            <h2 className="font-display text-2xl uppercase neon-text">🎒 Inventar</h2>
          </div>
          <button onClick={onClose} className="rounded border border-border px-2 py-1 text-xs uppercase hover:border-primary">Lukk ✕</button>
        </div>

        <div className="space-y-4 p-4">
          {/* Cash + resources */}
          <Section title="Ressurser">
            <Item icon="💵" label="Kontanter" value={`$${state.cash.toLocaleString()}`} accent />
            <Item icon="🥃" label="Moonshine" sub="flasker" value={state.moonshine} />
            <Item icon="⭐" label="Omdømme" value={state.reputation} />
            <Item icon="⚡" label="Stamina" value={`${state.stamina} / ${state.maxStamina}`} />
            {state.backlog > 0 && <Item icon="📼" label="Backlog" sub="usolgte produksjoner" value={state.backlog} />}
            <Item icon="🎞️" label="Filmstock" sub="ruller (Sparky's)" value={state.filmstock} />
            <Item icon="👗" label="Kostymer" sub="Glitter & Garter" value={state.costumes} />
            <Item icon="🎟️" label="Audition-vouchers" sub="Open Mic Casting" value={state.auditionVouchers} />
            {state.distribBonus > 0 && <Item icon="🤝" label="Distribusjons-bonus" sub="neste utgivelse" value={`+${state.distribBonus}%`} />}
          </Section>

          {/* Status */}
          <Section title="Status">
            <Item icon="🔥" label="Heat" sub="razzia-risiko" value={`${state.heatLevel}%`} className={heatColor} />
            {state.bribedUntilDay > state.day && (
              <Item icon="🤝" label="Bestikket sheriff" sub="til dag" value={state.bribedUntilDay} />
            )}
            {state.loan > 0 ? (
              <Item icon="🏦" label="Lån" sub={`forfaller dag ${state.loanDueDay}`} value={`$${state.loan}`} className="text-destructive" />
            ) : (
              <Item icon="🏦" label="Lån" value="—" />
            )}
          </Section>

          {/* Upgrades */}
          <Section title="Bygg & Utstyr">
            <Item icon="🛠️" label="Destilleri" sub={`+${(state.distilleryLevel - 1) * 50}% utbytte`} value={`Lv ${state.distilleryLevel}`} />
            <Item icon="🎬" label="Studio" sub="produksjons-base" value={`Lv ${state.studioLevel}`} />
            {(["camera","lighting","editing"] as const).map((k) => (
              <Item key={k} icon={EQUIPMENT_LABELS[k].emoji} label={EQUIPMENT_LABELS[k].label}
                sub={EQUIPMENT_LABELS[k].blurb} value={`Lv ${state.equipment[k]}`} />
            ))}
          </Section>

          {/* Roster summary */}
          <Section title="Stab">
            <Item icon="💋" label="Stjerner i roster" value={state.girls.length} />
            <Item icon="⏳" label="På oppdrag" value={state.girls.filter((g) => g.mission).length} />
            <Item icon="🎥" label="Aktive produksjoner" value={state.productions.filter((p) => !p.flopped && p.stageIdx < 5).length} />
          </Section>

          <p className="pt-2 text-center text-[10px] text-muted-foreground">
            Tips: Selg moonshine på Dirty Dan's eller gas-stasjonen før heat tar deg.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-[10px] uppercase tracking-widest text-accent">{title}</p>
      <div className="space-y-1 rounded-lg border border-border bg-background/40 p-2">
        {children}
      </div>
    </div>
  );
}

function Item({ icon, label, sub, value, accent, className }: {
  icon: string; label: string; sub?: string; value: React.ReactNode; accent?: boolean; className?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-background/60">
      <span className="text-xl leading-none">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
      </div>
      <span className={`font-mono font-bold ${accent ? "text-primary neon-text" : ""} ${className ?? ""}`}>{value}</span>
    </div>
  );
}
