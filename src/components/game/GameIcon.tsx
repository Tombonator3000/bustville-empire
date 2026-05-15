import {
  DollarSign,
  Star,
  Zap,
  Flame,
  Clock,
  Calendar,
  Users,
  ClipboardList,
  Package,
  Image as ImageIcon,
  Film,
  Settings,
  Bed,
  Moon,
  Video,
  DoorOpen,
  Clapperboard,
  Dumbbell,
  StickyNote,
  Megaphone,
  Wrench,
  ShoppingBag,
  ShieldCheck,
  Search,
  EyeOff,
  Shovel,
  Stethoscope,
  HeartPulse,
  Wine,
  MessageCircle,
  Spotlight,
  FlaskConical,
  Lightbulb,
  Scissors,
  Upload,
  Trophy,
  Ticket,
  CheckCircle2,
  Hourglass,
  Bandage,
  Timer,
  Smile,
  Heart,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
  Plus,
  Info,
  Siren,
  TrendingUp,
  TrendingDown,
  FileText,
  Gauge,
  Camera,
  Snowflake,
  HandCoins,
  Eye,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

export type GameIconName =
  // HUD
  | "cash"
  | "rep"
  | "stamina"
  | "heat"
  | "time"
  | "calendar"
  | "roster"
  | "staff"
  | "inventory"
  | "gallery"
  | "film"
  | "progress"
  | "settings"
  // Trailer / home
  | "sleep"
  | "webcam"
  | "visit"
  | "quickie"
  | "training"
  | "castingBoard"
  | "helpWanted"
  | "upgradeHome"
  // Gas station / support
  | "supplies"
  | "safetyStock"
  | "flyer"
  | "oddJob"
  | "rumor"
  // Forest / utility
  | "layLow"
  | "hideStash"
  | "searchEquipment"
  | "weirdRumor"
  // Sheriff / risk
  | "bribe"
  | "investigation"
  | "immunity"
  // Clinic
  | "recover"
  | "healthCheck"
  // Dirty Dan / nightlife
  | "drink"
  | "socialize"
  | "scoutDancer"
  | "moonshine"
  // Production pipeline
  | "idea"
  | "casting"
  | "shoot"
  | "edit"
  | "release"
  | "distribution"
  | "firstHit"
  | "auditionVoucher"
  // Status
  | "available"
  | "busy"
  | "tired"
  | "injured"
  | "cooldown"
  | "mood"
  | "loyalty"
  // Badges
  | "locked"
  | "requiresStar"
  | "requiresItem"
  | "risk"
  | "reward"
  | "unlocksContent"
  | "leadAdded"
  | "heatReduction"
  // Log
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "cashGain"
  | "cashLoss"
  | "newRecruit"
  | "newLead"
  | "weeklySummary"
  | "milestone";

const ICONS: Record<GameIconName, LucideIcon> = {
  cash: DollarSign,
  rep: Star,
  stamina: Zap,
  heat: Flame,
  time: Clock,
  calendar: Calendar,
  roster: Users,
  staff: ClipboardList,
  inventory: Package,
  gallery: ImageIcon,
  film: Film,
  progress: ArrowUpRight,
  settings: Settings,
  sleep: Bed,
  webcam: Video,
  visit: DoorOpen,
  quickie: Clapperboard,
  training: Dumbbell,
  castingBoard: StickyNote,
  helpWanted: ClipboardList,
  upgradeHome: Wrench,
  supplies: ShoppingBag,
  safetyStock: ShieldCheck,
  flyer: StickyNote,
  oddJob: HandCoins,
  rumor: MessageCircle,
  layLow: EyeOff,
  hideStash: Shovel,
  searchEquipment: Search,
  weirdRumor: Moon,
  bribe: HandCoins,
  investigation: Eye,
  immunity: ShieldCheck,
  recover: HeartPulse,
  healthCheck: Stethoscope,
  drink: Wine,
  socialize: MessageCircle,
  scoutDancer: Spotlight,
  moonshine: FlaskConical,
  idea: Lightbulb,
  casting: ClipboardList,
  shoot: Camera,
  edit: Scissors,
  release: Upload,
  distribution: Megaphone,
  firstHit: Trophy,
  auditionVoucher: Ticket,
  available: CheckCircle2,
  busy: Hourglass,
  tired: Moon,
  injured: Bandage,
  cooldown: Timer,
  mood: Smile,
  loyalty: Heart,
  locked: Lock,
  requiresStar: Star,
  requiresItem: Package,
  risk: AlertTriangle,
  reward: Sparkles,
  unlocksContent: Unlock,
  leadAdded: Plus,
  heatReduction: Snowflake,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: Siren,
  cashGain: TrendingUp,
  cashLoss: TrendingDown,
  newRecruit: Users,
  newLead: StickyNote,
  weeklySummary: FileText,
  milestone: Trophy,
};

export type IconTone =
  | "cash"
  | "rep"
  | "stamina"
  | "heat"
  | "danger"
  | "warning"
  | "success"
  | "neutral"
  | "purple";

const TONE_CLASS: Record<IconTone, string> = {
  cash: "text-emerald-400",
  rep: "text-amber-300",
  stamina: "text-cyan-300",
  heat: "text-orange-400",
  danger: "text-red-400",
  warning: "text-yellow-300",
  success: "text-emerald-400",
  neutral: "text-foreground/80",
  purple: "text-primary",
};

export function GameIcon({
  name,
  size = 14,
  tone,
  className = "",
  title,
}: {
  name: GameIconName;
  size?: number;
  tone?: IconTone;
  className?: string;
  title?: string;
}) {
  const Cmp = ICONS[name] ?? Info;
  const toneClass = tone ? TONE_CLASS[tone] : "";
  return (
    <Cmp
      size={size}
      className={`${toneClass} ${className}`.trim()}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
    </Cmp>
  );
}

export const Gauge_ = Gauge; // re-export for convenience if needed
