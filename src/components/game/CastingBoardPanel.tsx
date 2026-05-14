import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";

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
            <h2 className="font-display text-2xl uppercase neon-text">Casting Board</h2>
            <p className="text-xs text-muted-foreground">
              Local leads, cheap contracts, questionable headshots.
            </p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">
            Lukk
          </button>
        </div>
        <button
          onClick={onScout}
          className="mb-3 w-full rounded bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          Scout Local Talent
        </button>
        <div className="space-y-2">
          {leads.map((g) => (
            <div key={g.id} className="rounded border border-border bg-secondary/40 p-2 text-xs">
              <div className="flex gap-2">
                <img
                  src={ARCHETYPE_PORTRAITS[g.archetype]}
                  className="h-16 w-16 rounded object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <b>{g.name}</b>
                    <span>{g.age ?? "Adult"}</span>
                  </div>
                  <div>
                    {g.archetype} · ⭐ {g.starRating ?? "?"} · {g.recruitRarityLabel ?? "Local"}
                  </div>
                  <div>{g.profession ?? "Performer"}</div>
                  <div className="text-muted-foreground">{g.preferences?.join(" · ")}</div>
                  <div>
                    Bea {g.beauty} · Perf {g.performance} · Pop {g.popularity} · Loy {g.loyalty}
                  </div>
                  <div>
                    ${g.salary}/w {g.hiddenPotential ? "· Hidden Potential" : ""}
                  </div>
                  <div className="text-muted-foreground">{g.tagline}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onHire(g.id)}
                  className="flex-1 rounded bg-primary/30 px-2 py-1"
                >
                  Hire
                </button>
                <button
                  onClick={() => onPass(g.id)}
                  className="flex-1 rounded bg-secondary px-2 py-1"
                >
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
