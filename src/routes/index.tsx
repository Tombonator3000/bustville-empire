import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useGame } from "@/game/useGame";
import { LOCATIONS, CONTENT_TYPES, type Girl } from "@/game/data";
import heroImg from "@/assets/bustville-hero.jpg";

export const Route = createFileRoute("/")({
  component: GamePage,
  head: () => ({
    meta: [
      { title: "Bustville Empire — From Rusty Trailer to Porn King" },
      { name: "description", content: "Humoristisk tycoon-sim: bygg et erotikk-imperium fra en rusten trailer i Bustville, Alabama." },
    ],
  }),
});

function GamePage() {
  const g = useGame();
  const [started, setStarted] = useState(false);
  const [selectedGirl, setSelectedGirl] = useState<string | undefined>();

  const loc = LOCATIONS[g.state.locationLevel - 1];
  const nextLoc = LOCATIONS[g.state.locationLevel];

  if (!g.loaded) return <div className="min-h-screen" />;

  if (!started && g.state.day === 1 && g.state.girls.length === 0) {
    return <Splash onStart={() => setStarted(true)} onReset={g.reset} />;
  }

  if (g.state.won) {
    return <WinScreen onReset={() => { g.reset(); setStarted(false); }} />;
  }

  return (
    <main className="min-h-screen pb-12">
      <TopBar state={g.state} loc={loc} />
      <div className="mx-auto grid max-w-7xl gap-4 px-3 pt-4 lg:grid-cols-[260px_1fr_300px]">
        {/* LEFT: stats + upgrade */}
        <aside className="space-y-3">
          <StatsPanel state={g.state} onUpgradeStat={g.upgradeStat} />
          <LocationPanel state={g.state} loc={loc} nextLoc={nextLoc} onUpgrade={g.upgradeLocation} />
        </aside>

        {/* CENTER: actions */}
        <section className="space-y-3">
          <LocationCard loc={loc} />
          <ActionsPanel
            state={g.state}
            selectedGirl={selectedGirl}
            onDo={(id: string) => g.doContent(id, selectedGirl)}
            onBrew={g.brewMoonshine}
            onSell={g.sellMoonshine}
            onScout={g.scoutGirl}
            onParty={g.throwParty}
          />
          <EventLog log={g.state.log} />
          <button
            onClick={g.endWeek}
            className="w-full rounded-xl bg-primary px-6 py-5 text-2xl font-black uppercase tracking-widest text-primary-foreground pulse-pink hover:brightness-110 transition"
          >
            💋 End Week
          </button>
        </section>

        {/* RIGHT: roster */}
        <aside className="space-y-3">
          <RosterPanel
            girls={g.state.girls}
            selected={selectedGirl}
            onSelect={(id) => setSelectedGirl(id === selectedGirl ? undefined : id)}
            onFire={g.fireGirl}
            onTrain={g.trainGirl}
            onGift={g.giftGirl}
          />
        </aside>
      </div>
      <footer className="mx-auto mt-8 max-w-7xl px-3 text-center text-xs text-muted-foreground">
        <button onClick={() => { if (confirm("Slett all progresjon?")) { g.reset(); setStarted(false); } }} className="underline hover:text-primary">
          Reset game
        </button>
        <span className="mx-2">·</span>
        Bustville Empire v1.0 — “One curve at a time”
      </footer>
    </main>
  );
}

function Splash({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img src={heroImg} alt="Bustville at dusk" className="absolute inset-0 h-full w-full object-cover opacity-50" width={1536} height={896} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      <div className="absolute inset-0 scan-lines opacity-30" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">A humoristic tycoon sim</p>
        <h1 className="mt-4 text-6xl font-black uppercase leading-none neon-text md:text-8xl">
          Bustville<br/>Empire
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          From a rusty trailer in Alabama to a multimillion-dollar erotica empire.
          Brew moonshine. Scout talent. Throw parties. Become the <span className="text-primary">Porn King of the South</span>.
        </p>
        <button
          onClick={() => { onReset(); onStart(); }}
          className="mt-10 rounded-xl bg-primary px-10 py-5 text-2xl font-black uppercase tracking-widest text-primary-foreground pulse-pink hover:brightness-110 transition"
        >
          ▶ Start a New Empire
        </button>
        <button
          onClick={onStart}
          className="mt-3 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Continue saved game
        </button>
        <p className="mt-10 text-xs text-muted-foreground/70">
          Satirical comedy game. No real images, all in-game characters fictional. 18+.
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
          Champagnen renner. Neon-leppene på HQ-taket lyser opp natthimmelen over Bustville.
          Du startet i en rusten trailer. Nå har du et imperium.
        </p>
        <button onClick={onReset} className="mt-8 rounded-xl bg-primary px-8 py-4 font-black uppercase tracking-widest text-primary-foreground pulse-pink">
          Play Again
        </button>
      </div>
    </main>
  );
}

