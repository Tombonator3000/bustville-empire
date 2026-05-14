export interface Rival {
  id: string;
  name: string;
  emoji: string;
  share: number; // markedsandel 0-100, sum med spiller normaliseres ved bruk
  rep: number; // kosmetisk
  notoriety: number; // 0-100, hvor aggressive de er
  momentum: number; // -100..100, trend siste uke
  weeklyMove: string; // siste ukeoppsummering
  lastDelta: number; // +/- share siden forrige uke
}

export const INITIAL_RIVALS: Rival[] = [
  {
    id: "scarlet",
    name: "Scarlet Pictures",
    emoji: "🌹",
    share: 28,
    rep: 60,
    notoriety: 55,
    momentum: 4,
    weeklyMove: "Signerte tre nye stjerner.",
    lastDelta: 0,
  },
  {
    id: "neon",
    name: "Neon Knights Studios",
    emoji: "🌃",
    share: 22,
    rep: 45,
    notoriety: 70,
    momentum: 7,
    weeklyMove: "Kjøpte nytt studio-kvartal.",
    lastDelta: 0,
  },
];

const RIVAL_HEADLINES: Record<string, string[]> = {
  scarlet: [
    "Scarlet Pictures slipper 'Velvet Hours 4' — utsolgt i Memphis.",
    "Scarlet signerte tre nye stjerner denne uka.",
    "Scarlet's regnskapsfører er sett på Bahamas. Igjen.",
    "Rykter: Scarlet planlegger et drive-in-takeover i sommer.",
  ],
  neon: [
    "Neon Knights kjøpte hele kvartalet bak Velvet-klubben.",
    "Neon Knights' nye blockbuster fikk 2 stjerner i Bustville Bugle.",
    "Neon Knights' boss spotted med sheriff Buck på Dirty Dan's.",
    "Neon Knights tilbyr $20k signing bonus til topp-stjerner.",
  ],
};

const CITY_HEADLINES = [
  "Sheriff Buck advarer mot 'umoralsk fortjeneste' — selger ny sigar-merch.",
  "Bustville Bugle: 'Er trailer-cinema ny kunstform?'",
  "Drive-in-eieren spør etter mer innhold for fredag.",
  "Distribusjonsavtaler øker — kabel-TV vil ha mer søring-stoff.",
  "Awards-sesongen nærmer seg. Hvem tar Golden G-strings?",
  "Stinky's gas-stasjon utvider — mer plass under disken.",
];

/** Kjør ukentlig markeds-tick. Returnerer nye rivaler + ukens overskrifter. */
export function tickRivals(
  rivals: Rival[],
  playerRep: number,
): { rivals: Rival[]; news: string[] } {
  const news: string[] = [];
  const next = rivals.map((r) => {
    const prevShare = r.share;
    const drift = (Math.random() - 0.5) * 6 + (r.notoriety - 50) * 0.04;
    const repGain = Math.random() < 0.6 ? Math.floor(Math.random() * 4) : 0;
    const share = Math.max(5, Math.min(60, r.share + drift));
    const movePool = RIVAL_HEADLINES[r.id] ?? [];
    const weeklyMove = movePool.length
      ? movePool[Math.floor(Math.random() * movePool.length)]
      : "Rolig uke i kulissene.";
    const lastDelta = Math.round((share - prevShare) * 10) / 10;
    const momentum = Math.max(-100, Math.min(100, Math.round(r.momentum * 0.45 + lastDelta * 11)));
    if (Math.random() < 0.55) {
      if (movePool.length)
        news.push(`${r.emoji} ${movePool[Math.floor(Math.random() * movePool.length)]}`);
    }
    return { ...r, share, rep: r.rep + repGain, momentum, weeklyMove, lastDelta };
  });
  if (Math.random() < 0.7) {
    news.push(`📰 ${CITY_HEADLINES[Math.floor(Math.random() * CITY_HEADLINES.length)]}`);
  }
  if (playerRep > 80 && Math.random() < 0.4) {
    news.push("📰 Bustville Bugle: 'Lokal gründer truer etablerte studioer.'");
  }
  return { rivals: next, news };
}

/** Spillerens andel av markedet (0..1) — brukes til å skalere release-payout. */
export function playerMarketShare(rivals: Rival[], playerRep: number): number {
  const playerScore = Math.max(10, playerRep);
  const rivalScore = rivals.reduce((a, r) => a + r.share, 0);
  return playerScore / (playerScore + rivalScore);
}

/** Plukk én daglig overskrift (kort, brukes som ticker). */
export function dailyHeadline(rivals: Rival[]): string {
  const pool: string[] = [];
  for (const r of rivals) {
    const h = RIVAL_HEADLINES[r.id];
    if (h) pool.push(`${r.emoji} ${h[Math.floor(Math.random() * h.length)]}`);
  }
  pool.push(`📰 ${CITY_HEADLINES[Math.floor(Math.random() * CITY_HEADLINES.length)]}`);
  return pool[Math.floor(Math.random() * pool.length)];
}
