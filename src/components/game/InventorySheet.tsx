import type { GameState } from "@/game/useGame";
import { EQUIPMENT_LABELS, getEquipmentLevelLabel } from "@/game/useGame";
import { SHOP_COVER } from "@/game/data";
import { GameIcon, type GameIconName, type IconTone } from "@/components/game/GameIcon";
import { GameMeter } from "@/components/game/GameMeter";

interface Props {
  state: GameState;
  onClose: () => void;
}

export function InventorySheet({ state, onClose }: Props) {
  const heatColor =
    state.heatLevel > 60
      ? "text-destructive"
      : state.heatLevel > 30
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card/95 shadow-[0_0_60px_oklch(0.7_0.28_350/0.3)]"
      >
        <div className="relative h-32 shrink-0 overflow-hidden border-b border-border">
          <img
            src={SHOP_COVER}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/10" />
          <div className="relative flex h-full items-end justify-between gap-2 px-4 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-accent drop-shadow">
                Lager · Glitter & Garter
              </p>
              <h2 className="font-display text-2xl uppercase neon-text drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                <span className="inline-flex items-center gap-2">
                  <GameIcon name="inventory" size={20} />
                  Inventar
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded border border-border bg-background/70 px-2 py-1 text-xs uppercase backdrop-blur hover:border-primary"
            >
              Lukk ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* Cash + resources */}
          <Section title="Ressurser">
            <Item
              icon="cash"
              tone="cash"
              label="Kontanter"
              value={`$${state.cash.toLocaleString()}`}
              accent
            />
            <Item icon="moonshine" label="Moonshine" sub="flasker" value={state.moonshine} />
            <Item icon="rep" tone="rep" label="Omdømme" value={state.reputation} meter max={200} />
            <Item
              icon="stamina"
              tone="stamina"
              label="Stamina"
              value={`${state.stamina} / ${state.maxStamina}`}
              meterValue={state.stamina}
              max={state.maxStamina}
              meter
            />
            {state.backlog > 0 && (
              <Item
                icon="inventory"
                label="Backlog"
                sub="usolgte produksjoner"
                value={state.backlog}
              />
            )}
            <Item icon="film" label="Filmstock" sub="ruller (Sparky's)" value={state.filmstock} />
            <Item icon="supplies" label="Kostymer" sub="Glitter & Garter" value={state.costumes} />
            <Item
              icon="auditionVoucher"
              label="Audition-vouchers"
              sub="Open Mic Casting"
              value={state.auditionVouchers}
            />
            <Item
              icon="healthCheck"
              label="Condoms"
              sub="auto i intense scener — beskytter 100%"
              value={state.condoms}
              className={
                state.condoms === 0 ? "text-destructive" : state.condoms < 3 ? "text-accent" : ""
              }
            />
            {state.distribBonus > 0 && (
              <Item
                icon="distribution"
                label="Distribusjons-bonus"
                sub="neste utgivelse"
                value={`+${state.distribBonus}%`}
              />
            )}
          </Section>

          {/* Status */}
          <Section title="Status">
            <Item
              icon="heat"
              tone="heat"
              label="Heat"
              sub="razzia-risiko"
              value={`${state.heatLevel}%`}
              meter
              meterValue={state.heatLevel}
              max={100}
              className={heatColor}
            />
            {state.bribedUntilDay > state.day && (
              <Item
                icon="bribe"
                label="Bestikket sheriff"
                sub="til dag"
                value={state.bribedUntilDay}
              />
            )}
            {state.loan > 0 ? (
              <Item
                icon="cashLoss"
                label="Lån"
                sub={`forfaller dag ${state.loanDueDay}`}
                value={`$${state.loan}`}
                className="text-destructive"
              />
            ) : (
              <Item icon="cashLoss" label="Lån" value="—" />
            )}
          </Section>

          {/* Upgrades */}
          <Section title="Bygg & Utstyr">
            <Item
              icon="upgradeHome"
              label="Destilleri"
              sub={`+${(state.distilleryLevel - 1) * 50}% utbytte`}
              value={`Lv ${state.distilleryLevel}`}
            />
            <Item
              icon="film"
              label="Studio"
              sub="produksjons-base"
              value={`Lv ${state.studioLevel}`}
            />
            {(["camera", "lighting", "editing"] as const).map((k) => (
              <Item
                key={k}
                icon={EQUIPMENT_LABELS[k].emoji}
                label={EQUIPMENT_LABELS[k].label}
                sub={EQUIPMENT_LABELS[k].blurb}
                value={getEquipmentLevelLabel(k, state.equipment[k])}
              />
            ))}
          </Section>

          {/* Roster summary */}
          <Section title="Stab">
            <Item icon="roster" label="Stjerner i roster" value={state.girls.length} />
            <Item
              icon="cooldown"
              label="På oppdrag"
              value={state.girls.filter((g) => g.mission).length}
            />
            <Item
              icon="film"
              label="Aktive produksjoner"
              value={state.productions.filter((p) => !p.flopped && p.stageIdx < 5).length}
            />
            {state.girls.some((g) => g.std) && (
              <Item
                icon="healthCheck"
                label="Syke stjerner"
                sub="trenger Doc Lonnie"
                value={state.girls.filter((g) => g.std).length}
                className="text-destructive"
              />
            )}
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
      <p className="mb-1.5 font-display text-[10px] uppercase tracking-widest text-accent">
        {title}
      </p>
      <div className="space-y-1 rounded-lg border border-border bg-background/40 p-2">
        {children}
      </div>
    </div>
  );
}

function Item({
  icon,
  tone = "neutral",
  label,
  sub,
  value,
  accent,
  className,
  meter,
  meterValue,
  max = 100,
}: {
  icon: GameIconName;
  tone?: IconTone;
  label: string;
  sub?: string;
  value: React.ReactNode;
  accent?: boolean;
  className?: string;
  meter?: boolean;
  meterValue?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-background/60">
      <GameIcon name={icon} tone={tone} size={16} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
        {meter && typeof (meterValue ?? value) === "number" && (
          <GameMeter
            className="mt-1"
            value={(meterValue ?? value) as number}
            max={max}
            tone={tone === "heat" ? "heat" : tone === "stamina" ? "stamina" : "progress"}
            size="tiny"
          />
        )}
      </div>
      <span
        className={`font-mono font-bold ${accent ? "text-primary neon-text" : ""} ${className ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}
