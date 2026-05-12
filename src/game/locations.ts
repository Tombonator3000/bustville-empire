import trailerImg from "@/assets/loc-trailer.jpg";
import moonshineImg from "@/assets/loc-moonshine.jpg";
import barImg from "@/assets/loc-bar.jpg";
import sheriffImg from "@/assets/loc-sheriff.jpg";
import gasImg from "@/assets/loc-gasstation.jpg";
import forestImg from "@/assets/loc-forest.jpg";
import loftImg from "@/assets/loc-loft.jpg";
import velvetImg from "@/assets/loc-velvet.jpg";
import bankImg from "@/assets/loc-bank.jpg";
import studioImg from "@/assets/loc-studio.jpg";
import hqImg from "@/assets/loc-hq.jpg";
import electroImg from "@/assets/loc-electro.jpg";
import boutiqueImg from "@/assets/loc-boutique.jpg";
import castingImg from "@/assets/loc-casting.jpg";
import distribImg from "@/assets/loc-distrib.jpg";
import clinicImg from "@/assets/loc-clinic.jpg";
import mapTrailerDay from "@/assets/map-trailerpark-day.jpg";
import mapTrailerNight from "@/assets/map-trailerpark-night.jpg";
import mapDowntown from "@/assets/map-downtown.jpg";

export type LocationId =
  | "trailer" | "moonshine" | "bar" | "sheriff" | "gas" | "forest"
  | "loft" | "velvet" | "bank" | "studio" | "hq"
  | "electro" | "boutique" | "casting" | "distrib" | "clinic";

export type DistrictId = "park" | "downtown";

export interface District {
  id: DistrictId;
  name: string;
  image: string;
  nightImage?: string;
  unlockLevel: number;
  tagline: string;
}

export const DISTRICTS: District[] = [
  { id: "park", name: "Bustville Trailer Park", image: mapTrailerDay, nightImage: mapTrailerNight, unlockLevel: 1,
    tagline: "Rust, røyk og rå muligheter." },
  { id: "downtown", name: "Downtown Bustville", image: mapDowntown, unlockLevel: 3,
    tagline: "Neon, kontrakter og kokain på regnskapsføreren." },
];

// Special non-location hotspot ids used for map transitions (district exits, etc.)
export type SpecialHotspotId = "downtown_exit";
export type HotspotId = LocationId | SpecialHotspotId;

export const SPECIAL_HOTSPOT_IDS: SpecialHotspotId[] = ["downtown_exit"];
export const isSpecialHotspot = (id: HotspotId): id is SpecialHotspotId =>
  (SPECIAL_HOTSPOT_IDS as string[]).includes(id);

export interface MapHotspot {
  id: HotspotId;
  // % positions on the district map (0-100)
  x: number; y: number; w: number; h: number;
  label: string;
}

export const HOTSPOTS: Record<DistrictId, MapHotspot[]> = {
  park: [
    { id: "trailer",       x: 71.42, y: 28.27, w: 28.58, h: 29.37, label: "Din Trailer" },
    { id: "moonshine",     x: 54.43, y: 7.82,  w: 15.76, h: 21.14, label: "Moonshine-skjul" },
    { id: "bar",           x: 3.01,  y: 40.18, w: 22,    h: 26,    label: "Dirty Dan's" },
    { id: "sheriff",       x: 30.48, y: 46.46, w: 12.41, h: 27.77, label: "Sheriff Buck" },
    { id: "gas",           x: 64.63, y: 57.71, w: 22,    h: 28,    label: "Bensinstasjon" },
    { id: "forest",        x: 78,    y: 4.57,  w: 22,    h: 23.37, label: "Skogen" },
    { id: "clinic",        x: 28.83, y: 22.39, w: 9.56,  h: 18.74, label: "Doc Lonnies" },
    { id: "downtown_exit", x: 11.67, y: 15.24, w: 14.17, h: 13.25, label: "Vei til Downtown" },
  ],
  downtown: [
    { id: "loft",     x: 4,  y: 18, w: 20, h: 30, label: "Loft Studio" },
    { id: "velvet",   x: 26, y: 30, w: 22, h: 30, label: "Klubb Velvet" },
    { id: "bank",     x: 52, y: 50, w: 18, h: 26, label: "Bustville Bank" },
    { id: "studio",   x: 6,  y: 62, w: 20, h: 28, label: "Pro Studio" },
    { id: "hq",       x: 72, y: 8,  w: 22, h: 28, label: "Empire HQ" },
    { id: "electro",  x: 30, y: 64, w: 18, h: 26, label: "Sparky's Camera" },
    { id: "boutique", x: 50, y: 14, w: 18, h: 24, label: "Glitter & Garter" },
    { id: "casting",  x: 74, y: 42, w: 18, h: 24, label: "Open Mic Casting" },
    { id: "distrib",  x: 78, y: 72, w: 20, h: 24, label: "Reel Republic" },
  ],
};

