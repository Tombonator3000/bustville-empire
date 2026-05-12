import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { STDS, activeSTD } from "@/game/health";
import type { GameState, Intensity } from "@/game/useGame";
import { X, Pill as PillIcon, Syringe, ShieldCheck, Stethoscope } from "lucide-react";

type Props = {
  state: GameState;
  onClose: () => void;
  onPerform: (locId: "clinic", actionId: string, girlId?: string, intensity?: Intensity) => void;
};

export function ClinicSheet({ state, onClose, onPerform }: Props) {
  const sick = state.girls.filter(g => g.std);
  const condoms = state.condoms;
  const lowOnCondoms = condoms < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background/95 p-4 shadow-2xl">
        <header className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl font-black uppercase neon-text">Doc Lonnie's Clinic</h2>
              <p className="text-[10px] text-muted-foreground">Helserisk-håndtering · alle handlinger tar tid og koster reise (1t).</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md border border-border p-1.5 hover:border-primary">
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* RESOURCES */}
        <section className="mb-4 grid grid-cols-3 gap-2 text-xs">
          <ResourceCard icon="🧪" label="Condoms" value={condoms} hint={lowOnCondoms ? "Lavt lager!" : "Auto i intense scener"} hot={lowOnCondoms} />
          <ResourceCard icon="💵" label="Cash" value={`$${state.cash}`} hint="" />
          <ResourceCard icon="🤒" label="Syke" value={sick.length} hint={sick.length ? "Behandle nedenfor" : "Ingen syke 🎉"} hot={sick.length > 0} />
        </section>

        {/* SHOP */}
        <section className="mb-5">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-accent">Apotek</h3>
          <div className="grid gap-2">
            <ShopButton
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Condoms (10-pakk)"
              cost={200} time="1t"
              desc="Beskytter 100% i alle intense scener. Brukes auto."
              disabled={state.cash < 200}
              onClick={() => onPerform("clinic", "buyCondoms")}
            />
          </div>
        </section>

        {/* STAR HEALTH */}
        <section>
          <h3 className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-accent">
            Stjernehelse
            <span className="font-mono text-[10px] normal-case tracking-normal text-muted-foreground">
              {state.girls.length} stjerne(r)
            </span>
          </h3>
          {state.girls.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
              Du har ingen stjerner i staben enda.
            </p>
          ) : (
            <div className="grid gap-2">
              {state.girls.map(g => (
                <GirlHealthCard key={g.id} g={g} day={state.day} cash={state.cash} onPerform={onPerform} />
              ))}
            </div>
          )}
        </section>

        <p className="pt-4 text-center text-[10px] text-muted-foreground">
          Tips: Kjøp condoms før VIP-eskorte, tour og intense scener — billigere enn behandling.
        </p>
      </div>
    </div>
  );
}

function ResourceCard({ icon, label, value, hint, hot }: { icon: string; label: string; value: string | number; hint: string; hot?: boolean }) {
  return (
    <div className={`rounded-md border px-2.5 py-2 ${hot ? "border-destructive/60 bg-destructive/10" : "border-border bg-secondary/40"}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-base">{icon}</span>
        <span className="font-mono text-base font-bold">{value}</span>
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {hint && <div className={`mt-0.5 text-[9px] ${hot ? "text-destructive-foreground" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

function ShopButton({ icon, title, cost, time, desc, disabled, onClick }: {
  icon: React.ReactNode; title: string; cost: number; time: string; desc: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex w-full items-start gap-3 rounded-md border border-border bg-secondary/30 p-2.5 text-left transition hover:border-primary hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-40">
      <div className="mt-0.5 rounded bg-primary/20 p-1.5 text-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold">{title}</span>
          <span className="font-mono text-[11px] text-accent">−${cost} · {time}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function GirlHealthCard({ g, day, cash, onPerform }: {
  g: Girl; day: number; cash: number;
  onPerform: (locId: "clinic", actionId: string, girlId?: string, intensity?: Intensity) => void;
}) {
  const std = g.std;
  const def = std ? STDS[std.id] : null;
  const supressed = std?.suppressedUntilDay && day < std.suppressedUntilDay;
  const active = activeSTD(g, day);
  const portrait = ARCHETYPE_PORTRAITS[g.archetype];

  // Antibiotika kurerer kun curable
  const canAntibiotics = !!def && def.curable && !supressed;
  const canSteroids = !!std; // virker på alle STDer (også undertrykker kroniske)

  return (
    <div className={`rounded-md border p-2.5 ${std ? (def!.curable ? "border-orange-500/40 bg-orange-500/5" : "border-destructive/50 bg-destructive/10") : "border-border bg-secondary/30"}`}>
      <div className="flex gap-3">
        <img src={portrait} alt={g.archetype} className="h-16 w-14 flex-none rounded border border-border object-cover" loading="lazy" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-bold truncate">{g.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-accent">{g.archetype}</span>
          </div>
          {std && def ? (
            <div className="mt-1 text-[11px]">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${
                supressed ? "bg-amber-500/20 text-amber-200" : def.curable ? "bg-orange-600/30 text-orange-100" : "bg-destructive/40 text-destructive-foreground"
              }`}>
                {def.emoji} {def.name}{supressed ? " · undertrykt" : ""}
              </span>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {def.curable ? "Kurerbar med antibiotika." : "Kronisk — kun undertrykkes med steroider."}
                {active && <> Effekt nå: {Math.round((1 - active.payoutMult) * 100)}% payout-tap{active.blocksMissions.length ? `, blokkerer ${active.blocksMissions.join(", ")}` : ""}.</>}
                {supressed && std.suppressedUntilDay && <> Undertrykt til d.{std.suppressedUntilDay}.</>}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-emerald-300/90">✅ Frisk</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <TreatBtn
          icon={<PillIcon className="h-3 w-3" />}
          label="Antibiotika"
          cost={400}
          disabled={!canAntibiotics || cash < 400}
          tooltip={!std ? "Ingen STD å kurere" : !def!.curable ? "Virker ikke på kroniske STDer" : supressed ? "Allerede undertrykt — vent til effekten går ut" : cash < 400 ? "Ikke nok cash" : "Kurerer Chlamydia/Gonorrhea"}
          onClick={() => onPerform("clinic", "antibiotics", g.id)}
        />
        <TreatBtn
          icon={<Syringe className="h-3 w-3" />}
          label="Steroider"
          cost={700}
          disabled={!canSteroids || cash < 700}
          tooltip={!std ? "Ingen STD å undertrykke" : cash < 700 ? "Ikke nok cash" : "Undertrykker enhver STD i 5 dager"}
          onClick={() => onPerform("clinic", "steroids", g.id)}
        />
        <TreatBtn
          icon={<Syringe className="h-3 w-3" />}
          label="Vitamin"
          cost={120}
          disabled={cash < 120}
          tooltip="Full stamina-restitusjon"
          onClick={() => onPerform("clinic", "heal", g.id)}
        />
      </div>
    </div>
  );
}

function TreatBtn({ icon, label, cost, disabled, tooltip, onClick }: {
  icon: React.ReactNode; label: string; cost: number; disabled?: boolean; tooltip?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={tooltip}
      className="flex items-center gap-1 rounded border border-border bg-background/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">
      {icon} {label} <span className="font-mono text-accent">−${cost}</span>
    </button>
  );
}
