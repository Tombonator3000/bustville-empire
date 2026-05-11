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
import mapTrailer from "@/assets/map-trailerpark.jpg";
import mapDowntown from "@/assets/map-downtown.jpg";

export type LocationId =
  | "trailer" | "moonshine" | "bar" | "sheriff" | "gas" | "forest"
  | "loft" | "velvet" | "bank" | "studio" | "hq";

export type DistrictId = "park" | "downtown";

export interface District {
  id: DistrictId;
  name: string;
  image: string;
  unlockLevel: number;
  tagline: string;
}

export const DISTRICTS: District[] = [
  { id: "park", name: "Bustville Trailer Park", image: mapTrailer, unlockLevel: 1,
    tagline: "Rust, røyk og rå muligheter." },
  { id: "downtown", name: "Downtown Bustville", image: mapDowntown, unlockLevel: 3,
    tagline: "Neon, kontrakter og kokain på regnskapsføreren." },
];

export interface MapHotspot {
  id: LocationId;
  // % positions on the district map (0-100)
  x: number; y: number; w: number; h: number;
  label: string;
}

export const HOTSPOTS: Record<DistrictId, MapHotspot[]> = {
  park: [
    { id: "trailer",   x: 6,  y: 38, w: 26, h: 30, label: "Din Trailer" },
    { id: "moonshine", x: 32, y: 60, w: 22, h: 32, label: "Moonshine-skjul" },
    { id: "bar",       x: 38, y: 12, w: 26, h: 28, label: "Dirty Dan's" },
    { id: "sheriff",   x: 40, y: 50, w: 22, h: 22, label: "Sheriff Buck" },
    { id: "gas",       x: 68, y: 60, w: 28, h: 32, label: "Bensinstasjon" },
    { id: "forest",    x: 70, y: 8,  w: 28, h: 30, label: "Skogen" },
  ],
  downtown: [
    { id: "loft",   x: 6,  y: 20, w: 24, h: 36, label: "Loft Studio" },
    { id: "velvet", x: 32, y: 32, w: 28, h: 36, label: "Klubb Velvet" },
    { id: "bank",   x: 62, y: 50, w: 22, h: 30, label: "Bustville Bank" },
    { id: "studio", x: 8,  y: 62, w: 24, h: 32, label: "Pro Studio" },
    { id: "hq",     x: 70, y: 12, w: 26, h: 32, label: "Empire HQ" },
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
    { id: "bribe",  label: "Bestikk Buck", emoji: "💵", hours: 1, desc: "-$200, -razzia-risiko." },
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
};
