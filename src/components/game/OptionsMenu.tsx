import { useState } from "react";
import { listSaveSlots } from "@/game/useGame";
import { toast } from "sonner";
import { SyncStatusBox } from "./SyncStatusBox";

interface Props {
  onClose: () => void;
  onSave: (slot: number, label?: string) => void;
  onLoad: (slot: number) => boolean;
  onDelete: (slot: number) => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onReset: () => void;
}

type Tab = "saves" | "sync" | "data" | "settings" | "about";

export function OptionsMenu({ onClose, onSave, onLoad, onDelete, onExport, onImport, onReset }: Props) {
  const [tab, setTab] = useState<Tab>("saves");
  const [slots, setSlots] = useState(() => listSaveSlots());
  const [importText, setImportText] = useState("");
  const refresh = () => setSlots(listSaveSlots());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-border bg-card/95 shadow-[0_0_60px_oklch(0.7_0.28_350/0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-xl uppercase tracking-widest neon-text">⚙️ Meny</h2>
          <button onClick={onClose} className="rounded border border-border px-2 py-1 text-xs uppercase hover:border-primary">Lukk ✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border bg-background/40 px-2 py-1">
          {([
            ["saves", "💾 Lagre / Last"],
            ["data", "📦 Data"],
            ["settings", "🎚️ Innstillinger"],
            ["about", "ℹ️ Om"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>{label}</button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {tab === "saves" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">3 manuelle lagringsplasser. Autosave kjører i bakgrunnen.</p>
              {[1, 2, 3].map((slot) => {
                const meta = slots.find((s) => s.slot === slot);
                return (
                  <div key={slot} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                    <span className="font-display text-lg font-black text-accent w-8 text-center">{slot}</span>
                    <div className="min-w-0 flex-1">
                      {meta ? (
                        <>
                          <p className="truncate text-sm font-bold">{meta.label}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            Dag {meta.day} · ${meta.cash.toLocaleString()} · {new Date(meta.savedAt).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">Tom plass</p>
                      )}
                    </div>
                    <button
                      onClick={() => { onSave(slot); refresh(); toast.success(`Lagret i slot ${slot}`); }}
                      className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-primary-foreground hover:brightness-110">
                      Lagre
                    </button>
                    <button
                      disabled={!meta}
                      onClick={() => { if (onLoad(slot)) { toast.success(`Lastet slot ${slot}`); onClose(); } }}
                      className="rounded bg-accent px-2.5 py-1 text-[11px] font-bold uppercase text-accent-foreground hover:brightness-110 disabled:opacity-30">
                      Last
                    </button>
                    <button
                      disabled={!meta}
                      onClick={() => { if (confirm(`Slett slot ${slot}?`)) { onDelete(slot); refresh(); } }}
                      className="rounded bg-destructive/80 px-2.5 py-1 text-[11px] font-bold uppercase text-destructive-foreground hover:bg-destructive disabled:opacity-30">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "data" && (
            <div className="space-y-4">
              <div>
                <p className="font-display text-[10px] uppercase tracking-widest text-accent">Eksport</p>
                <button
                  onClick={() => {
                    const text = onExport();
                    navigator.clipboard?.writeText(text);
                    const blob = new Blob([text], { type: "application/json" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `bustville-save-${Date.now()}.json`;
                    a.click();
                    toast.success("Save eksportert (kopiert + nedlastet)");
                  }}
                  className="mt-1 rounded bg-secondary px-3 py-1.5 text-xs font-bold uppercase hover:bg-secondary/80">
                  💾 Last ned save-fil
                </button>
              </div>
              <div>
                <p className="font-display text-[10px] uppercase tracking-widest text-accent">Import</p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Lim inn JSON fra eksportert save…"
                  className="mt-1 h-40 w-full rounded border border-border bg-background p-2 font-mono text-[10px]"
                />
                <button
                  onClick={() => {
                    if (onImport(importText)) { toast.success("Save importert"); onClose(); }
                    else toast.error("Ugyldig JSON");
                  }}
                  className="mt-1 rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground hover:brightness-110">
                  Importer
                </button>
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-display text-[10px] uppercase tracking-widest text-destructive">Faresone</p>
                <button
                  onClick={() => { if (confirm("Slett all progresjon og start på nytt?")) { onReset(); onClose(); } }}
                  className="mt-1 rounded bg-destructive px-3 py-1.5 text-xs font-bold uppercase text-destructive-foreground hover:brightness-110">
                  🔥 Nullstill spillet
                </button>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-3 text-sm">
              <SettingToggle k="sound" label="🔊 Lydeffekter" defaultOn />
              <SettingToggle k="music" label="🎵 Musikk" defaultOn />
              <SettingToggle k="toasts" label="💬 Pop-up varsler" defaultOn />
              <SettingToggle k="scanlines" label="📺 Scan-line effekt" defaultOn />
              <p className="pt-2 text-[10px] text-muted-foreground">Innstillinger lagres lokalt i nettleseren.</p>
            </div>
          )}

          {tab === "about" && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-display text-lg uppercase neon-text">Bustville Empire</p>
              <p>En satirisk tycoon-sim inspirert av 90-talls manager-spill som Lula: The Sexy Empire.</p>
              <p>Bygg deg opp fra en rusten trailer i Alabama til et globalt underholdnings-imperium.</p>
              <p className="text-[10px]">v0.9 · 2026</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ k, label, defaultOn }: { k: string; label: string; defaultOn?: boolean }) {
  const storageKey = `bustville:setting:${k}`;
  const [on, setOn] = useState(() => {
    if (typeof window === "undefined") return defaultOn ?? true;
    const v = localStorage.getItem(storageKey);
    return v === null ? !!defaultOn : v === "1";
  });
  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(storageKey, next ? "1" : "0");
  };
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-2.5 cursor-pointer">
      <span>{label}</span>
      <button
        type="button"
        onClick={toggle}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}
