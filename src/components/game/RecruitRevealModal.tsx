import { useEffect } from "react";
import { ARCHETYPE_PORTRAITS, type Girl } from "@/game/data";
import { getRecruitRarityLabel, getRecruitStars } from "@/game/recruitPresentation";

const FALLBACK_PREFERENCES = ["Solo", "Glamour"];
const FALLBACK_TAGLINE = "A new face with expensive potential.";
const POTENTIAL_LABELS: Record<string, string> = {
  late_bloomer: "Late Bloomer",
  camera_loves_her: "Camera Loves Her",
  loyal_workhorse: "Loyal Workhorse",
  niche_magnet: "Niche Magnet",
  cheap_star: "Cheap Star",
};

export function RecruitRevealModal({ girl, onClose }: { girl: Girl; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const portrait = ARCHETYPE_PORTRAITS[girl.archetype];
  const starRating = girl.starRating ?? getRecruitStars(girl);
  const rarity = girl.recruitRarityLabel ?? getRecruitRarityLabel(starRating);
  const age = girl.age ?? 24;
  const profession = girl.profession ?? `${girl.archetype} Performer`;
  const preferences = girl.preferences?.length ? girl.preferences : FALLBACK_PREFERENCES;
  const tagline = girl.tagline ?? FALLBACK_TAGLINE;

  return (
    <div className="fixed inset-0 z-[120] bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950/95 p-4" onClick={onClose}>
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-indigo-300/20 bg-black/20 p-6 shadow-[0_0_80px_rgba(192,132,252,0.25)] md:grid md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 pointer-events-none opacity-30 [background:radial-gradient(circle_at_70%_35%,rgba(96,165,250,0.45),transparent_40%),radial-gradient(circle_at_20%_75%,rgba(244,114,182,0.3),transparent_45%)]" />
        <section className="z-10 flex flex-col justify-center gap-3 md:pr-6">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">NEW RECRUIT</p>
          <h2 className="font-display text-5xl font-bold text-white drop-shadow">{girl.name}</h2>
          <p className="text-xl text-yellow-200">{"★".repeat(starRating)}<span className="ml-3 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs uppercase tracking-wider text-fuchsia-100">{rarity}</span></p>
          <div className="space-y-1 text-sm text-indigo-100/90">
            <p><span className="text-indigo-300">Age:</span> {age}</p><p><span className="text-indigo-300">Archetype:</span> {girl.archetype}</p>
            <p><span className="text-indigo-300">Profession:</span> {profession}</p>
            <p><span className="text-indigo-300">Prefers:</span> {preferences.join(" • ")}</p>
            <p><span className="text-indigo-300">Salary:</span> ${girl.salary}/week</p>
            {girl.hiddenPotential ? <p><span className="text-indigo-300">Potential:</span> {POTENTIAL_LABELS[girl.hiddenPotential] ?? "Hidden Potential"}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">{preferences.map((tag) => <span key={tag} className="rounded-full bg-pink-500/20 px-2.5 py-1 text-xs text-pink-100">{tag}</span>)}</div>
          <p className="italic text-indigo-100/80">“{tagline}”</p>
          <div className="grid grid-cols-2 gap-2 text-xs">{[["Beauty", girl.beauty],["Performance", girl.performance],["Popularity", girl.popularity],["Loyalty", girl.loyalty]].map(([label,val]) => <div key={label as string}><div className="mb-1 flex justify-between text-indigo-100"><span>{label}</span><span>{val}</span></div><div className="h-2 rounded bg-white/10"><div className="h-full rounded bg-gradient-to-r from-cyan-400 to-fuchsia-400" style={{width:`${val}%`}} /></div></div>)}</div>
        </section>
        <section className="relative z-10 mt-4 flex items-center justify-center md:mt-0">
          <div className="absolute h-64 w-64 rotate-6 border-2 border-cyan-300/60" /><div className="absolute h-64 w-64 -rotate-6 border-2 border-fuchsia-300/40" />
          {portrait ? <img src={portrait} alt={girl.archetype} className="relative max-h-[65vh] w-auto rounded-xl object-cover drop-shadow-[0_0_40px_rgba(96,165,250,0.8)]" /> : <div className="h-[420px] w-[280px] rounded-xl bg-gradient-to-b from-fuchsia-500/40 to-cyan-400/30" />}
        </section>
        <div className="z-10 mt-3 flex items-center justify-between md:col-span-2">
          <span className="text-sm text-indigo-200/70">Tap to continue...</span>
          <button onClick={onClose} className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-400">Continue</button>
        </div>
      </div>
    </div>
  );
}
