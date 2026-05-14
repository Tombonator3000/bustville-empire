import { LOCATIONS } from "@/game/data";
import { absHour, dayName, hoursUntilNextClockTime, timeStr, type GameState } from "@/game/useGame";
import { getDistrictTransitionLock } from "@/game/locations";
import {
  DollarSign,
  Star,
  Zap,
  Flame,
  Calendar,
  Backpack,
  Users,
  ArrowLeftRight,
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
  onSwitch,
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
  onSwitch: () => void;
  onAdvanceTime: (hours?: number) => void;
  onEndDay: () => void;
  onOpenProgression: () => void;
}) {
  const loc = LOCATIONS[state.locationLevel - 1];
  const hoursToMorning = hoursUntilNextClockTime(absHour(state), 8);

  const downtownLock = getDistrictTransitionLock(state, "downtown");
  const districtLocations = LOCATIONS.filter((location) => location.district === state.district);
  const currentDistrictIndex = Math.max(
    districtLocations.findIndex((location) => location.level === state.locationLevel),
    0,
  );
  const districtLabel = state.district.charAt(0).toUpperCase() + state.district.slice(1);
  const progressSummary = `LV${state.locationLevel} Hustler · ${districtLabel} ${Math.min(currentDistrictIndex + 1, districtLocations.length)}/${districtLocations.length}`;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      {/* Row 1 — brand + resources */}
      <div className="mx-auto flex w-full items-center gap-2 px-4 py-1.5 text-xs">
        <h1 className="mr-1 font-display text-xl font-black uppercase neon-text leading-none">
          Bustville
        </h1>
        <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline">
          › Lv{loc.level} {loc.name}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Pill
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label="Cash"
            value={state.cash.toLocaleString()}
            accent
          />
          <Pill
            icon={<Star className="h-3.5 w-3.5" />}
            label="Rep"
            value={state.reputation.toString()}
          />
          <Pill
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Stam"
            value={`${state.stamina}/${state.maxStamina}`}
          />
          <Pill
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Heat"
            value={`${state.heatLevel}%`}
            hot={state.heatLevel > 40}
          />
          {state.loan > 0 && (
            <Pill
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Loan"
              value={`$${state.loan}`}
              hot
            />
          )}
          <span className="flex items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 font-mono">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {dayName(state.day)}
            </span>
            <span className="font-bold">d.{state.day}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-bold">{timeStr(state.hour)}</span>
          </span>
          <button
            onClick={() => onAdvanceTime(1)}
            title="Hopp tiden 1 time frem"
            className="rounded-md border border-primary/60 bg-primary/20 px-2 py-1 font-bold text-primary hover:brightness-110"
          >
            ⏩ +1h
          </button>
          <button
            onClick={onEndDay}
            title={`Hopp ${hoursToMorning}t til neste morgen`}
            className="rounded-md border border-accent/60 bg-accent/20 px-2 py-1 font-bold text-accent hover:brightness-110"
          >
            🌙 End Day
          </button>
        </div>
      </div>

      {/* Row 2 — navigation */}
      <div className="mx-auto flex w-full flex-wrap items-center gap-1.5 border-t border-border/40 bg-background/60 px-4 py-1.5 text-xs">
        <NavBtn
          onClick={onOpenRoster}
          icon={<Users className="h-3.5 w-3.5" />}
          label={`Roster ${state.girls.length}`}
          primary
        />
        <NavBtn onClick={onOpenStaff} icon={<Users className="h-3.5 w-3.5" />} label={`Staff ${state.staff.length}`} />
        <NavBtn
          onClick={onOpenInventory}
          icon={<Backpack className="h-3.5 w-3.5" />}
          label="Lager"
        />
        <NavBtn
          onClick={onOpenGallery}
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          label="Galleri"
        />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onOpenProgression}
            title="Open progression"
            className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary hover:brightness-110"
          >
            <span>{progressSummary}</span>
          </button>
          <NavBtn
            onClick={onSwitch}
            icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
            label={state.district === "park" ? "→ Downtown" : "→ Park"}
            accent
            title={state.district === "park" && downtownLock.locked ? "Downtown route locked" : "Switch district"}
          />
          <button
            onClick={onOpenOptions}
            title="Meny / Lagre / Innstillinger"
            className="rounded-md border border-border bg-background p-1.5 hover:border-primary"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function NavBtn({
  onClick,
  icon,
  label,
  primary,
  accent,
  hot,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  accent?: boolean;
  hot?: boolean;
  title?: string;
}) {
  const base = "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition";
  const cls = primary
    ? "bg-primary text-primary-foreground font-bold hover:brightness-110"
    : accent
      ? "bg-accent text-accent-foreground font-bold hover:brightness-110"
      : hot
        ? "bg-destructive/30 text-destructive-foreground border border-destructive/60 hover:bg-destructive/50"
        : "bg-secondary/70 hover:bg-secondary";
  return (
    <button onClick={onClick} title={title} className={`${base} ${cls}`}>
      {icon} {label}
    </button>
  );
}

function Pill({
  icon,
  label,
  value,
  accent,
  hot,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  hot?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 font-mono ${accent ? "bg-primary/15 text-primary neon-text" : hot ? "bg-destructive/20 text-destructive-foreground" : "bg-card/50"}`}
    >
      {icon}
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
