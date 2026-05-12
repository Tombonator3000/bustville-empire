import { useEffect, useState } from "react";
import { absHour, INTENSITIES, type GameState, type Intensity } from "@/game/useGame";
import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { LOCATION_DEFS, LOCATION_ACTIONS, type LocationId } from "@/game/locations";
import { getLocationImage } from "@/components/game/HotspotEditor";
import { ArrowLeft } from "lucide-react";

export function LocationView({ state, locId, selectedGirl, onBack, onPerform, onOpenRoster }: {
  state: GameState; locId: LocationId; selectedGirl?: string;
  onBack: () => void;
  onPerform: (actionId: string, girlId?: string, intensity?: Intensity) => void;
  onOpenRoster: () => void;
}) {
  const def = LOCATION_DEFS[locId];
  const actions = LOCATION_ACTIONS[locId];
  const [openId, setOpenId] = useState<string | null>(null);
  const SIMPLE = new Set(["sleep", "roster", "upgrade", "distillUp", "upgradeStudio", "repay", "loan", "supplies", "hideStash", "bribe"]);
  return (
    <section className="w-full px-4 pt-3">
      <button onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-card/70 px-3 py-1 text-xs hover:bg-card">
        <ArrowLeft className="h-3.5 w-3.5" /> Tilbake til kartet
      </button>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative h-[calc(100vh-12rem)] min-h-[420px] overflow-hidden rounded-xl border border-border neon-border lg:col-span-7">
          <img src={getLocationImage(locId, def.image)} alt={def.name} className="absolute inset-0 h-full w-full object-cover" loading="eager" width={1024} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display text-4xl uppercase neon-text drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">{def.name}</h2>
            <p className="text-sm text-foreground/85">{def.description}</p>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-5 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-xl border border-border bg-card/60">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b border-border/60 bg-card/95 px-3 py-2 backdrop-blur">
              <h3 className="font-display text-sm uppercase tracking-widest text-accent">Handlinger</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${selectedGirl ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground"}`}>
                {selectedGirl ? `★ ${state.girls.find(g => g.id === selectedGirl)?.name ?? "valgt"}` : "Ingen stjerne valgt"}
              </span>
            </div>
            <div className="px-3 pt-2 pb-3">
            <p className="text-[10px] text-muted-foreground">
              {selectedGirl ? "🎯 Bonus aktivert. Trykk en jobb for å justere innstillinger." : "Tips: trykk en jobb for å velge stjerne + intensitet."}
            </p>
            <div className="mt-2 space-y-1.5">
              {actions.map((a) => {
                const isSimple = SIMPLE.has(a.id);
                const isWebcam = locId === "trailer" && a.id === "webcam";
                const isVisit  = locId === "trailer" && a.id === "visit";
                const usesModal = isWebcam || isVisit;
                const open = openId === a.id;
                if (isSimple || usesModal) {
                  return (
                    <button
                      key={a.id}
                      onClick={() => a.id === "roster" ? onOpenRoster() : onPerform(a.id)}
                      className="flex w-full items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left hover:border-primary/60 hover:bg-secondary/80 transition"
                    >
                      <span className="text-xl leading-none">{a.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{a.label}{usesModal && " ▸"}</span>
                          {a.hours > 0 && <span className="text-[10px] text-muted-foreground">~{a.hours}t</span>}
                        </div>
                        {a.desc && <div className="text-[10px] text-muted-foreground">{a.desc}</div>}
                        {usesModal && (
                          <div className="text-[10px] text-accent/80">Velg jente, type & intensitet</div>
                        )}
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
