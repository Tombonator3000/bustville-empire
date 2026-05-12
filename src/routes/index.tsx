import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame, dayName, timeStr, isOpen, absHour, INTENSITIES, type GameState, type Intensity } from "@/game/useGame";
import { LOCATIONS, ARCHETYPE_PORTRAITS, GIRL_MISSIONS, type Girl } from "@/game/data";
import {
  DISTRICTS, LOCATION_DEFS, LOCATION_ACTIONS, isSpecialHotspot,
  type LocationId,
} from "@/game/locations";
import { HotspotEditor, getHotspotsFor, getLocationImage } from "@/components/game/HotspotEditor";
import { ProductionsSheet } from "@/components/game/ProductionsSheet";
import { OptionsMenu } from "@/components/game/OptionsMenu";
import { InventorySheet } from "@/components/game/InventorySheet";
import { GallerySheet } from "@/components/game/GallerySheet";
import { WebcamModal } from "@/components/game/WebcamModal";
import { STAGE_ORDER } from "@/game/productions";
import heroImg from "@/assets/bustville-hero.jpg";
import {
  DollarSign, Star, Zap, Flame, Wine, Calendar, Backpack, Crown,
  Clapperboard, Users, ArrowLeftRight, Settings, ArrowLeft, Wrench, ScrollText, Image as ImageIcon,
} from "lucide-react";

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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);

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
    <main className="relative min-h-screen w-full">
      <HUD
        state={g.state}
        onOpenRoster={() => setRosterOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenProductions={() => setProdOpen(true)}
        onOpenInventory={() => setInvOpen(true)}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
        onSwitch={g.switchDistrict}
      />

      {activeLoc ? (
        <LocationView
          state={g.state}
          locId={activeLoc}
          selectedGirl={selectedGirl}
          onBack={g.backToMap}
          onPerform={(id, girlId, intensity) => {
            // Trailer webcam uses dedicated modal
            if (activeLoc === "trailer" && id === "webcam") { setWebcamOpen(true); return; }
            g.perform(activeLoc, id, girlId ?? selectedGirl, intensity);
          }}
          onOpenRoster={() => setRosterOpen(true)}
        />
      ) : (
        <MapView state={g.state} district={district} onGoTo={g.goTo} onSwitchDistrict={g.switchDistrict} />
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
          onResign={g.resignGirl}
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
      {galleryOpen && (
        <GallerySheet girls={g.state.girls} onClose={() => setGalleryOpen(false)} />
      )}
      {webcamOpen && (
        <WebcamModal
          state={g.state}
          onClose={() => setWebcamOpen(false)}
          onRun={(showId, girlId, intensity) => g.webcamShow(showId, girlId, intensity)}
          onUpgrade={g.upgradeWebcamLevel}
        />
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

      <footer className="mx-auto mt-4 max-w-7xl px-3 pb-3 text-center text-[10px] text-muted-foreground">
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
function HUD({ state, onOpenRoster, onOpenStats, onOpenProductions, onOpenInventory, onOpenGallery, onOpenOptions, onSwitch }: {
  state: GameState;
  onOpenRoster: () => void; onOpenStats: () => void; onOpenProductions: () => void;
  onOpenInventory: () => void; onOpenGallery: () => void; onOpenOptions: () => void; onSwitch: () => void;
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

/* ========== MAP ========== */
function MapView({ state, district, onGoTo, onSwitchDistrict }: {
  state: GameState; district: typeof DISTRICTS[number]; onGoTo: (id: LocationId) => void; onSwitchDistrict: () => void;
}) {
  const [editor, setEditor] = useState(false);
  const [hotspots, setHotspots] = useState(() => getHotspotsFor(district.id));

  useEffect(() => { setHotspots(getHotspotsFor(district.id)); }, [district.id]);
  useEffect(() => {
    const refresh = () => setHotspots(getHotspotsFor(district.id));
    window.addEventListener("hotspot-overrides-changed", refresh);
    return () => window.removeEventListener("hotspot-overrides-changed", refresh);
  }, [district.id]);

  // Day/night cycle driven by current hour with smoothstep easing.
  //   night [0..1]   — 0 = full day, 1 = deep night
  //   warmth [0..1]  — peaks at dawn (~6) and sunset (~19) for golden-hour tint
  //   cool   [0..1]  — peaks around 1-3am for cold moonlight tint
  const h = state.hour;
  const smooth = (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  };
  let night = 1;
  if (h >= 8 && h <= 17) night = 0;
  else if (h > 4 && h < 8) night = 1 - smooth((h - 4) / 4);
  else if (h > 17 && h < 23) night = smooth((h - 17) / 6);
  const nightOpacity = night;

  // Bell curve helper around center c with half-width w
  const bell = (x: number, c: number, w: number) => {
    const d = Math.abs(x - c);
    return d >= w ? 0 : smooth(1 - d / w);
  };
  // Warm golden hour: dawn around 6:00 (4→8) and dusk around 19:00 (17→21)
  const warmth = Math.max(bell(h, 6, 2.5), bell(h, 19.5, 2.5));
  // Cool deep-night: peaks around 1:30 (handle wrap by mapping)
  const hh = h < 4 ? h + 24 : h; // 0..3 → 24..27
  const cool = Math.max(bell(h, 1.5, 3), bell(hh, 25.5, 3));

  // Day image filters: gently dim & desaturate as night approaches
  const dayBrightness = 1 - 0.18 * night;
  const dayContrast = 1 + 0.08 * night;
  const daySaturate = 1 - 0.35 * night + 0.1 * warmth;
  const dayFilter = `brightness(${dayBrightness}) contrast(${dayContrast}) saturate(${daySaturate})`;

  // Night image: extra cool tint & contrast at deepest night
  const nightBrightness = 0.85 + 0.15 * (1 - cool);
  const nightContrast = 1 + 0.15 * cool;
  const nightSaturate = 0.7 + 0.4 * cool;
  const nightFilter = `brightness(${nightBrightness}) contrast(${nightContrast}) saturate(${nightSaturate})`;

  return (
    <section className="relative h-[calc(100vh-3.25rem)] w-full overflow-hidden">
      {/* Full-bleed background map (day) */}
      <img
        src={district.image}
        alt={district.name}
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-1000"
        style={{ filter: dayFilter }}
        loading="eager"
        width={1920}
        height={1080}
      />
      {/* Night overlay image, faded in by hour */}
      {district.nightImage && (
        <img
          src={district.nightImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 pointer-events-none"
          style={{ opacity: nightOpacity, filter: nightFilter }}
          width={1920}
          height={1080}
        />
      )}
      {/* Warm golden-hour tint (dawn/dusk) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-1000"
        style={{
          opacity: warmth * 0.85,
          background:
            "linear-gradient(180deg, oklch(0.78 0.18 55 / 0.55) 0%, oklch(0.65 0.22 30 / 0.35) 55%, transparent 100%)",
        }}
      />
      {/* Cool moonlight tint (deep night) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-1000"
        style={{
          opacity: cool * 0.7,
          background:
            "linear-gradient(180deg, oklch(0.45 0.12 250 / 0.6) 0%, oklch(0.35 0.14 270 / 0.45) 100%)",
        }}
      />
      <div className="absolute inset-0 scan-lines opacity-15 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/70 pointer-events-none" />

      {/* Title overlay */}
      <div className="absolute left-4 top-4 z-10 flex items-start gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Klikk en bygning</p>
          <h2 className="font-display text-4xl uppercase neon-text drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">{district.name}</h2>
          <p className="mt-0.5 text-xs text-foreground/80">{district.tagline}</p>
        </div>
      </div>

      {/* Sone-editor */}
      <button
        onClick={() => setEditor(true)}
        className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur hover:border-primary"
        title="Juster soner på kartet">
        <Wrench className="h-3.5 w-3.5" /> Sone-editor
      </button>

      {/* Road-exit to Downtown — hover hint on the road edge (editable in Sone-editor) */}
      {district.id === "park" && (() => {
        const exit = hotspots.find((z) => z.id === "downtown_exit");
        if (!exit) return null;
        const unlocked = state.locationLevel >= 3;
        return (
          <button
            onClick={() => unlocked && onSwitchDistrict()}
            disabled={!unlocked}
            className={`group absolute z-10 flex items-end justify-center rounded-lg border-2 border-dashed transition
              ${unlocked
                ? "cursor-pointer border-accent/60 bg-accent/0 hover:bg-accent/15 hover:shadow-[0_0_28px_oklch(0.85_0.22_95/0.55)]"
                : "cursor-not-allowed border-muted-foreground/30 bg-background/0 hover:bg-background/20"}`}
            style={{ left: `${exit.x}%`, top: `${exit.y}%`, width: `${exit.w}%`, height: `${exit.h}%` }}
            title={unlocked ? "Kjør til Downtown" : "Veien til Downtown åpner på Level 3"}
          >
            <div className={`pointer-events-none mb-2 max-w-[220px] rounded-md border bg-background/90 px-2 py-1.5 text-[10px] backdrop-blur opacity-0 transition-opacity group-hover:opacity-100
              ${unlocked ? "border-accent/60" : "border-muted-foreground/40"}`}>
              {unlocked ? (
                <p className="font-display uppercase tracking-widest text-accent">🛣️ Kjør til Downtown →</p>
              ) : (
                <>
                  <p className="font-display uppercase tracking-widest text-muted-foreground">🔒 Veien er stengt · Lv 3</p>
                  <p className="mt-0.5 text-muted-foreground">Når du når <span className="font-bold text-foreground">Level 3</span> åpnes Downtown med 🎥 Camera Shack, 👗 Glitter & Garter, 🎭 Casting og 📼 Reel Republic.</p>
                </>
              )}
            </div>
          </button>
        );
      })()}


      {/* Hotspots */}
      {hotspots.map((h) => {
        if (isSpecialHotspot(h.id)) return null;
        const locId = h.id as LocationId;
        const def = LOCATION_DEFS[locId];
        const locked = def.unlockLevel && state.locationLevel < def.unlockLevel;
        const open = isOpen(locId, state.hour);
        return (
          <button
            key={h.id}
            onClick={() => !locked && onGoTo(locId)}
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


      {/* Floating event log */}
      <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-2xl rounded-lg border border-border bg-background/80 p-2 text-xs backdrop-blur">
        <div className="flex items-center gap-1.5 font-display text-[10px] uppercase tracking-widest text-accent">
          <ScrollText className="h-3 w-3" /> Hendelser
        </div>
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
  onBack: () => void;
  onPerform: (actionId: string, girlId?: string, intensity?: Intensity) => void;
  onOpenRoster: () => void;
}) {
  const def = LOCATION_DEFS[locId];
  const actions = LOCATION_ACTIONS[locId];
  const [openId, setOpenId] = useState<string | null>(null);
  // Action ids that don't involve a working girl / shouldn't show picker
  const SIMPLE = new Set(["sleep", "roster", "upgrade", "distillUp", "upgradeStudio", "repay", "loan", "supplies", "hideStash", "bribe"]);
  return (
    <section className="w-full px-4 pt-3">
      <button onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-card/70 px-3 py-1 text-xs hover:bg-card">
        <ArrowLeft className="h-3.5 w-3.5" /> Tilbake til kartet
      </button>

      <div className="grid gap-3 lg:grid-cols-[1.8fr_1fr]">
        <div className="relative h-[calc(100vh-9rem)] min-h-[420px] overflow-hidden rounded-xl border border-border neon-border">
          <img src={getLocationImage(locId, def.image)} alt={def.name} className="absolute inset-0 h-full w-full object-cover" loading="eager" width={1024} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display text-4xl uppercase neon-text drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">{def.name}</h2>
            <p className="text-sm text-foreground/85">{def.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <h3 className="font-display text-sm uppercase tracking-widest text-accent">Handlinger</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {selectedGirl ? "🎯 Stjerne valgt — bonus aktivert. Trykk en jobb for å justere innstillinger." : "Tips: trykk en jobb for å velge hvilken stjerne + intensitet."}
            </p>
            <div className="mt-2 space-y-1.5">
              {actions.map((a) => {
                const isSimple = SIMPLE.has(a.id);
                const open = openId === a.id;
                if (isSimple) {
                  return (
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
                  );
                }
                return (
                  <ActionRow
                    key={a.id}
                    action={a}
                    open={open}
                    onToggle={() => setOpenId(open ? null : a.id)}
                    girls={state.girls}
                    nowAbs={absHour(state)}
                    defaultGirl={selectedGirl}
                    onRun={(girlId, intensity) => {
                      onPerform(a.id, girlId, intensity);
                      setOpenId(null);
                    }}
                  />
                );
              })}
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

/* ========== ACTION ROW (with girl + intensity picker) ========== */
function ActionRow({ action, open, onToggle, girls, nowAbs, defaultGirl, onRun }: {
  action: { id: string; label: string; emoji: string; hours: number; desc?: string };
  open: boolean;
  onToggle: () => void;
  girls: Girl[];
  nowAbs: number;
  defaultGirl?: string;
  onRun: (girlId: string | undefined, intensity: Intensity) => void;
}) {
  const isAvailable = (g: Girl) => !g.mission && (!g.busyUntil || g.busyUntil <= nowAbs);
  const statusOf = (g: Girl): { ok: boolean; label: string } => {
    if (g.mission) return { ok: false, label: `⏳ ${g.mission.label} ${Math.max(0, g.mission.endsAt - nowAbs)}t` };
    if (g.busyUntil && g.busyUntil > nowAbs) return { ok: false, label: `💤 hviler ${g.busyUntil - nowAbs}t` };
    return { ok: true, label: "✓ klar" };
  };

  const initialGirl = defaultGirl && girls.find((g) => g.id === defaultGirl && isAvailable(g)) ? defaultGirl : undefined;
  const [girlId, setGirlId] = useState<string | undefined>(initialGirl);
  const [intensity, setIntensity] = useState<Intensity>("standard");
  useEffect(() => { if (open) setGirlId(initialGirl); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, defaultGirl]);

  const selectedGirlObj = girlId ? girls.find((g) => g.id === girlId) : undefined;
  const selectedBlocked = selectedGirlObj && !isAvailable(selectedGirlObj);
  return (
    <div className={`rounded-lg border ${open ? "border-primary/70 bg-secondary/60" : "border-border bg-secondary/40"} transition`}>
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-secondary/70"
      >
        <span className="text-xl leading-none">{action.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold">{action.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {action.hours > 0 ? `~${action.hours}t` : ""} {open ? "▾" : "▸"}
            </span>
          </div>
          {action.desc && <div className="text-[10px] text-muted-foreground">{action.desc}</div>}
          {!open && (
            <div className="text-[10px] text-accent/80">
              {girlId
                ? `★ ${selectedGirlObj?.name ?? "—"}${selectedBlocked ? " (utilgjengelig)" : ""}`
                : "Trykk for å velge stjerne & intensitet"}
            </div>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border/60 p-2.5">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Hvem jobber?</div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setGirlId(undefined)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                  !girlId ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                }`}
              >
                Solo (du selv)
              </button>
              {girls.length === 0 && (
                <span className="text-[10px] text-muted-foreground">Ingen stjerner i roster.</span>
              )}
              {girls.map((g) => {
                const on = girlId === g.id;
                const st = statusOf(g);
                const disabled = !st.ok;
                return (
                  <button
                    key={g.id}
                    disabled={disabled}
                    onClick={() => setGirlId(g.id)}
                    title={`${g.archetype} · Bea ${g.beauty} · Perf ${g.performance} · Pop ${g.popularity} · ${st.label}`}
                    className={`flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                      on ? "border-primary bg-primary/20 text-foreground"
                         : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                    } ${disabled ? "opacity-40 cursor-not-allowed hover:border-border" : ""}`}
                  >
                    <img src={ARCHETYPE_PORTRAITS[g.archetype]} alt="" width={18} height={18}
                      className="h-4 w-4 rounded-full object-cover" loading="lazy" />
                    {on ? "★ " : ""}{g.name}
                    <span className={`ml-1 text-[9px] ${st.ok ? "text-accent" : "text-destructive"}`}>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Intensitet</div>
            <div className="grid grid-cols-3 gap-1">
              {INTENSITIES.map((m) => {
                const on = intensity === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setIntensity(m.id)}
                    title={m.hint}
                    className={`rounded-md border px-2 py-1 text-[10px] transition ${
                      on ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background/60 text-muted-foreground hover:border-primary/60"
                    }`}
                  >
                    <div className="text-base leading-none">{m.emoji}</div>
                    <div className="mt-0.5 font-bold">{m.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {INTENSITIES.find((m) => m.id === intensity)?.hint}
            </p>
          </div>

          <button
            disabled={!!selectedBlocked}
            onClick={() => onRun(girlId, intensity)}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-bold uppercase text-primary-foreground hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedBlocked ? "⛔ Velg en ledig stjerne" : `${action.emoji} Kjør ${action.label}`}
          </button>
        </div>
      )}
    </div>
  );
}


/* ========== ROSTER SHEET ========== */
function RosterSheet({ state, selected, onClose, onSelect, onFire, onTrain, onGift, onResign, onStartMission, onCancelMission }: {
  state: GameState; selected?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  onFire: (id: string) => void;
  onTrain: (id: string) => void;
  onGift: (id: string) => void;
  onResign: (id: string, lengthWeeks?: 4 | 8 | 12) => void;
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
            <GirlCard key={g.id} g={g} selected={selected === g.id} nowAbs={absHour(state)} currentDay={state.day}
              onSelect={() => onSelect(g.id)} onFire={onFire} onTrain={onTrain} onGift={onGift} onResign={onResign}
              onStartMission={onStartMission} onCancelMission={onCancelMission} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GirlCard({ g, selected, nowAbs, currentDay, onSelect, onFire, onTrain, onGift, onResign, onStartMission, onCancelMission }: {
  g: Girl; selected: boolean; nowAbs: number; currentDay: number;
  onSelect: () => void; onFire: (id: string) => void; onTrain: (id: string) => void; onGift: (id: string) => void;
  onResign: (id: string, lengthWeeks?: 4 | 8 | 12) => void;
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
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              ${g.contract ? Math.max(g.salary, g.contract.weeklyMin) : g.salary}/uke
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-accent truncate">{g.archetype}</div>
          <div className="mt-1 text-[10px]">
            {g.contract ? (
              <span className="text-emerald-300/90">
                📜 Kontrakt: utløper d.{g.contract.expiresDay} ({Math.max(0, g.contract.expiresDay - currentDay)} dager igjen)
              </span>
            ) : (
              <span className="text-amber-300">⚠️ Free agent — re-sign før hun stikker.</span>
            )}
          </div>
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
          {!g.contract && (
            <div className="rounded border border-amber-400/40 bg-amber-400/10 p-1.5">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-amber-300">Re-sign kontrakt</div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={(e) => { e.stopPropagation(); onResign(g.id, 4); }} className="rounded bg-secondary px-1 py-1 text-[10px] hover:bg-secondary/80">4 uker</button>
                <button onClick={(e) => { e.stopPropagation(); onResign(g.id, 8); }} className="rounded bg-secondary px-1 py-1 text-[10px] hover:bg-secondary/80">8 uker</button>
                <button onClick={(e) => { e.stopPropagation(); onResign(g.id, 12); }} className="rounded bg-secondary px-1 py-1 text-[10px] hover:bg-secondary/80">12 uker</button>
              </div>
            </div>
          )}
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
