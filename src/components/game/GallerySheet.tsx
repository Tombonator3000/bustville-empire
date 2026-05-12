import { useState, useMemo } from "react";
import { ARCHETYPE_PORTRAITS, type Girl, type GalleryScene } from "@/game/data";

const MAX_PHOTOS_PER_GIRL = 12;

type Tab = "all" | "dates" | "photos";

export function GallerySheet({ girls, onClose }: { girls: Girl[]; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [preview, setPreview] = useState<{ girl: Girl; scene: GalleryScene } | null>(null);

  const isDate  = (s: GalleryScene) => s.kind.startsWith("visit-") || s.kind === "date";
  const isPhoto = (s: GalleryScene) => !isDate(s);

  const stats = useMemo(() => {
    return girls.map((g) => {
      const list = g.gallery ?? [];
      return {
        girl: g,
        photos: list.filter(isPhoto),
        dates:  list.filter(isDate),
      };
    });
  }, [girls]);

  const totals = useMemo(() => {
    let p = 0, d = 0;
    stats.forEach((s) => { p += s.photos.length; d += s.dates.length; });
    return { p, d };
  }, [stats]);

  const focusGirls = selectedId === "all" ? stats : stats.filter((s) => s.girl.id === selectedId);

  // Build the slot list to render in main area
  const slots = useMemo(() => {
    const items: { girl: Girl; scene?: GalleryScene; key: string }[] = [];
    focusGirls.forEach(({ girl, photos, dates }) => {
      const pool = tab === "dates" ? dates : tab === "photos" ? photos : [...photos, ...dates];
      const max = tab === "dates" ? Math.max(dates.length, 4)
                : tab === "photos" ? MAX_PHOTOS_PER_GIRL
                : MAX_PHOTOS_PER_GIRL;
      for (let i = 0; i < max; i++) {
        const sc = pool[i];
        items.push({ girl, scene: sc, key: `${girl.id}-${i}` });
      }
    });
    return items;
  }, [focusGirls, tab]);

  return (
    <div className="fixed inset-0 z-40 flex bg-background/85 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full overflow-hidden bg-card">

        {/* LEFT: Girl roster */}
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-secondary/40">
          <div className="border-b border-border p-3">
            <h2 className="font-display text-xl uppercase neon-text">Galleri</h2>
            <p className="text-[10px] text-muted-foreground">
              {totals.p} bilder · {totals.d} dater
            </p>
          </div>

          <button onClick={() => setSelectedId("all")}
            className={`m-3 rounded-lg border px-3 py-2 text-center text-sm font-bold uppercase tracking-wider transition ${
              selectedId === "all" ? "border-primary bg-primary/20 text-foreground" : "border-border bg-background/40 text-muted-foreground hover:border-primary/60"
            }`}>
            All photos
          </button>

          <div className="grid grid-cols-2 gap-2 overflow-y-auto px-3 pb-3">
            {stats.length === 0 && (
              <p className="col-span-2 rounded-lg border border-dashed border-border p-3 text-center text-[10px] text-muted-foreground">
                Ingen stjerner ennå.
              </p>
            )}
            {stats.map(({ girl, photos, dates }) => {
              const on = selectedId === girl.id;
              const total = photos.length + dates.length;
              return (
                <button key={girl.id} onClick={() => setSelectedId(girl.id)}
                  className={`group flex flex-col items-center rounded-lg border p-2 transition ${
                    on ? "border-primary bg-primary/15" : "border-transparent hover:border-primary/40 hover:bg-background/30"
                  }`}>
                  <div className={`relative h-16 w-16 overflow-hidden rounded-full ring-2 ${on ? "ring-primary" : "ring-border"}`}>
                    <img src={ARCHETYPE_PORTRAITS[girl.archetype]} alt={girl.name}
                      className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="mt-1 text-xs font-bold leading-tight">{girl.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {total}/{MAX_PHOTOS_PER_GIRL}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: content */}
        <section className="relative flex flex-1 flex-col overflow-hidden">
          {/* hero backdrop */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.35 0.12 30 / 0.55), oklch(0.18 0.10 290 / 0.65))",
            }} />
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: "radial-gradient(ellipse at 70% 30%, oklch(0.7 0.18 30 / 0.6), transparent 60%)",
            }} />

          <div className="relative flex items-center justify-between border-b border-border/60 bg-background/40 px-5 py-3 backdrop-blur">
            <div className="flex gap-6 text-sm font-bold uppercase tracking-wider">
              <TabBtn on={tab === "all"}    onClick={() => setTab("all")}>Alle</TabBtn>
              <TabBtn on={tab === "dates"}  onClick={() => setTab("dates")}>
                Dates <span className="ml-1 font-mono text-xs text-muted-foreground">{totals.d}/{stats.length * 4 || 0}</span>
              </TabBtn>
              <TabBtn on={tab === "photos"} onClick={() => setTab("photos")}>
                Photos <span className="ml-1 font-mono text-xs text-muted-foreground">{totals.p}/{stats.length * MAX_PHOTOS_PER_GIRL || 0}</span>
              </TabBtn>
            </div>
            <button onClick={onClose} className="rounded bg-secondary px-3 py-1 text-xs">✕ Lukk</button>
          </div>

          <div className="relative flex-1 overflow-y-auto p-5">
            {slots.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
                Ingenting å vise. Send jentene på oppdrag, kjør webcam-show eller ta imot besøk.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {slots.map(({ girl, scene, key }) => (
                  <div key={key}
                    className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-border/60 bg-background/60 shadow-md transition">
                    {scene ? (
                      <button onClick={() => setPreview({ girl, scene })} className="block h-full w-full text-left">
                        <ScenePlaceholder girl={girl} scene={scene} />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-2">
                          <div className="text-[11px] font-bold leading-tight">{scene.title}</div>
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                            {girl.name} · d.{scene.day}
                          </div>
                        </div>
                        <div className="absolute right-1.5 top-1.5 rounded bg-background/80 px-1 py-0.5 text-xs leading-none">
                          {scene.emoji}
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-background/70">
                        <span className="text-3xl text-muted-foreground/60">🔒</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4" onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-primary/60 bg-card shadow-2xl">
            <div className="aspect-[16/10] relative">
              <ScenePlaceholder girl={preview.girl} scene={preview.scene} large />
            </div>
            <div className="p-4">
              <div className="font-display text-xl uppercase">{preview.scene.title}</div>
              <div className="text-xs text-muted-foreground">
                {preview.girl.name} · {preview.girl.archetype} · dag {preview.scene.day} · {preview.scene.kind}
              </div>
              <button onClick={() => setPreview(null)} className="mt-3 w-full rounded bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">Lukk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`relative pb-1 transition ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
      <span className={`absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full transition ${on ? "bg-primary" : "bg-transparent"}`} />
    </button>
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
