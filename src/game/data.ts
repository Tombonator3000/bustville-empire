import trailerImg from "@/assets/loc-trailer.jpg";
import apartmentImg from "@/assets/loc-apartment.jpg";
import loftImg from "@/assets/loc-loft.jpg";
import studioImg from "@/assets/loc-studio.jpg";
import hqImg from "@/assets/loc-hq.jpg";
import girlAmateur from "@/assets/girl-amateur.jpg";
import girlParty from "@/assets/girl-party.jpg";
import girlIceQueen from "@/assets/girl-icequeen.jpg";
import girlNextDoor from "@/assets/girl-nextdoor.jpg";
import girlMilf from "@/assets/girl-milf.jpg";
import girlExotic from "@/assets/girl-exotic.jpg";

export const ARCHETYPE_PORTRAITS: Record<string, string> = {
  "Amateur Sweetheart": girlAmateur,
  "Wild Party Girl": girlParty,
  "Ice Queen Pornstar": girlIceQueen,
  "Girl Next Door": girlNextDoor,
  "MILF Next Door": girlMilf,
  "Exotic Import": girlExotic,
};

export interface GirlMission {
  endsAt: number;       // absolute hour (day * 24 + hour)
  id: string;
  label: string;
  payout: number;
  rep: number;
}

export const GIRL_MISSIONS = [
  { id: "webcam",   label: "Webcam Solo",      emoji: "💻", hours: 4,  basePay: 220,  rep: 1, statKey: "performance" as const, min: 0 },
  { id: "club",     label: "Strip Club Gig",   emoji: "💃", hours: 6,  basePay: 380,  rep: 2, statKey: "beauty"      as const, min: 30 },
  { id: "onlyfans", label: "OnlyFans Grind",   emoji: "🔥", hours: 8,  basePay: 560,  rep: 2, statKey: "popularity"  as const, min: 35 },
  { id: "vip",      label: "VIP Eskorte",      emoji: "💎", hours: 10, basePay: 1200, rep: 3, statKey: "beauty"      as const, min: 55 },
  { id: "tour",     label: "Convention Tour",  emoji: "✈️", hours: 14, basePay: 2200, rep: 5, statKey: "popularity"  as const, min: 65 },
] as const;
export type MissionDef = (typeof GIRL_MISSIONS)[number];

export type Phase = "startup" | "empire";

export interface Location {
  level: number;
  name: string;
  phase: Phase;
  image: string;
  unlockCash: number;
  unlockRep: number;
  tagline: string;
}

export const LOCATIONS: Location[] = [
  { level: 1, name: "Rusty Trailer Park", phase: "startup", image: trailerImg, unlockCash: 0, unlockRep: 0,
    tagline: "Hjem, kjære hjem. Lukter rust, øl og muligheter." },
  { level: 2, name: "Suburban Apartment", phase: "startup", image: apartmentImg, unlockCash: 5200, unlockRep: 28,
    tagline: "Et ekte tak over hodet. Naboene hater deg allerede." },
  { level: 3, name: "Downtown Loft Studio", phase: "empire", image: loftImg, unlockCash: 24500, unlockRep: 55,
    tagline: "Nå lager du kunst. Sier i hvert fall regnskapsføreren." },
  { level: 4, name: "Professional Porn Studio", phase: "empire", image: studioImg, unlockCash: 98000, unlockRep: 88,
    tagline: "Røde gardiner. Hvite reflektorer. Sorte tall." },
  { level: 5, name: "Bustville Empire HQ", phase: "empire", image: hqImg, unlockCash: 380000, unlockRep: 130,
    tagline: "Du har et neon-leppe-logo på toppen. Du har vunnet." },
];