function TopBar({ state, loc }: { state: ReturnType<typeof useGame>["state"]; loc: typeof LOCATIONS[number] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-2 text-sm">
        <h1 className="font-display text-2xl font-black uppercase neon-text mr-3">Bustville</h1>
        <Pill label="Cash" value={`$${state.cash.toLocaleString()}`} accent />
        <Pill label="Rep" value={state.reputation.toString()} />
        <Pill label="Stamina" value={`${state.stamina}/${state.maxStamina}`} />
        <Pill label="Day" value={state.day.toString()} />
        <Pill label="Moonshine" value={`🥃 ${state.moonshine}`} />
        <Pill label="Backlog" value={`🎞 ${state.backlog}`} />
        <div className="ml-auto text-xs text-muted-foreground">
          Lv {loc.level} · <span className="text-foreground">{loc.name}</span>
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${loc.phase === "startup" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
            {loc.phase === "startup" ? "Phase 1: Dirty Startup" : "Phase 2: Empire"}
          </span>
        </div>
      </div>
    </header>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border border-border/60 px-2.5 py-1 ${accent ? "bg-primary/10 text-primary neon-text" : "bg-card/50"}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}

function StatsPanel({ state, onUpgradeStat }: { state: any; onUpgradeStat: (s: any) => void }) {
  const stats: Array<"charisma" | "hustle" | "business" | "lust"> = ["charisma", "hustle", "business", "lust"];
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <h3 className="font-display text-lg uppercase">The Boss</h3>
      <div className="mt-2 space-y-1.5">
        {stats.map((s) => {
          const cost = 300 + state.player[s] * 250;
          return (
            <button key={s} onClick={() => onUpgradeStat(s)}
              className="flex w-full items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5 text-left text-sm hover:bg-secondary transition">
              <span className="capitalize">{s}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-accent">{state.player[s]}</span>
                <span className="text-[10px] text-muted-foreground">+1 ${cost}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LocationPanel({ state, loc, nextLoc, onUpgrade }: any) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <h3 className="font-display text-lg uppercase">Empire Level</h3>
      <div className="mt-2 text-xs text-muted-foreground">{loc.tagline}</div>
      {nextLoc ? (
        <button onClick={onUpgrade}
          className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-bold uppercase text-accent-foreground hover:brightness-110 transition">
          Move to {nextLoc.name}
          <div className="text-[10px] font-normal opacity-80 normal-case">
            Needs ${nextLoc.unlockCash.toLocaleString()} + {nextLoc.unlockRep} rep
          </div>
        </button>
      ) : (
        <div className="mt-3 text-center text-sm text-accent neon-text-green">MAX LEVEL</div>
      )}
      <div className="mt-3 text-[10px] text-muted-foreground">
        Win: Lv 5 + $250k + 140 rep
      </div>
    </div>
  );
}

function LocationCard({ loc }: { loc: typeof LOCATIONS[number] }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border neon-border">
      <img src={loc.image} alt={loc.name} className="h-44 w-full object-cover" loading="lazy" width={768} height={512} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute bottom-2 left-3">
        <p className="text-[10px] uppercase tracking-widest text-accent">Level {loc.level}</p>
        <h2 className="font-display text-3xl uppercase neon-text">{loc.name}</h2>
      </div>
    </div>
  );
}

function ActionsPanel({ state, selectedGirl, onDo, onBrew, onSell, onScout, onParty }: any) {
  const available = useMemo(() => CONTENT_TYPES.filter((c) => state.locationLevel >= c.minLevel), [state.locationLevel]);
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg uppercase">Actions</h3>
        <p className="text-xs text-muted-foreground">
          {selectedGirl ? "🎯 Stjerne valgt" : "Velg stjerne i panelet til høyre for bonus"}
        </p>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {available.map((c) => (
          <button key={c.id} onClick={() => onDo(c.id)}
            className="rounded-lg border border-border bg-secondary/40 p-2.5 text-left hover:bg-secondary/80 hover:border-primary/60 transition">
            <div className="flex items-center justify-between">
              <span className="font-bold">{c.name}</span>
              <span className="text-xs text-accent font-mono">~${c.basePay}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              −${c.cost} · −{c.stamina} stamina · +{c.repGain} rep
            </div>
          </button>
        ))}
        <button onClick={onBrew} className="rounded-lg border border-border bg-secondary/40 p-2.5 text-left hover:bg-secondary/80 transition">
          <div className="flex items-center justify-between"><span className="font-bold">🔥 Brew Moonshine</span><span className="text-xs text-accent">+3 🥃</span></div>
          <div className="text-[11px] text-muted-foreground">−$80 · −12 stamina</div>
        </button>
        <button onClick={onSell} className="rounded-lg border border-border bg-secondary/40 p-2.5 text-left hover:bg-secondary/80 transition">
          <div className="flex items-center justify-between"><span className="font-bold">🥃 Sell Moonshine</span><span className="text-xs text-accent">+$140-220</span></div>
          <div className="text-[11px] text-muted-foreground">−1 🥃</div>
        </button>
        <button onClick={onScout} className="rounded-lg border border-border bg-primary/20 p-2.5 text-left hover:bg-primary/30 transition">
          <div className="flex items-center justify-between"><span className="font-bold">💋 Scout Talent</span><span className="text-xs text-accent">${120 + state.locationLevel * 60}</span></div>
          <div className="text-[11px] text-muted-foreground">Finn en ny stjerne</div>
        </button>
        <button onClick={onParty} className="rounded-lg border border-border bg-accent/20 p-2.5 text-left hover:bg-accent/30 transition">
          <div className="flex items-center justify-between"><span className="font-bold">🎉 Industry Party</span><span className="text-xs text-accent">+rep, loyalty</span></div>
          <div className="text-[11px] text-muted-foreground">−${600 + state.locationLevel * 200} · −2 🥃</div>
        </button>
      </div>
    </div>
  );
}

function RosterPanel({ girls, selected, onSelect, onFire, onTrain, onGift }: {
  girls: Girl[]; selected?: string;
  onSelect: (id: string) => void; onFire: (id: string) => void;
  onTrain: (id: string) => void; onGift: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <h3 className="font-display text-lg uppercase">Roster <span className="text-muted-foreground text-xs font-sans normal-case">({girls.length}/6)</span></h3>
      {girls.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Ingen stjerner ennå. Scout en jente for å starte produksjonen.</p>
      )}
      <div className="mt-2 space-y-2">
        {girls.map((g) => (
          <div key={g.id}
            className={`rounded-lg border p-2 cursor-pointer transition ${selected === g.id ? "border-primary bg-primary/10 neon-border" : "border-border bg-secondary/40 hover:bg-secondary/60"}`}
            onClick={() => onSelect(g.id)}>
            <div className="flex items-baseline justify-between">
              <span className="font-bold">{g.name}</span>
              <span className="text-[10px] text-muted-foreground">${g.salary}/wk</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-accent">{g.archetype}</div>
            <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px]">
              <Stat label="Bea" v={g.beauty} />
              <Stat label="Perf" v={g.performance} />
              <Stat label="Pop" v={g.popularity} />
              <Stat label="Loy" v={g.loyalty} />
            </div>
            {selected === g.id && (
              <div className="mt-2 grid grid-cols-3 gap-1">
                <button onClick={(e) => { e.stopPropagation(); onTrain(g.id); }} className="rounded bg-secondary px-1.5 py-1 text-[10px] hover:bg-secondary/80">Train $200</button>
                <button onClick={(e) => { e.stopPropagation(); onGift(g.id); }} className="rounded bg-secondary px-1.5 py-1 text-[10px] hover:bg-secondary/80">Gift $150</button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Sparke ${g.name}?`)) onFire(g.id); }} className="rounded bg-destructive/80 px-1.5 py-1 text-[10px] text-destructive-foreground hover:bg-destructive">Fire</button>
              </div>
            )}
          </div>
        ))}
      </div>
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

function EventLog({ log }: { log: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <h3 className="font-display text-lg uppercase">Event Log</h3>
      <div className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
        {log.map((line, i) => (
          <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{line}</p>
        ))}
      </div>
    </div>
  );
}