export interface LocationDef {
  id: LocationId;
  name: string;
  district: DistrictId;
  image: string;
  description: string;
  openHours: [number, number]; // 24h, end exclusive
  unlockLevel?: number;
}

export const LOCATION_DEFS: Record<LocationId, LocationDef> = {
  trailer: {
    id: "trailer", name: "Din Trailer", district: "park", image: trailerImg,
    description: "Hjemmebase. Sengen knirker, ringlyset funker, og det lukter litt rart.",
    openHours: [0, 24],
  },
  moonshine: {
    id: "moonshine", name: "Moonshine-skjulet", district: "park", image: moonshineImg,
    description: "Destilleriet bobler bak treet. Ulovlig. Lønnsomt. Smaker som maling.",
    openHours: [0, 24],
  },
  bar: {
    id: "bar", name: "Dirty Dan's", district: "park", image: barImg,
    description: "Honky-tonk full av cowboyer, øl og tvilsomme avtaler.",
    openHours: [16, 24],
  },
  sheriff: {
    id: "sheriff", name: "Sheriff Bucks Kontor", district: "park", image: sheriffImg,
    description: "Buck sitter med en smultring og et bestikkelses-glis.",
    openHours: [8, 18],
  },
  gas: {
    id: "gas", name: "Stinky's Gas", district: "park", image: gasImg,
    description: "Truckere stopper, fyller på, og kjøper det de IKKE bør.",
    openHours: [0, 24],
  },
  forest: {
    id: "forest", name: "Skogen", district: "park", image: forestImg,
    description: "Folk gjemmer seg her. Inkludert vakre fremmede.",
    openHours: [0, 24],
  },
  loft: {
    id: "loft", name: "Loft Studio", district: "downtown", image: loftImg,
    description: "Eksponert murvegg. Profesjonelt lys. Husleia er kriminell.",
    openHours: [0, 24], unlockLevel: 3,
  },
  velvet: {
    id: "velvet", name: "Klubb Velvet", district: "downtown", image: velvetImg,
    description: "Røde tau, glitrende kjoler, kontakter du trenger.",
    openHours: [20, 24], unlockLevel: 3,
  },
  bank: {
    id: "bank", name: "Bustville Bank", district: "downtown", image: bankImg,
    description: "Mr. Goldstein røyker sigar og elsker dine renter.",
    openHours: [9, 16], unlockLevel: 3,
  },
  studio: {
    id: "studio", name: "Pro Studio", district: "downtown", image: studioImg,
    description: "Røde gardiner, faktiske manus, fagforening-fotografer.",
    openHours: [0, 24], unlockLevel: 4,
  },
  hq: {
    id: "hq", name: "Bustville Empire HQ", district: "downtown", image: hqImg,
    description: "Helikopter-platå. Neon-logo. Du tok over byen.",
    openHours: [0, 24], unlockLevel: 5,
  },
  electro: {
    id: "electro", name: "Sparky's Camera Shack", district: "downtown", image: electroImg,
    description: "Brukte kameraer, lyspakker og redigeringsdekk. Sparky kan ordne nesten alt.",
    openHours: [10, 20], unlockLevel: 3,
  },
  boutique: {
    id: "boutique", name: "Glitter & Garter", district: "downtown", image: boutiqueImg,
    description: "Kostymer, parykker og strass for hver scene. Madame Vi vet hva som selger.",
    openHours: [11, 21], unlockLevel: 3,
  },
  casting: {
    id: "casting", name: "Open Mic Casting", district: "downtown", image: castingImg,
    description: "Kø av håpefulle. Book audition-slot, få et casting-voucher til neste film.",
    openHours: [9, 19], unlockLevel: 3,
  },
  distrib: {
    id: "distrib", name: "Reel Republic Distribution", district: "downtown", image: distribImg,
    description: "Sigarrøyk og VHS-stabler. Mr. Halloran selger filmene dine til drive-ins og kabel-TV.",
    openHours: [10, 18], unlockLevel: 3,
  },
  clinic: {
    id: "clinic", name: "Doc Lonnie's Clinic", district: "park", image: clinicImg,
    description: "Tvilsom lege, mirakuløse injeksjoner. Spør ikke.",
    openHours: [8, 22],
  },
};

