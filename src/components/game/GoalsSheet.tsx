import type { GameState } from "@/game/useGame";

export function GoalsSheet({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-start bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-sm overflow-y-auto border-r border-border bg-card p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase neon-text">Goals</h2>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">Lukk</button>
        </div>
        <div className="mt-4 space-y-2">
          {state.goals.list.map((goal) => (
            <div key={goal.id} className="rounded border border-border/70 bg-secondary/30 p-2 text-xs">
              <p className="font-semibold">{goal.completed ? "✅" : "🎯"} {goal.title}</p>
              <p className="text-muted-foreground">{goal.progress}/{goal.target}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
