import { useState, useMemo } from "react";
import { ARCHETYPE_PORTRAITS, type Girl, type GalleryScene } from "@/game/data";

export function GallerySheet({ girls, onClose }: { girls: Girl[]; onClose: () => void }) {
  const all = useMemo(() => {
    const flat: { girl: Girl; scene: GalleryScene }[] = [];
    girls.forEach((g) => (g.gallery ?? []).forEach((s) => flat.push({ girl: g, scene: s })));
    return flat.sort((a, b) => b.scene.day - a.scene.day);
  }, [girls]);

  const [filter, setFilter] = useState<string>("all");
  const [preview, setPreview] = useState<{ girl: Girl; scene: GalleryScene } | null>(null);

  const filtered = filter === "all" ? all : all.filter((x) => x.girl.id === filter);
  const totalUnlocked = all.length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase neon-text">Galleri</h2>
            <p className="text-xs text-muted-foreground">
              {totalUnlocked} scener låst opp · jobb mer for å samle flere bilder
            </p>
          </div>
          <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-sm">Lukk</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          <FilterPill on={filter === "all"} onClick={() => setFilter("all")}>Alle</FilterPill>
          {girls.map((g) => (
            <FilterPill key={g.id} on={filter === g.id} onClick={() => setFilter(g.id)}>
              <img src={ARCHETYPE_PORTRAITS[g.archetype]} alt="" className="h-4 w-4 rounded-full object-cover" />
              {g.name} <span className="ml-1 text-[9px] text-muted-foreground">{(g.gallery ?? []).length}</span>
            </FilterPill>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen scener ennå. Send jentene på oppdrag, kjør webcam-show eller slipp en film.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map(({ girl, scene }) => (
              <button key={scene.id} onClick={() => setPreview({ girl, scene })}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-secondary/40 hover:border-primary transition">
                <ScenePlaceholder girl={girl} scene={scene} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-1.5">
                  <div className="text-[10px] font-bold leading-tight">{scene.title}</div>
                  <div className="text-[9px] text-muted-foreground">{girl.name} · d.{scene.day}</div>
                </div>
                <div className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs leading-none py-0.5">{scene.emoji}</div>
              </button>
            ))}
          </div>
        )}

        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4" onClick={() => setPreview(null)}>
            <div onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl border border-primary/60 bg-card shadow-2xl">
              <div className="aspect-[3/4] relative">
                <ScenePlaceholder girl={preview.girl} scene={preview.scene} large />
              </div>
              <div className="p-3">
                <div className="font-display text-lg uppercase">{preview.scene.title}</div>
                <div className="text-xs text-muted-foreground">{preview.girl.name} · {preview.girl.archetype} · dag {preview.scene.day}</div>
                <button onClick={() => setPreview(null)} className="mt-3 w-full rounded bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">Lukk</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenePlaceholder({ girl, scene, large }: { girl: Girl; scene: GalleryScene; large?: boolean }) {
  const portrait = ARCHETYPE_PORTRAITS[girl.archetype];
  return (
    <div className="absolute inset-0">
      <img src={portrait} alt={girl.name}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: `hue-rotate(${scene.hue - 320}deg) saturate(1.2) contrast(1.05)` }}
        loading="lazy" />
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, oklch(0.45 0.2 ${scene.hue} / 0.45), oklch(0.2 0.1 ${(scene.hue + 60) % 360} / 0.55))` }} />
      {large && (
        <div className="absolute left-3 top-3 rounded bg-background/70 px-2 py-1 text-xs uppercase tracking-widest">
          {scene.emoji} {scene.kind}
        </div>
      )}
    </div>
  );
}

function FilterPill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${
        on ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background/50 text-muted-foreground hover:border-primary/60"
      }`}>
      {children}
    </button>
  );
}
