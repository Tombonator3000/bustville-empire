import type { GameState } from "@/game/useGame";

export function EventQueueSheet({
  state,
  onClose,
  onResolve,
}: {
  state: GameState;
  onClose: () => void;
  onResolve: (eventId: string, choiceId: string) => void;
}) {
  const event = state.activeEvents[0];
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 p-3" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg uppercase">Pending Event</h3>
          <button onClick={onClose} className="rounded bg-secondary px-2 py-1 text-xs">Close</button>
        </div>
        <p className="mt-2 font-semibold">{event.title}</p>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Queue: {state.activeEvents.length} · Expires day {event.expiresDay}</p>
        <div className="mt-3 space-y-2">
          {event.choices.map((choice) => (
            <button key={choice.id} onClick={() => onResolve(event.id, choice.id)} className="w-full rounded border border-border bg-secondary/40 p-2 text-left text-sm hover:border-primary">
              <p className="font-semibold">{choice.label}</p>
              <p className="text-xs text-muted-foreground">{choice.summary}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
