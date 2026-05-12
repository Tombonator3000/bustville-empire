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

// Cover-bilder (stiliserte, non-sexualized plakater) brukt som default i galleri/menyer
import coverWebshowSolo from "@/assets/cover-webshow-solo.jpg";
import coverWebshowLingerie from "@/assets/cover-webshow-lingerie.jpg";
import coverWebshowToys from "@/assets/cover-webshow-toys.jpg";
import coverStudioQuickie from "@/assets/cover-studio-quickie.jpg";
import coverStudioGlamour from "@/assets/cover-studio-glamour.jpg";
import coverStudioFeature from "@/assets/cover-studio-feature.jpg";
import coverStudioBlockbuster from "@/assets/cover-studio-blockbuster.jpg";
import coverShop from "@/assets/cover-shop.jpg";
import coverVisitTrucker from "@/assets/cover-visit-trucker.jpg";
import coverVisitDrunk from "@/assets/cover-visit-drunk.jpg";
import coverVisitBachelor from "@/assets/cover-visit-bachelor.jpg";
import coverVisitPolitician from "@/assets/cover-visit-politician.jpg";
import coverVisitScout from "@/assets/cover-visit-scout.jpg";
import coverVisitVipsuite from "@/assets/cover-visit-vipsuite.jpg";
import coverSceneMission from "@/assets/cover-scene-mission.jpg";
import coverSceneTraining from "@/assets/cover-scene-training.jpg";
import coverSceneProduction from "@/assets/cover-scene-production.jpg";
import coverSceneDefault from "@/assets/cover-scene-default.jpg";

export const STUDIO_COVERS: Record<string, string> = {
  quickie: coverStudioQuickie,
  glamour: coverStudioGlamour,
  feature: coverStudioFeature,
  blockbuster: coverStudioBlockbuster,
};
export const SHOP_COVER = coverShop;
export const SCENE_FALLBACKS: Record<string, string> = {
  mission: coverSceneMission,
  training: coverSceneTraining,
  production: coverSceneProduction,
  default: coverSceneDefault,
};

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

export interface Contract {
  signingBonus: number;
  weeklyMin: number;       // ukentlig minimum-lønn (overstyrer salary hvis høyere)
  signedDay: number;
  lengthWeeks: number;     // 4 / 8 / 12
  expiresDay: number;      // dag kontrakten utløper
}

export interface GalleryScene {
  id: string;            // unique
  day: number;
  title: string;         // "Solo Tease Show"
  kind: string;          // "webcam-solo" | "mission-club" | "production-feature" ...
  emoji: string;         // for tile badge
  hue: number;           // 0-360, for placeholder gradient
}

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
  contract?: Contract;       // aktiv kontrakt (undefined = free agent / utgått)
  gallery?: GalleryScene[];  // unlocked scenes from jobs/missions/productions
  std?: import("./health").STDState; // smitte fra risikable scener
}

export interface WebcamShowDef {
  id: string;
  label: string;
  emoji: string;
  level: number;     // unlock level (1 = default unlocked)
  cost: number;      // cash cost per show
  basePay: number;
  rep: number;
  hours: number;
  hue: number;       // gallery tint
  scene: string;     // gallery scene title
  flavor: string;
}

export const WEBCAM_SHOWS: WebcamShowDef[] = [
  { id: "solo",     label: "Solo Tease",    emoji: "💋", level: 1, cost: 40,  basePay: 180,  rep: 1, hours: 2, hue: 320,
    scene: "Solo Tease Show",  flavor: "Ringlys, lavendel-filter, 47 betalende seere." },
  { id: "lingerie", label: "Lingerie Show", emoji: "👙", level: 2, cost: 90,  basePay: 360,  rep: 2, hours: 3, hue: 280,
    scene: "Lingerie Webcam",  flavor: "Silke, satin og chat-tipsene renner inn." },
  { id: "toys",     label: "Toy Play",      emoji: "🪀", level: 3, cost: 160, basePay: 640,  rep: 3, hours: 3, hue: 0,
    scene: "Toy Play Stream",  flavor: "Hardcore solo. Premium-kanalen koker." },
];

export const WEBCAM_UPGRADE_COST = (currentLevel: number) =>
  Math.floor(800 * Math.pow(currentLevel + 1, 1.4));

/* ===== TRAILER VISITS ===== */
export interface VisitTypeDef {
  id: string;
  label: string;
  emoji: string;
  level: number;        // unlock level for trailerLevel
  cost: number;         // upfront expense (snacks, sprit, lokalt smøremiddel)
  basePay: number;
  rep: number;
  hours: number;
  heat: number;         // basis-heat for handlingen (0–5)
  hue: number;          // gallery tint
  scene: string;
  flavor: string;
  needsGirl?: boolean;  // true = må ha en stjerne tilstede
  risky?: boolean;      // true = STD-roll triggres på intense
}

export const VISIT_TYPES: VisitTypeDef[] = [
  { id: "trucker",  label: "Trucker-besøk",       emoji: "🚛", level: 1, cost: 10,  basePay: 220,  rep: 1, hours: 1, heat: 2, hue: 30,
    scene: "Trucker on the Couch",     flavor: "Diesel, Marlboro og kontanter i en brun konvolutt." },
  { id: "drunk",    label: "Lokal fyllik",         emoji: "🍺", level: 1, cost: 5,   basePay: 140,  rep: 0, hours: 1, heat: 1, hue: 50,
    scene: "Bourbon at Midnight",       flavor: "Han bruker mer på øl enn på deg, men betaler i tide." },
  { id: "bachelor", label: "Bachelor-pakke",       emoji: "🎉", level: 2, cost: 60,  basePay: 520,  rep: 2, hours: 2, heat: 3, hue: 290,
    scene: "Bachelor Party Special",    flavor: "Seks fulle gutter, én stjerne, et batteri av iPhones.", needsGirl: true, risky: true },
  { id: "politician", label: "Lokalpolitiker",     emoji: "🎩", level: 3, cost: 120, basePay: 880,  rep: 3, hours: 2, heat: 5, hue: 220,
    scene: "Senator's Secret Visit",    flavor: "Han kom inn med Bibel, går ut med leppestift på kragen.", risky: true },
  { id: "scout",    label: "LA-talentspeider",     emoji: "🕶️", level: 3, cost: 180, basePay: 600,  rep: 6, hours: 2, heat: 1, hue: 200,
    scene: "Scout from Los Angeles",    flavor: "Han noterer alt, fra wallpaper til kroppsspråk. Rep-injeksjon.", needsGirl: true },
  { id: "vipsuite", label: "VIP-suite (privat)",   emoji: "💎", level: 4, cost: 280, basePay: 1700, rep: 5, hours: 3, heat: 6, hue: 320,
    scene: "VIP Suite Service",         flavor: "Champagne, kaviar og en bunke 100-dollar-sedler. Diskresjon ekstra.", needsGirl: true, risky: true },
];

export const VISIT_UPGRADE_COST = (currentLevel: number) =>
  Math.floor(450 * Math.pow(currentLevel + 1, 1.6));

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
