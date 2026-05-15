import { LOCATIONS } from "@/game/data";
import type { ReactNode } from "react";
import { absHour, dayName, hoursUntilNextClockTime, timeStr, type GameState } from "@/game/useGame";
import { bestNextActionHint } from "@/game/hints";
import { nextGoal } from "@/game/goals";
import { GameIcon } from "./GameIcon";
import { StatPill } from "./GameMeter";

export function HUD({
  state,
  onOpenRoster,
  onOpenStaff,
  onOpenInventory,
  onOpenGallery,
  onOpenOptions,
  onOpenStats,
  onAdvanceTime,
  onEndDay,
  onOpenProgression,
  onOpenGoals,
}: {
  state: GameState;
  onOpenRoster: () => void;
  onOpenStaff: () => void;
  onOpenInventory: () => void;
  onOpenGallery: () => void;
  onOpenOptions: () => void;
  onOpenStats: () => void;
  onAdvanceTime: (hours?: number) => void;
  onEndDay: () => void;
  onOpenProgression: () => void;
  onOpenGoals: () => void;
}) {
  const loc = LOCATIONS[state.locationLevel - 1];
  const hoursToMorning = hoursUntilNextClockTime(absHour(state), 8);
  const districtLabel = state.district.charAt(0).toUpperCase() + state.district.slice(1);
  const next = nextGoal(state.goals);
  const hint = bestNextActionHint(state);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full items-center gap-1.5 px-3 py-1.5 text-xs overflow-x-auto">
        <h1 className="font-display text-lg font-black uppercase neon-text leading-none">
          Bustville
        </h1>
        <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:inline">
          {districtLabel} · Lv{loc.level}
        </span>

        <StatPill
          icon={<GameIcon name="cash" tone="cash" />}
          value={`$${state.cash.toLocaleString()}`}
          title="Cash"
        />
        <StatPill
          icon={<GameIcon name="rep" tone="rep" />}
          value={state.reputation}
          title="Reputation"
        />
        <StatPill
          icon={<GameIcon name="stamina" tone="stamina" />}
          value={state.stamina}
          max={state.maxStamina}
          meter
          tone="stamina"
          title={`Stamina ${state.stamina}/${state.maxStamina}`}
        />
        <StatPill
          icon={<GameIcon name="heat" tone="heat" />}
          value={state.heatLevel}
          max={100}
          meter
          tone="heat"
          title={`Heat ${state.heatLevel}%`}
        />
        <span className="flex items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 font-mono">
          <GameIcon name="calendar" tone="purple" />
          {dayName(state.day)} d.{state.day} · {timeStr(state.hour)}
        </span>

        <IconBtn onClick={onOpenRoster} title="Roster">
          <GameIcon name="roster" size={14} />
        </IconBtn>
        <IconBtn onClick={onOpenStaff} title="Staff">
          <GameIcon name="staff" size={14} />
        </IconBtn>
        <IconBtn onClick={onOpenInventory} title="Lager">
          <GameIcon name="inventory" size={14} />
        </IconBtn>
        <IconBtn onClick={onOpenGallery} title="Galleri">
          <GameIcon name="gallery" size={14} />
        </IconBtn>


        <button
          onClick={onOpenGoals}
          className="rounded-md border border-border/70 bg-card/70 px-2 py-1 text-[10px] font-semibold"
          title="Open goals"
        >
          Goals {state.goals.completedCount}/{state.goals.list.length} · Next: {next ? next.title : "All done"}
        </button>
        <span className="hidden text-[10px] text-muted-foreground xl:inline">💡 {hint}</span>

        <button
          onClick={onOpenStats}
          className="rounded-md border border-border/70 bg-card/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground hover:border-primary/70 hover:text-primary transition"
          title="Empire stats and ledger"
        >
          Empire / Stats / Ledger
        </button>

        <button
          onClick={onOpenProgression}
          className="flex items-center gap-1 rounded-full border border-primary/60 bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase text-primary hover:bg-primary/25 transition"
          title="Progress / Next unlock"
        >
          <GameIcon name="progress" />
          LV{state.locationLevel} · Next
        </button>
        <button
          onClick={() => onAdvanceTime(1)}
          className="flex items-center gap-1 rounded-md border border-primary/60 bg-primary/20 px-2 py-1 font-bold text-primary"
          title="Advance 1 hour"
        >
          <GameIcon name="time" /> +1h
        </button>
        <button
          onClick={onEndDay}
          title={`Hopp ${hoursToMorning}t til morgen`}
          className="flex items-center gap-1 rounded-md border border-accent/60 bg-accent/20 px-2 py-1 font-bold text-accent"
        >
          <GameIcon name="sleep" /> End Day
        </button>
        <IconBtn onClick={onOpenOptions} title="Settings">
          <GameIcon name="settings" size={14} />
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="rounded-md border border-border bg-background p-1.5 hover:border-primary transition-colors"
    >
      {children}
    </button>
  );
}
