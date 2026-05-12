import { LOCATIONS } from "@/game/data";
import { dayName, timeStr, type GameState } from "@/game/useGame";
import { STAGE_ORDER } from "@/game/productions";
import {
  DollarSign, Star, Zap, Flame, Wine, Calendar, Backpack, Crown,
  Clapperboard, Users, ArrowLeftRight, Settings, Image as ImageIcon,
} from "lucide-react";

export function HUD({
  state, onOpenRoster, onOpenStats, onOpenProductions, onOpenInventory,
  onOpenGallery, onOpenClinic, onOpenOptions, onSwitch,
}: {
  state: GameState;
  onOpenRoster: () => void; onOpenStats: () => void; onOpenProductions: () => void;
  onOpenInventory: () => void; onOpenGallery: () => void; onOpenClinic: () => void;
  onOpenOptions: () => void; onSwitch: () => void;
}) {
  const loc = LOCATIONS[state.locationLevel - 1];
  const topRival = [...state.rivals].sort((a, b) => b.share - a.share)[0];
  const headline = state.news[0];
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full flex-wrap items-center gap-2 px-4 py-2 text-xs">
        <h1 className="mr-2 font-display text-xl font-black uppercase neon-text">Bustville</h1>
        <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label="Cash" value={state.cash.toLocaleString()} accent />
        <Pill icon={<Star className="h-3.5 w-3.5" />} label="Rep" value={state.reputation.toString()} />
        <Pill icon={<Zap className="h-3.5 w-3.5" />} label="Stam" value={`${state.stamina}/${state.maxStamina}`} />
        <Pill icon={<Wine className="h-3.5 w-3.5" />} label="Moon" value={state.moonshine.toString()} />
        <Pill icon={<Flame className="h-3.5 w-3.5" />} label="Heat" value={`${state.heatLevel}%`} hot={state.heatLevel > 40} />
        {state.loan > 0 && <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label="Loan" value={`$${state.loan}`} hot />}
        {state.campaignBonus > 0 && (
          <span title="Marketing-kampanje aktiv — brukes opp ved neste release"
            className="flex items-center gap-1 rounded-md border border-accent/60 bg-accent/15 px-2 py-1 font-mono text-accent">
            📣 +{state.campaignBonus}%
          </span>
        )}
        {topRival && (
          <span title={`Topp-rival: ${topRival.name} (markedsandel ${Math.round(topRival.share)}%)`}
            className="hidden items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 font-mono md:flex">
            {topRival.emoji} <span className="text-[9px] uppercase text-muted-foreground">Rival</span>
            <span className="font-bold">{Math.round(topRival.share)}%</span>
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-card/60 px-2 py-1 font-mono">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            {dayName(state.day)} d.{state.day} · {timeStr(state.hour)}
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            Lv{loc.level} {loc.name}
          </span>
          <IconBtn onClick={onOpenInventory} title="Inventar" icon={<Backpack className="h-3.5 w-3.5" />} label="Lager" />
          <IconBtn onClick={onOpenGallery} title="Galleri" icon={<ImageIcon className="h-3.5 w-3.5" />} label="Galleri" />
          <IconBtn onClick={onOpenClinic}
            title="Klinikk: STD-status, kjøp condoms / antibiotika / steroider"
            icon={<span className={state.girls.some(x => x.std) ? "text-destructive" : ""}>🩺</span>}
            label={state.girls.some(x => x.std) ? `Klinikk (${state.girls.filter(x => x.std).length})` : "Klinikk"} />
          <IconBtn onClick={onOpenStats} icon={<Crown className="h-3.5 w-3.5" />} label="Boss" />
          <IconBtn onClick={onOpenProductions}
            icon={<Clapperboard className="h-3.5 w-3.5" />}
            label={`Filmer (${state.productions.filter((p) => p.stageIdx < STAGE_ORDER.length).length})`} />
          <button onClick={onOpenRoster}
            className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 font-bold text-primary-foreground shadow-sm hover:brightness-110">
            <Users className="h-3.5 w-3.5" /> Roster ({state.girls.length})
          </button>
          {state.locationLevel >= 3 && (
            <button onClick={onSwitch} className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 font-bold text-accent-foreground hover:brightness-110">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {state.district === "park" ? "Downtown" : "Park"}
            </button>
          )}
          <button onClick={onOpenOptions} title="Meny / Lagre / Innstillinger"
            className="rounded-md border border-border bg-background p-1.5 hover:border-primary">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {headline && (
        <div className="flex items-center gap-2 border-t border-border/40 bg-background/70 px-4 py-1 text-[10px] text-muted-foreground">
          <span className="rounded bg-accent/20 px-1.5 py-0.5 font-bold uppercase tracking-widest text-accent">News</span>
          <span className="truncate">{headline}</span>
        </div>
      )}
    </header>
  );
}

function IconBtn({ onClick, icon, label, title }: { onClick: () => void; icon: React.ReactNode; label: string; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 font-medium hover:bg-secondary/70">
      {icon} {label}
    </button>
  );
}

function Pill({ icon, label, value, accent, hot }: { icon?: React.ReactNode; label: string; value: string; accent?: boolean; hot?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 font-mono ${accent ? "bg-primary/15 text-primary neon-text" : hot ? "bg-destructive/20 text-destructive-foreground" : "bg-card/50"}`}>
      {icon}
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