export const ARCHETYPES = [
  "Amateur Sweetheart",
  "Wild Party Girl",
  "Ice Queen Pornstar",
  "Girl Next Door",
  "MILF Next Door",
  "Exotic Import",
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const FIRST_NAMES = [
  "Candy", "Brandi", "Roxy", "Destinee", "Jasmine", "Kerstin", "Tiffany",
  "Misty", "Honey", "Sasha", "Lola", "Bambi", "Cherry", "Vixen", "Crystal",
  "Anastasia", "Yuki", "Monique", "Raven", "Skye",
];
export const LAST_NAMES = [
  "Diamond", "Love", "Knight", "Sparks", "Foxx", "Steele", "Storm",
  "Sinclair", "Velvet", "Cross", "Ray", "Moon", "Lane", "West", "Hart",
];

export interface Girl {
  id: string;
  name: string;
  archetype: Archetype;
  beauty: number;
  performance: number;
  popularity: number;
  loyalty: number;
  salary: number;
  mission?: GirlMission;
  lastActivity?: string;     // shown inline under the portrait
  lastActivityDay?: number;
  busyUntil?: number;        // absolute hour until girl is back from short-form work cooldown
}

export const CONTENT_TYPES = [
  { id: "webcam", name: "Webcam Show", cost: 40, minLevel: 1, basePay: 180, repGain: 1, stamina: 15,
    flavor: 'Du justerer ringlyset med teip. "Funker." En time senere: 47 betalende seere.' },
  { id: "visit", name: "Trailer Visit", cost: 10, minLevel: 1, basePay: 240, repGain: 1, stamina: 20,
    flavor: "En herre i dress dukker opp. Forteller kona at han 'fikser bilen'. Penger skifter hender." },
  { id: "moonshine", name: "Selg Moonshine", cost: 60, minLevel: 1, basePay: 320, repGain: 0, stamina: 10,
    flavor: 'Sheriff Buck blunker. "Jeg så ingenting." Du gir ham en flaske. Han ser virkelig ingenting.' },
  { id: "onlyfans", name: "OnlyFans-pakke", cost: 80, minLevel: 2, basePay: 520, repGain: 2, stamina: 18,
    flavor: "Algoritmen elsker dere denne uka. Abonnementene strømmer inn." },
  { id: "glamour", name: "Glamour Shoot", cost: 250, minLevel: 3, basePay: 1400, repGain: 4, stamina: 25,
    flavor: "Vifte, silke, gylne timer. Selv fotografen blir rørt." },
  { id: "feature", name: "Feature Film", cost: 900, minLevel: 4, basePay: 4800, repGain: 8, stamina: 35,
    flavor: "Manus. Belysning. En faktisk lydtekniker. Du føler deg som Spielberg. Slags." },
  { id: "intl", name: "International Deal", cost: 3200, minLevel: 5, basePay: 18500, repGain: 14, stamina: 30,
    flavor: "Tyskland, Japan, Brasil. Alle vil ha Bustville-merket. Du signerer kontrakter med gull-penn." },
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const RANDOM_EVENTS: Array<{
  text: string;
  cash?: number;
  rep?: number;
  stamina?: number;
  minLevel?: number;
}> = [
  { text: "🎉 Viralt klipp! En av jentene dine trender. +$1200, +5 rep.", cash: 1200, rep: 5 },
  { text: "🚓 Politirazzia. Du måtte 'snakke' deg ut av det. -$400.", cash: -400 },
  { text: "📺 Lokal TV-stasjon vil intervjue 'gründeren'. +6 rep.", rep: 6 },
  { text: "💔 Sjalu eks dukker opp og bråker. -3 rep.", rep: -3 },
  { text: "🍑 Moonshine-festen ble litt for våt. -10 stamina, +2 rep.", stamina: -10, rep: 2 },
  { text: "💸 Skattemyndighetene 'glemte' mappen din. +$600 reddet.", cash: 600 },
  { text: "📰 Bustville Gazette kaller deg 'den nye smaken av synd'. +4 rep.", rep: 4 },
  { text: "🔧 Trailerdøra falt av. Reparasjon: -$180.", cash: -180 },
  { text: "👠 En agent ringer fra LA. Du later som du har fasttelefon. +3 rep.", rep: 3 },
  { text: "🎬 Premiere ble en hit. +$2400, +6 rep.", cash: 2400, rep: 6, minLevel: 3 },
  { text: "🌍 Internasjonal lisens signert i Berlin. +$8000.", cash: 8000, minLevel: 4 },
];
