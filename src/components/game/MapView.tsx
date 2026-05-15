import { useEffect, useState } from "react";
import { isOpen, type GameState } from "@/game/useGame";
import {
  formatDowntownRemainingRequirements,
  getDowntownUnlockGateStatus,
} from "@/game/progression";
import {
  DISTRICTS,
  LOCATION_DEFS,
  getDistrictTransitionLock,
  isSpecialHotspot,
  type LocationId,
} from "@/game/locations";
import { HotspotEditor, getHotspotsFor } from "@/components/game/HotspotEditor";
import { Wrench, ScrollText } from "lucide-react";

export function MapView({
  state,
  district,
  onGoTo,
  onSwitchDistrict,
}: {
  state: GameState;
  district: (typeof DISTRICTS)[number];
  onGoTo: (id: LocationId) => void;
  onSwitchDistrict: () => void;
}) {
  const [editor, setEditor] = useState(false);
  const [hotspots, setHotspots] = useState(() => getHotspotsFor(district.id));

  useEffect(() => {
    setHotspots(getHotspotsFor(district.id));
  }, [district.id]);
  useEffect(() => {
    const refresh = () => setHotspots(getHotspotsFor(district.id));
    window.addEventListener("hotspot-overrides-changed", refresh);
    return () => window.removeEventListener("hotspot-overrides-changed", refresh);
  }, [district.id]);

  // Day/night cycle driven by current hour with smoothstep easing.
  const h = state.hour;
  const smooth = (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  };
  let night = 1;
  if (h >= 8 && h <= 17) night = 0;
  else if (h > 4 && h < 8) night = 1 - smooth((h - 4) / 4);
  else if (h > 17 && h < 23) night = smooth((h - 17) / 6);

  const bell = (x: number, c: number, w: number) => {
    const d = Math.abs(x - c);
    return d >= w ? 0 : smooth(1 - d / w);
  };
  const warmth = Math.max(bell(h, 6, 2.5), bell(h, 19.5, 2.5));
  const hh = h < 4 ? h + 24 : h;
  const cool = Math.max(bell(h, 1.5, 3), bell(hh, 25.5, 3));

  const baseBrightness = 1 - 0.28 * night + 0.05 * warmth;
  const baseContrast = 1 + 0.06 * night + 0.08 * cool;
  const baseSaturate = 1 - 0.32 * night + 0.12 * warmth - 0.08 * cool;
  const mapFilter = `brightness(${baseBrightness}) contrast(${baseContrast}) saturate(${baseSaturate})`;
  const nightShadeOpacity = 0.42 * night + 0.18 * cool;
  const moonGlowOpacity = 0.22 * night + 0.18 * cool;

  return (
    <section className="relative h-full w-full overflow-hidden">
      <img
        src={district.image}
        alt={district.name}
        className="absolute inset-0 h-full w-full object-cover will-change-[filter]"
        style={{ filter: mapFilter, transition: "filter 1000ms linear" }}
        loading="eager"
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: nightShadeOpacity,
          background:
            "linear-gradient(180deg, oklch(0.18 0.03 270 / 0.78) 0%, oklch(0.14 0.03 250 / 0.58) 42%, oklch(0.12 0.02 20 / 0.62) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-1000"
        style={{
          opacity: moonGlowOpacity,
          background:
            "radial-gradient(circle at 72% 18%, oklch(0.72 0.08 250 / 0.34) 0%, transparent 28%), radial-gradient(circle at 24% 12%, oklch(0.66 0.1 220 / 0.18) 0%, transparent 24%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-1000"
        style={{
          opacity: warmth * 0.85,
          background:
            "linear-gradient(180deg, oklch(0.78 0.18 55 / 0.55) 0%, oklch(0.65 0.22 30 / 0.35) 55%, transparent 100%)",
        }}
      />
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

      <div className="absolute left-4 top-4 z-10 max-w-xs rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 backdrop-blur">
        <p className="text-[9px] uppercase tracking-[0.3em] text-accent leading-tight">
          Klikk en bygning
        </p>
        <h2 className="font-display text-2xl uppercase neon-text leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          {district.name}
        </h2>
        <p className="text-[10px] text-foreground/80 leading-tight">{district.tagline} · ⚠️ {state.activeEvents.length} pending</p>
      </div>

      <button
        onClick={() => setEditor(true)}
        className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur hover:border-primary"
        title="Juster soner på kartet"
      >
        <Wrench className="h-3 w-3" /> Editor
      </button>

      {district.id === "park" &&
        (() => {
          const exit = hotspots.find((z) => z.id === "downtown_exit");
          if (!exit) return null;
          const transition = getDistrictTransitionLock(state, "downtown");
          const unlocked = !transition.locked;
          const gate = getDowntownUnlockGateStatus(state);
          const req = gate.required;
          const readyForPromotion = gate.canUnlock;
          const checks = [
            {
              label: "Cash",
              current: `$${state.cash.toLocaleString()}`,
              required: `$${req.cash.toLocaleString()}`,
              ok: state.cash >= req.cash,
            },
            {
              label: "Rep",
              current: state.reputation.toString(),
              required: req.reputation.toString(),
              ok: state.reputation >= req.reputation,
            },
            {
              label: "First Hit",
              current: state.milestones.firstHit ? "Done" : "Missing",
              required: "Required",
              ok: state.milestones.firstHit,
            },
            {
              label: "Heat",
              current: `${state.heatLevel}%`,
              required: `≤ ${req.maxHeat}%`,
              ok: state.heatLevel <= req.maxHeat,
            },
          ];
          return (
            <>
              {!unlocked && (
                <div className="absolute left-4 top-24 z-10 w-80 rounded-lg border border-border/60 bg-background/80 p-3 text-[11px] backdrop-blur">
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
                    Downtown Unlock Progress
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Fyll kravene for å oppgradere til Level 3 og åpne Downtown.
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {checks.map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center justify-between rounded border border-border/50 bg-card/40 px-2 py-1"
                      >
                        <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                          {c.ok ? "✅" : "⬜"} {c.label}
                        </span>
                        <span className="font-mono text-[10px]">
                          {c.current} / {c.required}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {readyForPromotion ? "Klar for upgrade i traileren." : "Mangler fortsatt krav."}
                  </p>
                </div>
              )}
              <button
                onClick={() => unlocked && onSwitchDistrict()}
                disabled={!unlocked}
                className={`group absolute z-10 flex items-end justify-center rounded-lg border-2 border-dashed transition
              ${
                unlocked
                  ? "cursor-pointer border-accent/60 bg-accent/0 hover:bg-accent/15 hover:shadow-[0_0_28px_oklch(0.85_0.22_95/0.55)]"
                  : "cursor-not-allowed border-muted-foreground/30 bg-background/0 hover:bg-background/20"
              }`}
                style={{
                  left: `${exit.x}%`,
                  top: `${exit.y}%`,
                  width: `${exit.w}%`,
                  height: `${exit.h}%`,
                }}
                title={unlocked ? "Kjør til Downtown" : (transition.reason ?? "Downtown er låst")}
              >
                <div
                  className={`pointer-events-none mb-2 max-w-[220px] rounded-md border bg-background/90 px-2 py-1.5 text-[10px] backdrop-blur opacity-0 transition-opacity group-hover:opacity-100
              ${unlocked ? "border-accent/60" : "border-muted-foreground/40"}`}
                >
                  {unlocked ? (
                    <p className="font-display uppercase tracking-widest text-accent">
                      🛣️ Kjør til Downtown →
                    </p>
                  ) : (
                    <>
                      <p className="font-display uppercase tracking-widest text-muted-foreground">
                        🔒 Veien er stengt
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {formatDowntownRemainingRequirements(state)}
                      </p>
                    </>
                  )}
                </div>
              </button>
            </>
          );
        })()}

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
              ${
                locked
                  ? "cursor-not-allowed border-destructive/40 bg-destructive/10"
                  : "border-primary/0 bg-primary/0 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_24px_oklch(0.7_0.28_350/0.7)]"
              }
            `}
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            title={h.label}
          >
            <span
              className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition
              ${
                locked
                  ? "bg-destructive/80 text-destructive-foreground"
                  : open
                    ? "bg-primary text-primary-foreground opacity-0 group-hover:opacity-100"
                    : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-100"
              }
            `}
            >
              {locked ? `🔒 Lv ${def.unlockLevel}` : open ? h.label : `${h.label} (stengt)`}
            </span>
          </button>
        );
      })}

      <details
        className="group absolute bottom-4 right-4 z-10 w-72 rounded-lg border border-border bg-background/85 text-xs backdrop-blur open:shadow-[0_0_24px_oklch(0.7_0.28_350/0.25)]"
        open
      >
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 font-display text-[10px] uppercase tracking-widest text-accent hover:bg-secondary/40">
          <ScrollText className="h-3 w-3" /> Hendelser
          <span className="ml-auto text-muted-foreground transition group-open:rotate-180">▾</span>
        </summary>
        <div className="max-h-40 space-y-0.5 overflow-y-auto border-t border-border/50 px-2.5 py-1.5">
          {state.log.slice(0, 8).map((line, i) => (
            <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
              {line}
            </p>
          ))}
        </div>
      </details>

      {editor && (
        <HotspotEditor
          district={district.id}
          mapImage={district.image}
          onClose={() => setEditor(false)}
        />
      )}
    </section>
  );
}
