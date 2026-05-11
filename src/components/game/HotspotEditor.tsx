import { useEffect, useRef, useState } from "react";
import { HOTSPOTS, type DistrictId, type MapHotspot } from "@/game/locations";

const LS_KEY = "bustville:hotspot-overrides:v1";

type Overrides = Partial<Record<DistrictId, MapHotspot[]>>;

export function loadHotspotOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

// Merge any new default hotspots into a saved override so newly added
// locations always show up even if the user has customized positions.
function mergeWithDefaults(district: DistrictId, saved: MapHotspot[] | undefined): MapHotspot[] {
  const defs = HOTSPOTS[district];
  if (!saved) return defs;
  const present = new Set(saved.map((z) => z.id));
  const missing = defs.filter((d) => !present.has(d.id));
  return missing.length ? [...saved, ...missing] : saved;
}

export function getHotspotsFor(district: DistrictId): MapHotspot[] {
  const ov = loadHotspotOverrides();
  return mergeWithDefaults(district, ov[district]);
}

function saveOverrides(ov: Overrides) {
  localStorage.setItem(LS_KEY, JSON.stringify(ov));
  window.dispatchEvent(new Event("hotspot-overrides-changed"));
}

interface Props {
  district: DistrictId;
  mapImage: string;
  onClose: () => void;
}

type Drag =
  | { kind: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { kind: "resize"; id: string; startX: number; startY: number; ow: number; oh: number }
  | null;

export function HotspotEditor({ district, mapImage, onClose }: Props) {
  const [zones, setZones] = useState<MapHotspot[]>(() => {
    const ov = loadHotspotOverrides();
    return JSON.parse(JSON.stringify(mergeWithDefaults(district, ov[district])));
  });
  const [selected, setSelected] = useState<string | null>(zones[0]?.id ?? null);
  const [showExport, setShowExport] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - d.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - d.startY) / rect.height) * 100;
      setZones((prev) => prev.map((z) => {
        if (z.id !== d.id) return z;
        if (d.kind === "move") {
          return { ...z,
            x: clamp(d.ox + dxPct, 0, 100 - z.w),
            y: clamp(d.oy + dyPct, 0, 100 - z.h) };
        }
        return { ...z,
          w: clamp(d.ow + dxPct, 4, 100 - z.x),
          h: clamp(d.oh + dyPct, 4, 100 - z.y) };
      }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const step = e.shiftKey ? 1 : 0.25;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      setZones((prev) => prev.map((z) => z.id === selected
        ? { ...z, x: clamp(z.x + d[0], 0, 100 - z.w), y: clamp(z.y + d[1], 0, 100 - z.h) }
        : z));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const save = () => {
    const ov = loadHotspotOverrides();
    ov[district] = zones;
    saveOverrides(ov);
  };

  const reset = () => {
    const ov = loadHotspotOverrides();
    delete ov[district];
    saveOverrides(ov);
    setZones(JSON.parse(JSON.stringify(HOTSPOTS[district])));
  };

  const exportText = JSON.stringify(zones, null, 2);

  const sel = zones.find((z) => z.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/80 p-2">
        <span className="font-display text-sm uppercase tracking-widest text-accent">🛠️ Sone-editor · {district}</span>
        <span className="text-[11px] text-muted-foreground">Dra for å flytte. Hjørne for å skalere. Piltaster for finjustering (Shift = stort steg).</span>
        <div className="ml-auto flex gap-2">
          <button onClick={save} className="rounded bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground hover:opacity-90">Lagre</button>
          <button onClick={reset} className="rounded bg-destructive/80 px-3 py-1 text-xs font-bold uppercase text-destructive-foreground hover:bg-destructive">Reset</button>
          <button onClick={() => setShowExport((s) => !s)} className="rounded border border-border bg-secondary px-3 py-1 text-xs font-bold uppercase">Eksporter</button>
          <button onClick={onClose} className="rounded border border-border bg-background px-3 py-1 text-xs font-bold uppercase">Lukk</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Map */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div ref={wrapRef} className="relative aspect-[16/9] w-full max-w-6xl select-none overflow-hidden rounded-xl border border-border neon-border">
            <img src={mapImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 scan-lines opacity-15" />
            {zones.map((z) => {
              const isSel = z.id === selected;
              return (
                <div
                  key={z.id}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setSelected(z.id);
                    dragRef.current = { kind: "move", id: z.id, startX: e.clientX, startY: e.clientY, ox: z.x, oy: z.y };
                  }}
                  className={`absolute cursor-move rounded-md border-2 ${
                    isSel ? "border-accent bg-accent/20 shadow-[0_0_24px_oklch(0.8_0.2_80/0.6)]"
                          : "border-primary/70 bg-primary/10 hover:bg-primary/20"
                  }`}
                  style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                >
                  <span className="pointer-events-none absolute left-1 top-1 rounded bg-background/80 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                    {z.label}
                  </span>
                  <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-background/80 px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
                    {z.x.toFixed(1)},{z.y.toFixed(1)} · {z.w.toFixed(1)}×{z.h.toFixed(1)}
                  </span>
                  {/* resize handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelected(z.id);
                      dragRef.current = { kind: "resize", id: z.id, startX: e.clientX, startY: e.clientY, ow: z.w, oh: z.h };
                    }}
                    className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-background bg-accent"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card/60 p-3">
          <p className="font-display text-[10px] uppercase tracking-widest text-accent">Soner</p>
          <ul className="mt-2 space-y-1">
            {zones.map((z) => (
              <li key={z.id}>
                <button
                  onClick={() => setSelected(z.id)}
                  className={`w-full rounded px-2 py-1 text-left text-xs ${
                    selected === z.id ? "bg-primary/30 text-foreground" : "bg-background/40 text-muted-foreground hover:bg-background/70"
                  }`}>
                  {z.label} <span className="font-mono text-[10px] opacity-60">({z.id})</span>
                </button>
              </li>
            ))}
          </ul>

          {sel && (
            <div className="mt-4 space-y-2 rounded-md border border-border bg-background/40 p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valgt: {sel.label}</p>
              {(["x","y","w","h"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-mono uppercase text-accent">{k}</span>
                  <input
                    type="number" step="0.5" min={0} max={100}
                    value={sel[k].toFixed(2)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isNaN(v)) return;
                      setZones((prev) => prev.map((z) => z.id === sel.id ? { ...z, [k]: clamp(v, 0, 100) } : z));
                    }}
                    className="flex-1 rounded border border-border bg-background px-2 py-1 font-mono"
                  />
                </label>
              ))}
            </div>
          )}

          {showExport && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lim inn i src/game/locations.ts</p>
              <textarea readOnly value={exportText}
                className="mt-1 h-64 w-full rounded border border-border bg-background p-2 font-mono text-[10px]"
                onClick={(e) => { (e.target as HTMLTextAreaElement).select(); navigator.clipboard?.writeText(exportText); }} />
              <p className="mt-1 text-[10px] text-muted-foreground">Klikk for å kopiere.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
