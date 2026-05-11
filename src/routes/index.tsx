import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame, dayName, timeStr, isOpen, absHour, INTENSITIES, type GameState, type Intensity } from "@/game/useGame";
import { LOCATIONS, ARCHETYPE_PORTRAITS, GIRL_MISSIONS, type Girl } from "@/game/data";
import {
  DISTRICTS, LOCATION_DEFS, LOCATION_ACTIONS,
  type LocationId,
} from "@/game/locations";
import { HotspotEditor, getHotspotsFor } from "@/components/game/HotspotEditor";
import { ProductionsSheet } from "@/components/game/ProductionsSheet";
import { OptionsMenu } from "@/components/game/OptionsMenu";
import { InventorySheet } from "@/components/game/InventorySheet";
import { STAGE_ORDER } from "@/game/productions";
import heroImg from "@/assets/bustville-hero.jpg";

export const Route = createFileRoute("/")({
  component: GamePage,
  head: () => ({
    meta: [
      { title: "Bustville Empire — Lula-style Tycoon Sim" },
      { name: "description", content: "Klikkbar tycoon-simulator: bygg et erotikk-imperium fra en rusten trailer i Bustville, Alabama." },
    ],
  }),
});

function GamePage() {
  const g = useGame();
  const [started, setStarted] = useState(false);
  const [selectedGirl, setSelectedGirl] = useState<string | undefined>();
  const [rosterOpen, setRosterOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);

  if (!g.loaded) return <div className="min-h-screen" />;

  if (!started && g.state.day === 1 && g.state.girls.length === 0 && g.state.hour === 8) {
    return <Splash onStart={() => setStarted(true)} onReset={g.reset} />;
  }
  if (g.state.won) {
    return <WinScreen onReset={() => { g.reset(); setStarted(false); }} />;
  }

  const district = DISTRICTS.find((d) => d.id === g.state.district)!;
  const activeLoc = g.state.activeLocation;

  return (
    <main className="min-h-screen pb-4">
      <HUD
        state={g.state}
        onOpenRoster={() => setRosterOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenProductions={() => setProdOpen(true)}
        onOpenInventory={() => setInvOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
        onSwitch={g.switchDistrict}
      />

      {activeLoc ? (
        <LocationView
          state={g.state}
          locId={activeLoc}
          selectedGirl={selectedGirl}
          onBack={g.backToMap}
          onPerform={(id, girlId, intensity) => g.perform(activeLoc, id, girlId ?? selectedGirl, intensity)}
          onOpenRoster={() => setRosterOpen(true)}
        />
      ) : (
        <MapView state={g.state} district={district} onGoTo={g.goTo} />
      )}

      {rosterOpen && (
        <RosterSheet
          state={g.state}
          selected={selectedGirl}
          onClose={() => setRosterOpen(false)}
          onSelect={(id) => setSelectedGirl(id === selectedGirl ? undefined : id)}
          onFire={g.fireGirl}
          onTrain={g.trainGirl}
          onGift={g.giftGirl}
          onStartMission={g.startMission}
          onCancelMission={g.cancelMission}
        />
      )}
      {statsOpen && (
        <StatsSheet state={g.state} onClose={() => setStatsOpen(false)} onUpgrade={g.upgradeStat} />
      )}
      {prodOpen && (
        <ProductionsSheet
          state={g.state}
          onClose={() => setProdOpen(false)}
          onStart={g.startProduction}
          onAdvance={g.advanceProduction}
          onAssign={g.assignToProduction}
          onSetRole={g.setCastRole}
          onCancel={g.cancelProduction}
          onUpgradeEquipment={g.upgradeEquipment}
        />
      )}
      {invOpen && (
        <InventorySheet state={g.state} onClose={() => setInvOpen(false)} />
      )}
      {optionsOpen && (
        <OptionsMenu
          onClose={() => setOptionsOpen(false)}
          onSave={g.saveToSlot}
          onLoad={g.loadFromSlot}
          onDelete={g.deleteSlot}
          onExport={g.exportSave}
          onImport={g.importSave}
          onReset={() => { g.reset(); setStarted(false); }}
        />
      )}

      <footer className="mx-auto mt-4 max-w-7xl px-3 text-center text-[10px] text-muted-foreground">
        <button onClick={() => { if (confirm("Slett all progresjon?")) { g.reset(); setStarted(false); } }} className="underline hover:text-primary">
          Reset
        </button>
        <span className="mx-2">·</span>
        Bustville Empire — A Lula-style satire.
      </footer>
    </main>
  );
}

/* ========== HUD ========== */
function HUD({ state, onOpenRoster, onOpenStats, onOpenProductions, onOpenInventory, onOpenOptions, onSwitch }: {
  state: GameState;
  onOpenRoster: () => void; onOpenStats: () => void; onOpenProductions: () => void;
  onOpenInventory: () => void; onOpenOptions: () => void; onSwitch: () => void;
}) {
  const loc = LOCATIONS[state.locationLevel - 1];
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 text-xs">
        <h1 className="font-display text-xl font-black uppercase neon-text mr-2">Bustville</h1>
        <Pill label="$" value={state.cash.toLocaleString()} accent />
        <Pill label="Rep" value={state.reputation.toString()} />
        <Pill label="Stam" value={`${state.stamina}/${state.maxStamina}`} />
        <Pill label="🥃" value={state.moonshine.toString()} />
        <Pill label="🔥" value={`${state.heatLevel}%`} hot={state.heatLevel > 40} />
        {state.loan > 0 && <Pill label="Loan" value={`$${state.loan}`} hot />}
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded bg-card/60 px-2 py-1 font-mono">
            {dayName(state.day)} d.{state.day} · {timeStr(state.hour)}
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            Lv{loc.level} {loc.name}
          </span>
          <button onClick={onOpenInventory} title="Inventar"
            className="rounded bg-secondary px-2 py-1 hover:bg-secondary/80">🎒 Lager</button>
          <button onClick={onOpenStats} className="rounded bg-secondary px-2 py-1 hover:bg-secondary/80">Boss</button>
          <button onClick={onOpenProductions} className="rounded bg-secondary px-2 py-1 hover:bg-secondary/80">
            🎬 Filmer ({state.productions.filter((p) => p.stageIdx < STAGE_ORDER.length).length})
          </button>
          <button onClick={onOpenRoster} className="rounded bg-primary px-2 py-1 text-primary-foreground hover:brightness-110">
            💋 Roster ({state.girls.length})
          </button>
          {state.locationLevel >= 3 && (
            <button onClick={onSwitch} className="rounded bg-accent px-2 py-1 text-accent-foreground hover:brightness-110">
              {state.district === "park" ? "→ Downtown" : "→ Park"}
            </button>
          )}
          <button onClick={onOpenOptions} title="Meny / Lagre / Innstillinger"
            className="rounded border border-border bg-background px-2 py-1 hover:border-primary">⚙️</button>
        </div>
      </div>
    </header>
  );
}

function Pill({ label, value, accent, hot }: { label: string; value: string; accent?: boolean; hot?: boolean }) {
  return (
    <div className={`rounded-md border border-border/60 px-2 py-1 font-mono ${accent ? "bg-primary/15 text-primary neon-text" : hot ? "bg-destructive/20 text-destructive-foreground" : "bg-card/50"}`}>
      <span className="mr-1 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/* ========== MAP ========== */
function MapView({ state, district, onGoTo }: {
  state: GameState; district: typeof DISTRICTS[number]; onGoTo: (id: LocationId) => void;
}) {
  const [editor, setEditor] = useState(false);
  const [hotspots, setHotspots] = useState(() => getHotspotsFor(district.id));

  useEffect(() => { setHotspots(getHotspotsFor(district.id)); }, [district.id]);
  useEffect(() => {
    const refresh = () => setHotspots(getHotspotsFor(district.id));
    window.addEventListener("hotspot-overrides-changed", refresh);
    return () => window.removeEventListener("hotspot-overrides-changed", refresh);
  }, [district.id]);

  return (
    <section className="mx-auto max-w-7xl px-3 pt-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Klikk en bygning</p>
          <h2 className="font-display text-3xl uppercase neon-text">{district.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">{district.tagline}</p>
          <button
            onClick={() => setEditor(true)}
            className="rounded border border-border bg-secondary/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-primary"
            title="Juster soner på kartet">
            🛠️ Sone-editor
          </button>
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border neon-border">
        <img src={district.image} alt={district.name} className="absolute inset-0 h-full w-full object-cover" loading="eager" width={1920} height={1080} />
        <div className="absolute inset-0 scan-lines opacity-15" />

        {hotspots.map((h) => {
          const def = LOCATION_DEFS[h.id];
          const locked = def.unlockLevel && state.locationLevel < def.unlockLevel;
          const open = isOpen(h.id, state.hour);
          return (
            <button
              key={h.id}
              onClick={() => !locked && onGoTo(h.id)}
              disabled={!!locked}
              className={`group absolute rounded-lg border-2 transition
                ${locked
                  ? "cursor-not-allowed border-destructive/40 bg-destructive/10"
                  : "border-primary/0 bg-primary/0 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_24px_oklch(0.7_0.28_350/0.7)]"}
              `}
              style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
              title={h.label}
            >
              <span className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition
                ${locked
                  ? "bg-destructive/80 text-destructive-foreground"
                  : open
                    ? "bg-primary text-primary-foreground opacity-0 group-hover:opacity-100"
                    : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-100"}
              `}>
                {locked ? `🔒 Lv ${def.unlockLevel}` : open ? h.label : `${h.label} (stengt)`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recent log strip */}
      <div className="mt-3 rounded-lg border border-border bg-card/60 p-2 text-xs">
        <div className="font-display text-[10px] uppercase tracking-widest text-accent">Hendelser</div>
        <div className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
          {state.log.slice(0, 6).map((line, i) => (
            <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{line}</p>
          ))}
        </div>
      </div>

      {editor && (
        <HotspotEditor district={district.id} mapImage={district.image} onClose={() => setEditor(false)} />
      )}
    </section>
  );
}

/* ========== LOCATION VIEW ========== */
function LocationView({ state, locId, selectedGirl, onBack, onPerform, onOpenRoster }: {
  state: GameState; locId: LocationId; selectedGirl?: string;
  onBack: () => void; onPerform: (actionId: string) => void; onOpenRoster: () => void;
}) {
  const def = LOCATION_DEFS[locId];
  const actions = LOCATION_ACTIONS[locId];
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3">
      <button onClick={onBack} className="mb-2 rounded-md bg-card/70 px-3 py-1 text-xs hover:bg-card">
        ← Tilbake til kartet
      </button>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-border neon-border">
          <img src={def.image} alt={def.name} className="aspect-[4/3] w-full object-cover" loading="eager" width={1024} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display text-4xl uppercase neon-text">{def.name}</h2>
            <p className="text-sm text-muted-foreground">{def.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <h3 className="font-display text-sm uppercase tracking-widest text-accent">Handlinger</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {selectedGirl ? "🎯 Stjerne valgt — bonus aktivert" : "Velg en stjerne i Roster for produksjons-bonus"}
            </p>
            <div className="mt-2 space-y-1.5">
              {actions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => a.id === "roster" ? onOpenRoster() : onPerform(a.id)}
                  className="flex w-full items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left hover:border-primary/60 hover:bg-secondary/80 transition"
                >
                  <span className="text-xl leading-none">{a.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{a.label}</span>
                      {a.hours > 0 && <span className="text-[10px] text-muted-foreground">~{a.hours}t</span>}
                    </div>
                    {a.desc && <div className="text-[10px] text-muted-foreground">{a.desc}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-3 text-xs">
            <div className="font-display text-[10px] uppercase tracking-widest text-accent">Logg</div>
            <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
              {state.log.slice(0, 8).map((line, i) => (
                <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== ROSTER SHEET ========== */
function RosterSheet({ state, selected, onClose, onSelect, onFire, onTrain, onGift, onStartMission, onCancelMission }: {
  state: GameState; selected?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  onFire: (id: string) => void;
  onTrain: (id: string) => void;
  onGift: (id: string) => void;
  onStartMission: (girlId: string, missionId: string) => void;
  onCancelMission: (girlId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase neon-text">Roster</h2>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">Lukk</button>
        </div>
        <p className="text-xs text-muted-foreground">
          {state.girls.length}/6 stjerner. Scout via Bar, Skog eller Velvet.
        </p>
        <div className="mt-3 space-y-3">
          {state.girls.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Ingen stjerner ennå.
            </p>
          )}
          {state.girls.map((g) => (
            <GirlCard key={g.id} g={g} selected={selected === g.id} nowAbs={absHour(state)}
              onSelect={() => onSelect(g.id)} onFire={onFire} onTrain={onTrain} onGift={onGift}
              onStartMission={onStartMission} onCancelMission={onCancelMission} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GirlCard({ g, selected, nowAbs, onSelect, onFire, onTrain, onGift, onStartMission, onCancelMission }: {
  g: Girl; selected: boolean; nowAbs: number;
  onSelect: () => void; onFire: (id: string) => void; onTrain: (id: string) => void; onGift: (id: string) => void;
  onStartMission: (girlId: string, mid: string) => void; onCancelMission: (girlId: string) => void;
}) {
  const portrait = ARCHETYPE_PORTRAITS[g.archetype];
  const onMission = !!g.mission;
  const hoursLeft = g.mission ? Math.max(0, g.mission.endsAt - nowAbs) : 0;
  return (
    <div onClick={onSelect}
      className={`rounded-lg border overflow-hidden cursor-pointer transition ${selected ? "border-primary bg-primary/10 neon-border" : "border-border bg-secondary/40 hover:bg-secondary/60"}`}>
      <div className="flex gap-3 p-2.5">
        <img src={portrait} alt={g.archetype} width={64} height={80}
          className="h-20 w-16 flex-none rounded-md object-cover border border-border" loading="lazy" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-bold truncate">{g.name}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">${g.salary}/uke</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-accent truncate">{g.archetype}</div>
          <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px]">
            <Stat label="Bea" v={g.beauty} />
            <Stat label="Perf" v={g.performance} />
            <Stat label="Pop" v={g.popularity} />
            <Stat label="Loy" v={g.loyalty} />
          </div>
        </div>
      </div>

      {/* Inline activity / mission */}
      {(onMission || g.lastActivity) && (
        <div className="border-t border-border/60 bg-background/40 px-2.5 py-1.5 text-[11px]">
          {onMission ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground">
                ⏳ <b>{g.mission!.label}</b> · ~${g.mission!.payout} · {hoursLeft}t igjen
              </span>
              <button onClick={(e) => { e.stopPropagation(); onCancelMission(g.id); }}
                className="rounded bg-destructive/70 px-1.5 py-0.5 text-[10px] text-destructive-foreground hover:bg-destructive">
                Hent hjem
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground">📌 {g.lastActivity}</span>
          )}
        </div>
      )}

      {selected && !onMission && (
        <div className="border-t border-border/60 bg-background/30 p-2 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-accent">Send på oppdrag</div>
          <div className="grid grid-cols-1 gap-1">
            {GIRL_MISSIONS.map((m) => {
              const stat = g[m.statKey];
              const locked = stat < m.min;
              return (
                <button key={m.id} disabled={locked}
                  onClick={(e) => { e.stopPropagation(); onStartMission(g.id, m.id); }}
                  className={`flex items-center justify-between rounded px-2 py-1 text-[11px] transition ${
                    locked ? "bg-background/40 text-muted-foreground opacity-50 cursor-not-allowed"
                           : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}>
                  <span>{m.emoji} {m.label}</span>
                  <span className="font-mono text-[10px] text-accent">
                    ~${m.basePay} · {m.hours}t {locked ? `· ${m.statKey} ${m.min}+` : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={(e) => { e.stopPropagation(); onTrain(g.id); }} className="rounded bg-secondary px-1.5 py-1 text-[10px] hover:bg-secondary/80">Train $200</button>
            <button onClick={(e) => { e.stopPropagation(); onGift(g.id); }} className="rounded bg-secondary px-1.5 py-1 text-[10px] hover:bg-secondary/80">Gift $150</button>
            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Sparke ${g.name}?`)) onFire(g.id); }} className="rounded bg-destructive/80 px-1.5 py-1 text-[10px] text-destructive-foreground hover:bg-destructive">Fire</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded bg-background/60 px-1 py-0.5 text-center">
      <div className="text-[8px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono font-bold text-accent">{v}</div>
    </div>
  );
}

/* ========== STATS SHEET ========== */
function StatsSheet({ state, onClose, onUpgrade }: {
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

/* ========== SPLASH / WIN ========== */
function Splash({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img src={heroImg} alt="Bustville at dusk" className="absolute inset-0 h-full w-full object-cover opacity-50" width={1536} height={896} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      <div className="absolute inset-0 scan-lines opacity-30" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">A Lula-style sim</p>
        <h1 className="mt-4 text-6xl font-black uppercase leading-none neon-text md:text-8xl">
          Bustville<br/>Empire
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Klikk deg gjennom byen. Brygg moonshine bak skuret, bestikk sheriffen,
          rekrutter dansere på Dirty Dan's, og bygg deg opp til neon-imperium.
        </p>
        <button
          onClick={() => { onReset(); onStart(); }}
          className="mt-10 rounded-xl bg-primary px-10 py-5 text-2xl font-black uppercase tracking-widest text-primary-foreground pulse-pink hover:brightness-110 transition"
        >
          ▶ Start a New Empire
        </button>
        <button onClick={onStart} className="mt-3 text-sm text-muted-foreground underline hover:text-foreground">
          Continue saved game
        </button>
        <p className="mt-10 text-xs text-muted-foreground/70">
          Satirical comedy game. All characters fictional. 18+.
        </p>
      </div>
    </main>
  );
}

function WinScreen({ onReset }: { onReset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <p className="text-accent uppercase tracking-[0.3em] text-xs">Epilogue</p>
        <h1 className="mt-3 text-6xl font-black neon-text">Porn King of the South</h1>
        <p className="mt-6 text-muted-foreground text-lg">
          Du startet i en rusten trailer. Nå har du et imperium.
        </p>
        <button onClick={onReset} className="mt-8 rounded-xl bg-primary px-8 py-4 font-black uppercase tracking-widest text-primary-foreground pulse-pink">
          Play Again
        </button>
      </div>
    </main>
  );
}
