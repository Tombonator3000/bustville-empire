import { useState } from "react";
import { WEBCAM_SHOWS, WEBCAM_UPGRADE_COST, ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import {
  absHour,
  INTENSITIES,
  intensityCooldownHours,
  previewHeat,
  type GameState,
  type Intensity,
} from "@/game/useGame";

export function WebcamModal({
  state,
  onClose,
  onRun,
  onUpgrade,
}: {
  state: GameState;
  onClose: () => void;
  onRun: (showId: string, girlId: string | undefined, intensity: Intensity) => void;
  onUpgrade: () => void;
}) {
  const [girlId, setGirlId] = useState<string | undefined>();
  const [showId, setShowId] = useState<string>(WEBCAM_SHOWS[0].id);
  const [intensity, setIntensity] = useState<Intensity>("standard");

  const show = WEBCAM_SHOWS.find((s) => s.id === showId)!;
  const locked = show.level > state.webcamLevel;
  const upgradeCost =
    state.webcamLevel < WEBCAM_SHOWS.length ? WEBCAM_UPGRADE_COST(state.webcamLevel) : 0;
  const nowAbs = absHour(state);
  const isAvailable = (g: Girl) => !g.mission && (!g.busyUntil || g.busyUntil <= nowAbs);
  const selectedGirl = girlId ? state.girls.find((g) => g.id === girlId) : undefined;
  const selectedBlocked = selectedGirl && !isAvailable(selectedGirl);
  const heat = previewHeat(0, intensity);
  const staminaCost = show.hours * 4;
  const cooldownHours = selectedGirl ? intensityCooldownHours(show.hours, intensity) : 0;
  const hasRiskRoll = !!selectedGirl && intensity === "intense" && show.id === "toys";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1040px] overflow-hidden rounded-2xl border border-primary/60 bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border bg-secondary/40 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-accent">
              Trailer · Webcam-rigg
            </div>
            <h3 className="font-display text-2xl uppercase neon-text">💻 Velg Show</h3>
            <p className="text-[10px] text-muted-foreground">
              Rigg-nivå {state.webcamLevel}/{WEBCAM_SHOWS.length}
            </p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-2 py-1 text-xs">
            ✕
          </button>
        </div>

        <div className="grid gap-4 p-3 lg:grid-cols-2">
          {/* Show types */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Type show
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {WEBCAM_SHOWS.map((s) => {
                const sLocked = s.level > state.webcamLevel;
                const on = showId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => !sLocked && setShowId(s.id)}
                    disabled={sLocked}
                    className={`flex items-stretch gap-2 overflow-hidden rounded-lg border text-left transition ${
                      sLocked
                        ? "cursor-not-allowed border-destructive/40 bg-destructive/5 opacity-60"
                        : on
                          ? "border-primary bg-primary/15"
                          : "border-border bg-secondary/40 hover:border-primary/60"
                    }`}
                  >
                    <img
                      src={s.cover}
                      alt=""
                      loading="lazy"
                      className="h-16 w-20 shrink-0 object-cover"
                    />
                    <div className="flex-1 py-2 pr-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold">
                          {s.emoji} {s.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ~${s.basePay} · {s.hours}t · ${s.cost}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{s.flavor}</div>
                      {sLocked && (
                        <div className="text-[10px] font-bold text-destructive">
                          🔒 Krever webcam-rigg Lv {s.level}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgrade */}
          {state.webcamLevel < WEBCAM_SHOWS.length && (
            <button
              onClick={onUpgrade}
              disabled={state.cash < upgradeCost}
              className="w-full rounded-lg border border-accent/60 bg-accent/15 px-3 py-2 text-left transition hover:bg-accent/25 disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-accent">
                  📡 Oppgrader webcam-rigg → Lv {state.webcamLevel + 1}
                </span>
                <span className="text-xs">${upgradeCost}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Låser opp: {WEBCAM_SHOWS.find((w) => w.level === state.webcamLevel + 1)?.label}
              </div>
            </button>
          )}

          {/* Girl picker */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Hvem opptrer?
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setGirlId(undefined)}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  !girlId
                    ? "border-primary bg-primary/20"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                }`}
              >
                Solo (du)
              </button>
              {state.girls.length === 0 && (
                <span className="text-[10px] text-muted-foreground">Ingen stjerner.</span>
              )}
              {state.girls.map((g) => {
                const ok = isAvailable(g);
                const on = girlId === g.id;
                return (
                  <button
                    key={g.id}
                    disabled={!ok}
                    onClick={() => setGirlId(g.id)}
                    title={ok ? g.archetype : "Utilgjengelig"}
                    className={`flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] transition ${
                      on
                        ? "border-primary bg-primary/20"
                        : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
                    } ${!ok ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <img
                      src={ARCHETYPE_PORTRAITS[g.archetype]}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    {on ? "★ " : ""}
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Intensitet
            </div>
            <div className="grid grid-cols-3 gap-1">
              {INTENSITIES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setIntensity(m.id)}
                  title={m.hint}
                  className={`rounded-md border px-2 py-1 text-[10px] transition ${
                    intensity === m.id
                      ? "border-primary bg-primary/20"
                      : "border-border bg-background/60 text-muted-foreground hover:border-primary/60"
                  }`}
                >
                  <div className="text-base leading-none">{m.emoji}</div>
                  <div className="mt-0.5 font-bold">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-border/70 bg-background/40 px-2 py-1.5 text-[10px]">
            <div className="font-bold uppercase tracking-wider text-accent">Før du går live</div>
            <div className="mt-1 flex items-center justify-between">
              <span>Heat</span>
              <span>+{heat.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Energi/tid</span>
              <span>
                -{staminaCost} stamina · {show.hours}t
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valgt stjerne</span>
              <span>{selectedGirl ? `Busy ca. ${cooldownHours}t` : "Ingen ekstra cooldown"}</span>
            </div>
            {hasRiskRoll && (
              <div className="mt-1 text-amber-300">
                🧪 Lav STD-risiko-rull (condoms: {state.condoms}).
              </div>
            )}
          </div>

          <button
            disabled={locked || !!selectedBlocked || state.cash < show.cost}
            onClick={() => {
              onRun(show.id, girlId, intensity);
              onClose();
            }}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-bold uppercase text-primary-foreground hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {locked
              ? "🔒 Låst"
              : selectedBlocked
                ? "⛔ Velg ledig stjerne"
                : `${show.emoji} Start ${show.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
