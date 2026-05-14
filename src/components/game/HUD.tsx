import { LOCATIONS } from "@/game/data";
import type { ReactNode } from "react";
import { absHour, dayName, hoursUntilNextClockTime, timeStr, type GameState } from "@/game/useGame";
import {
  DollarSign,
  Star,
  Zap,
  Flame,
  Calendar,
  Backpack,
  Users,
  Settings,
  Image as ImageIcon,
} from "lucide-react";

export function HUD({
  state,
  onOpenRoster,
  onOpenStaff,
  onOpenInventory,
  onOpenGallery,
  onOpenOptions,
  onAdvanceTime,
  onEndDay,
  onOpenProgression,
}: {
  state: GameState;
  onOpenRoster: () => void;
  onOpenStaff: () => void;
  onOpenInventory: () => void;
  onOpenGallery: () => void;
  onOpenOptions: () => void;
  onAdvanceTime: (hours?: number) => void;
  onEndDay: () => void;
  onOpenProgression: () => void;
}) {
  const loc = LOCATIONS[state.locationLevel - 1];
  const hoursToMorning = hoursUntilNextClockTime(absHour(state), 8);
  const districtLabel = state.district.charAt(0).toUpperCase() + state.district.slice(1);
  const progressSummary = `LV${state.locationLevel} • Next: Downtown`;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full items-center gap-1.5 px-3 py-1.5 text-xs overflow-x-auto">
        <h1 className="font-display text-lg font-black uppercase neon-text leading-none">
          Bustville
        </h1>
        <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:inline">
          {districtLabel} · Lv{loc.level}
        </span>
        <Pill icon={<DollarSign className="h-3 w-3" />} value={state.cash.toLocaleString()} />
        <Pill icon={<Star className="h-3 w-3" />} value={state.reputation.toString()} />
        <Pill icon={<Zap className="h-3 w-3" />} value={`${state.stamina}/${state.maxStamina}`} />
        <Pill
          icon={<Flame className="h-3 w-3" />}
          value={`${state.heatLevel}%`}
          hot={state.heatLevel > 40}
        />
        <span className="flex items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 font-mono">
          <Calendar className="h-3 w-3 text-accent" /> {dayName(state.day)} d.{state.day} ·{" "}
          {timeStr(state.hour)}
        </span>
        <IconBtn onClick={onOpenRoster} title="Roster">
          <Users className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn onClick={onOpenStaff} title="Staff">
          <Users className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn onClick={onOpenInventory} title="Lager">
          <Backpack className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn onClick={onOpenGallery} title="Galleri">
          <ImageIcon className="h-3.5 w-3.5" />
        </IconBtn>
        <button
          onClick={onOpenProgression}
          className="rounded-full border border-primary/60 bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase text-primary"
        >
          {progressSummary}
        </button>
        <button
          onClick={() => onAdvanceTime(1)}
          className="rounded-md border border-primary/60 bg-primary/20 px-2 py-1 font-bold text-primary"
        >
          +1h
        </button>
        <button
          onClick={onEndDay}
          title={`Hopp ${hoursToMorning}t`}
          className="rounded-md border border-accent/60 bg-accent/20 px-2 py-1 font-bold text-accent"
        >
          End Day
        </button>
        <IconBtn onClick={onOpenOptions} title="Settings">
          <Settings className="h-3.5 w-3.5" />
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
  state: GameState;
  onOpenRoster: () => void;
  onOpenStaff: () => void;
  onOpenInventory: () => void;
  onOpenGallery: () => void;
  onOpenOptions: () => void;
  onAdvanceTime: (hours?: number) => void;
  onEndDay: () => void;
  onOpenProgression: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-md border border-border bg-background p-1.5 hover:border-primary"
    >
      {children}
    </button>
  );
}
function Pill({
  icon,
  value,
  hot,
}: {
  state: GameState;
  onOpenRoster: () => void;
  onOpenStaff: () => void;
  onOpenInventory: () => void;
  onOpenGallery: () => void;
  onOpenOptions: () => void;
  onAdvanceTime: (hours?: number) => void;
  onEndDay: () => void;
  onOpenProgression: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 font-mono ${hot ? "bg-destructive/20" : "bg-card/50"}`}
    >
      {icon}
      <span className="font-bold">{value}</span>
    </div>
  );
}
