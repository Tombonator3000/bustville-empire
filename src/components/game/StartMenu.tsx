import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { SaveSlotMeta } from "@/game/useGame";

interface StartMenuProps {
  slots: SaveSlotMeta[];
  onNewGame: () => void;
  onContinue: () => void;
  onLoadSlot: (slot: number) => void;
  onOpenOptions?: () => void;
}

const SLOT_IDS = [1, 2, 3] as const;

export function StartMenu({
  slots,
  onNewGame,
  onContinue,
  onLoadSlot,
  onOpenOptions,
}: StartMenuProps) {
  const slotsById = useMemo(() => {
    const map = new Map<number, SaveSlotMeta>();
    slots.forEach((slot) => map.set(slot.slot, slot));
    return map;
  }, [slots]);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/90 p-6 shadow-2xl backdrop-blur">
        <header className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Bustville Empire</h1>
          <p className="text-sm text-muted-foreground">Velg hvordan du vil starte spillet.</p>
        </header>

        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={onNewGame}>
            Start New Game
          </Button>
          <Button className="w-full" size="lg" variant="secondary" onClick={onContinue}>
            Continue
          </Button>

          {SLOT_IDS.map((slotId) => {
            const slot = slotsById.get(slotId);
            return (
              <Button
                key={slotId}
                className="h-auto w-full flex-col items-start gap-1 py-3 text-left"
                size="lg"
                variant="outline"
                onClick={() => onLoadSlot(slotId)}
              >
                <span>Load Slot {slotId}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {slot
                    ? `${slot.label} · Day ${slot.day} · $${Math.round(slot.cash).toLocaleString()} · ${new Date(slot.savedAt).toLocaleString()}`
                    : "Tomt lagringsspor"}
                </span>
              </Button>
            );
          })}

          {onOpenOptions && (
            <Button className="w-full" size="lg" variant="ghost" onClick={onOpenOptions}>
              Options
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
