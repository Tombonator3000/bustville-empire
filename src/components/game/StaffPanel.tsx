import { type GameState, type StaffRole } from "@/game/useGame";
import { GameIcon, type GameIconName } from "@/components/game/GameIcon";
import { GameMeter, StatPill } from "@/components/game/GameMeter";

const roles: { id: StaffRole; label: string; hint: string; icon: GameIconName }[] = [
  { id: "editor", label: "Editor", hint: "Reduserer editing-tid", icon: "edit" },
  { id: "scout", label: "Scout", hint: "Bedre rekrutteringskvalitet", icon: "casting" },
  { id: "marketer", label: "Marketer", hint: "Sterkere kampanjer", icon: "flyer" },
  { id: "fixer", label: "Fixer", hint: "Demper heat", icon: "heatReduction" },
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
            <span className="inline-flex items-center gap-2">
              {" "}
              <GameIcon name={mode === "helpWanted" ? "helpWanted" : "staff"} size={20} />
              {mode === "helpWanted" ? "Help Wanted Board" : "Staff"}
            </span>
          </h2>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">
            Lukk
          </button>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          {mode === "helpWanted"
            ? "Pinned cards, hand-written numbers, and budget freelancers. This is where early crew gets hired."
            : "Management overview. For hiring, use Trailer Office → Help Wanted Board."}
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <StatPill
            icon={<GameIcon name="staff" tone="neutral" size={12} />}
            label="Staff"
            value={state.staff.length}
            max={slots}
            meter
            tone="progress"
          />
          <StatPill
            icon={<GameIcon name="cash" tone="cash" size={12} />}
            label="Payroll/w"
            value={`$${state.staff.reduce((sum, m) => sum + m.salary, 0)}`}
          />
        </div>
        <div className="space-y-2">
          {state.staff.map((m) => (
            <div key={m.id} className="rounded border border-border bg-secondary/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <b>{m.name}</b>
                <StatPill
                  icon={<GameIcon name="cash" tone="cash" size={11} />}
                  value={`$${m.salary}/w`}
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatPill
                  icon={
                    <GameIcon
                      name={
                        m.role === "editor"
                          ? "edit"
                          : m.role === "scout"
                            ? "casting"
                            : m.role === "marketer"
                              ? "flyer"
                              : "heatReduction"
                      }
                      size={11}
                    />
                  }
                  value={m.role}
                />
                <StatPill
                  icon={<GameIcon name="progress" tone="purple" size={11} />}
                  value={`Lv ${m.level}`}
                />
                <StatPill
                  icon={<GameIcon name="reward" tone="success" size={11} />}
                  value={`+${m.bonus}`}
                />
                <StatPill icon={<GameIcon name="info" size={11} />} value={m.trait} />
              </div>
              <div className="mt-1">
                <GameMeter value={m.level} max={5} tone="progress" size="tiny" />
              </div>
              <button
                onClick={() => onUpgrade(m.id)}
                className="mt-1 inline-flex items-center gap-1 rounded bg-primary/30 px-2 py-0.5"
              >
                <GameIcon name="upgradeHome" size={12} />
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
                  <span className="inline-flex items-center gap-1">
                    <GameIcon name={r.icon} size={12} />
                    {r.label}
                  </span>{" "}
                  — {r.hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