export interface Action {
  id: string;
  label: string;
  emoji: string;
  hours: number;
  desc?: string;
}

// Action ids are referenced in useGame.ts
export const LOCATION_ACTIONS: Record<LocationId, Action[]> = {
  trailer: [
    { id: "sleep",   label: "Sov til morgen", emoji: "😴", hours: 0, desc: "Hopper til kl 07. Full stamina." },
    { id: "webcam",  label: "Webcam Show", emoji: "💻", hours: 2 },
    { id: "visit",   label: "Ta imot besøk", emoji: "🚪", hours: 1 },
    { id: "roster",  label: "Roster & Trening", emoji: "💋", hours: 0 },
    { id: "upgrade", label: "Oppgrader bolig", emoji: "🏚️➡️🏠", hours: 0 },
  ],
  moonshine: [
    { id: "brew",      label: "Brygg moonshine", emoji: "🔥", hours: 3, desc: "-$80, +3 flasker." },
    { id: "distillUp", label: "Oppgrader destilleri", emoji: "🛠️", hours: 0, desc: "Engangs-investering." },
  ],
  bar: [
    { id: "sellLocal", label: "Selg moonshine", emoji: "🥃", hours: 1 },
    { id: "rumor",     label: "Hør rykter", emoji: "👂", hours: 1, desc: "Tilfeldig event." },
    { id: "scoutBar",  label: "Sjekk opp en danser", emoji: "💃", hours: 2 },
    { id: "drink",     label: "Drikk en runde", emoji: "🍺", hours: 1, desc: "-$30, +rep, -stamina." },
  ],
  sheriff: [
    { id: "bribe",  label: "Bestikk Buck", emoji: "💵", hours: 1, desc: "Kostnad skalerer med heat. 3 dagers immunitet. Gjentatt bribing innen 5 dager = dyrere & mindre effekt." },
    { id: "snitch", label: "Tysteri-tips", emoji: "🤐", hours: 1, desc: "+$120, -rep." },
  ],
  gas: [
    { id: "sellTrucker", label: "Selg til trucker", emoji: "🚛", hours: 1 },
    { id: "supplies",    label: "Kjøp forsyninger", emoji: "🥫", hours: 1, desc: "-$60, +20 stamina." },
    { id: "hitchhike",   label: "Plukk opp haiker", emoji: "👠", hours: 2, desc: "Risikabelt." },
  ],
  forest: [
    { id: "scoutForest", label: "Scout en jente", emoji: "🔦", hours: 3, desc: "Billig, lav kvalitet." },
    { id: "hideStash",   label: "Gjem moonshine", emoji: "🌲", hours: 1, desc: "Reduserer razzia-tap." },
  ],
  loft: [
    { id: "glamour",  label: "Glamour Shoot", emoji: "📸", hours: 4 },
    { id: "onlyfans", label: "OnlyFans-pakke", emoji: "🔥", hours: 3 },
  ],
  velvet: [
    { id: "network", label: "Nettverk", emoji: "🤝", hours: 3, desc: "+rep, kanskje agent-ringer." },
    { id: "party",   label: "Kast fest", emoji: "🎉", hours: 4 },
    { id: "scoutVip", label: "Scout VIP-jente", emoji: "💎", hours: 3, desc: "Dyrt, høy kvalitet." },
  ],
  bank: [
    { id: "loan",  label: "Ta opp lån", emoji: "💰", hours: 2, desc: "+$5000 nå, betal $6500 om 4 uker." },
    { id: "repay", label: "Betal ned lån", emoji: "💸", hours: 1 },
  ],
  studio: [
    { id: "feature", label: "Feature Film", emoji: "🎬", hours: 6 },
    { id: "upgradeStudio", label: "Oppgrader utstyr", emoji: "🎥", hours: 0 },
  ],
  hq: [
    { id: "intl",   label: "Internasjonal Deal", emoji: "🌍", hours: 5 },
    { id: "empire", label: "Empire-møte", emoji: "👑", hours: 2, desc: "+stort rep." },
  ],
  electro: [
    { id: "buyFilm",        label: "Kjøp filmstock (5)", emoji: "📼", hours: 1, desc: "-$300, +5 ruller. Trengs i Innspilling." },
    { id: "upgradeCamera",  label: "Oppgrader kamera",   emoji: "📷", hours: 0, desc: "Bedre kvalitet & risiko." },
    { id: "upgradeLighting",label: "Oppgrader lys",      emoji: "💡", hours: 0 },
    { id: "upgradeEditing", label: "Oppgrader redigering",emoji: "🎞️", hours: 0 },
  ],
  boutique: [
    { id: "buyCostume", label: "Kjøp kostymer (3)", emoji: "👗", hours: 1, desc: "-$240, +3 kostymer. Brukes i Innspilling." },
    { id: "wardrobe",   label: "Garderobe-økt",      emoji: "💄", hours: 2, desc: "Buff jentenes pop midlertidig." },
  ],
  casting: [
    { id: "bookAudition", label: "Book audition",     emoji: "🎟️", hours: 2, desc: "-$180, +1 audition-voucher (kreves i Casting-steget)." },
    { id: "openCall",     label: "Hold open call",    emoji: "📣", hours: 4, desc: "-$500, sjanse for ny jente fra køen." },
  ],
  distrib: [
    { id: "signDeal",  label: "Signer distribusjons-deal", emoji: "🤝", hours: 2, desc: "Engangs-bonus på neste utgivelse." },
    { id: "presell",   label: "Pre-sell katalog",          emoji: "💼", hours: 2, desc: "Få cash på backlog." },
    { id: "campaignS", label: "Marketing: lokalt",         emoji: "📣", hours: 1, desc: "-$300. +20% på neste utgivelse." },
    { id: "campaignM", label: "Marketing: regional",       emoji: "📺", hours: 2, desc: "-$800. +50% på neste utgivelse." },
    { id: "campaignL", label: "Marketing: nasjonal",       emoji: "🚀", hours: 3, desc: "-$2000. +100% på neste utgivelse." },
  ],
  clinic: [
    { id: "heal",         label: "Vitamin-sprøyte",   emoji: "💉", hours: 1, desc: "-$120, full stamina." },
    { id: "detox",        label: "Detox en stjerne",   emoji: "🧴", hours: 3, desc: "-$300, fjerner cooldown på en jente." },
    { id: "enhanceLips",  label: "Lip Fillers",        emoji: "💋", hours: 2, desc: "-$600, +beauty. 2 dager restitusjon. Velg jente." },
    { id: "enhanceFit",   label: "Personal Trainer",   emoji: "🏋️", hours: 3, desc: "-$800, +performance. 3 dager restitusjon." },
    { id: "enhanceBoob",  label: "Boob Job",           emoji: "🍒", hours: 4, desc: "-$1800, +beauty solid. 5 dager restitusjon. Risiko 10%." },
    { id: "enhanceButt",  label: "Butt Lift",          emoji: "🍑", hours: 5, desc: "-$2200, +popularity. 7 dager restitusjon. Risiko 12%." },
  ],
};
