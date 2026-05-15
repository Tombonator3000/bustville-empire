import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { GameIcon } from "./GameIcon";
import { StatPill } from "./GameMeter";

export function CastingBoardPanel({
  leads,
  onClose,
  onScout,
  onHire,
  onPass,
}: {
  leads: Girl[];
  onClose: () => void;
  onScout: () => void;
  onHire: (id: string) => void;
  onPass: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase neon-text inline-flex items-center gap-2">
              <GameIcon name="castingBoard" size={22} tone="purple" />
              Casting Board
            </h2>
            <p className="text-xs text-muted-foreground">
              Local leads from the trailer office board.
            </p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">
            Lukk
          </button>
        </div>
        <button
          onClick={onScout}
          className="mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          <GameIcon name="searchEquipment" size={14} />
          Scout Local Talent
        </button>
        <div className="space-y-2">
          {leads.map((g) => (
            <div key={g.id} className="rounded border border-border bg-secondary/40 p-2 text-xs">
              <div className="flex gap-2">
                {ARCHETYPE_PORTRAITS[g.archetype] ? (
                  <img
                    src={ARCHETYPE_PORTRAITS[g.archetype]}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded border border-border bg-background/50">
                    <GameIcon name="newLead" size={20} tone="neutral" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <b>{g.name}</b>
                    <span>{g.age ?? "Adult"}</span>
                  </div>
                  <div>
                    {g.archetype} · <GameIcon name="requiresStar" size={12} className="inline" />{" "}
                    {g.starRating ?? "?"} · {g.recruitRarityLabel ?? "Local"}
                  </div>
                  <div>{g.profession ?? "Performer"}</div>
                  <div className="text-muted-foreground">{g.preferences?.join(" · ")}</div>
                  <div>
                    Bea {g.beauty} · Perf {g.performance} · Pop {g.popularity} · Loy {g.loyalty}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <StatPill
                      icon={<GameIcon name="cash" tone="cash" size={11} />}
                      value={`$${g.salary}/w`}
                    />
                    {g.hiddenPotential && (
                      <StatPill
                        icon={<GameIcon name="milestone" tone="purple" size={11} />}
                        value="Hidden Potential"
                      />
                    )}
                  </div>
                  <div className="text-muted-foreground">{g.tagline}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onHire(g.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-primary/30 px-2 py-1"
                >
                  <GameIcon name="newRecruit" size={12} />
                  <GameIcon name="cash" tone="cash" size={12} />
                  Hire
                </button>
                <button
                  onClick={() => onPass(g.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-secondary px-2 py-1"
                >
                  <GameIcon name="locked" size={12} />
                  Pass
                </button>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No leads yet. Post flyers, work the bar, or scout local talent from your trailer
              office.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
