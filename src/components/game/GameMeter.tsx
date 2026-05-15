import type { ReactNode } from "react";

export type MeterTone =
  | "stamina"
  | "heat"
  | "rep"
  | "progress"
  | "health"
  | "danger"
  | "neutral";

const FILL: Record<MeterTone, string> = {
  stamina: "bg-cyan-400",
  heat: "bg-orange-500",
  rep: "bg-amber-300",
  progress: "bg-primary",
  health: "bg-emerald-400",
  danger: "bg-red-500",
  neutral: "bg-foreground/60",
};

const SIZES = {
  tiny: "h-1",
  small: "h-1.5",
  normal: "h-2",
} as const;

export function GameMeter({
  value,
  max,
  tone = "neutral",
  size = "small",
  label,
  showText = false,
  className = "",
}: {
  value: number;
  max: number;
  tone?: MeterTone;
  size?: keyof typeof SIZES;
  label?: string;
  showText?: boolean;
  className?: string;
}) {
  const safeMax = max <= 0 ? 1 : max;
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{label}</span>
          {showText && (
            <span>
              {Math.round(value)}/{Math.round(max)}
            </span>
          )}
        </div>
      )}
      <div
        className={`relative w-full overflow-hidden rounded-full bg-background/60 border border-border/50 ${SIZES[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full ${FILL[tone]} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatPill({
  icon,
  label,
  value,
  max,
  meter,
  tone = "neutral",
  title,
  onClick,
}: {
  icon?: ReactNode;
  label?: string;
  value: ReactNode;
  max?: number;
  meter?: boolean;
  tone?: MeterTone;
  title?: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : ("div" as const);
  return (
    <Wrapper
      onClick={onClick}
      title={title}
      aria-label={title ?? label}
      className={`flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 px-2 py-1 font-mono text-xs ${
        onClick ? "hover:border-primary transition-colors cursor-pointer" : ""
      }`}
    >
      {icon}
      <span className="font-bold leading-none">{value}</span>
      {meter && typeof max === "number" && typeof value === "number" && (
        <div className="w-10">
          <GameMeter value={value as number} max={max} tone={tone} size="tiny" />
        </div>
      )}
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </Wrapper>
  );
}

export function SegmentedProgress({
  segments,
  compact = false,
}: {
  segments: Array<{ label: string; complete?: boolean; current?: boolean; icon?: ReactNode }>;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-stretch gap-1 ${compact ? "" : "w-full"}`}>
      {segments.map((s, i) => (
        <div
          key={i}
          className={`flex-1 rounded-md border px-2 py-1 text-[10px] flex items-center gap-1.5 ${
            s.complete
              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
              : s.current
                ? "border-primary/70 bg-primary/15 text-primary"
                : "border-border/60 bg-background/40 text-muted-foreground"
          }`}
          title={s.label}
        >
          {s.icon}
          {!compact && <span className="font-semibold uppercase tracking-wide">{s.label}</span>}
        </div>
      ))}
    </div>
  );
}

export function CooldownMeter({ remaining, total }: { remaining: number; total: number }) {
  return <GameMeter value={Math.max(0, total - remaining)} max={total} tone="progress" size="tiny" />;
}
