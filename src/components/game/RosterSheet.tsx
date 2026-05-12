import { absHour, type GameState } from "@/game/useGame";
import { ARCHETYPE_PORTRAITS, GIRL_MISSIONS, type Girl } from "@/game/data";
import { STDS } from "@/game/health";

export function RosterSheet({
  state, selected, onClose, onSelect, onFire, onTrain, onGift, onResign, onStartMission, onCancelMission,
}: {
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

function GirlCard({
  g, selected, nowAbs, currentDay, onSelect, onFire, onTrain, onGift, onResign, onStartMission, onCancelMission,
}: {
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
          {g.std && (() => {
            const supressed = g.std.suppressedUntilDay && currentDay < g.std.suppressedUntilDay;
            const def = STDS[g.std.id];
            return (
              <div className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                supressed ? "bg-amber-500/20 text-amber-200" : def.curable ? "bg-orange-600/30 text-orange-100" : "bg-destructive/40 text-destructive-foreground"
              }`}>
                {def.emoji} {def.name}{supressed ? ` (undertrykt d.${g.std.suppressedUntilDay})` : ""}
              </div>
            );
          })()}
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
