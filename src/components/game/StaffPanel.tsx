import { type GameState, type StaffRole } from "@/game/useGame";

const roles: { id: StaffRole; label: string; hint: string }[] = [
  { id: "editor", label: "Editor", hint: "Reduserer editing-tid" },
  { id: "scout", label: "Scout", hint: "Bedre rekrutteringskvalitet" },
  { id: "marketer", label: "Marketer", hint: "Sterkere kampanjer" },
  { id: "fixer", label: "Fixer", hint: "Demper heat" },
];

export function StaffPanel({
  state,
  onClose,
  onHire,
  onUpgrade,
  mode = "overview",
}: {
  state: GameState;
  onClose: () => void;
  onHire: (role: StaffRole) => void;
  onUpgrade: (id: string) => void;
  mode?: "overview" | "helpWanted";
}) {
  const slots =
    state.locationLevel >= 4 ? 4 : state.locationLevel >= 3 ? 3 : state.locationLevel >= 2 ? 2 : 1;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase neon-text">
            {mode === "helpWanted" ? "Help Wanted Board" : "Staff"}
          </h2>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">
            Lukk
          </button>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          {mode === "helpWanted"
            ? "Cheap local crew. Some are useful. Some own a van."
            : "Hire new crew from Trailer Office → Help Wanted Board."}
        </p>
        <p className="mb-2 text-xs">
          Staff slots: {state.staff.length}/{slots}
        </p>
        <div className="space-y-2">
          {state.staff.map((m) => (
            <div key={m.id} className="rounded border border-border bg-secondary/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <b>{m.name}</b>
                <span>${m.salary}/w</span>
              </div>
              <div>
                {m.role} · Lv {m.level} · +{m.bonus} · {m.trait}
              </div>
              <button
                onClick={() => onUpgrade(m.id)}
                className="mt-1 rounded bg-primary/30 px-2 py-0.5"
              >
                Upgrade
              </button>
            </div>
          ))}
          {state.staff.length === 0 && (
            <p className="text-xs text-muted-foreground">Ingen ansatte ennå.</p>
          )}
        </div>
        {mode === "helpWanted" && (
          <div className="mt-4 border-t border-border pt-3">
            <div className="mb-1 text-xs uppercase tracking-wider text-accent">Hire</div>
            <div className="grid gap-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onHire(r.id)}
                  className="rounded bg-secondary px-2 py-1 text-left text-xs hover:bg-secondary/80"
                >
                  {r.label} — {r.hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
