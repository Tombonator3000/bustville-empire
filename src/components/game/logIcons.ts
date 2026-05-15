import type { GameIconName } from "./GameIcon";

export type LogTone = "info" | "success" | "warning" | "danger" | "cash" | "milestone";

export function classifyLogEvent(message: string): {
  icon: GameIconName;
  tone: LogTone;
  important: boolean;
} {
  const m = message.toLowerCase();
  const isMilestone = /(first hit|milestone|unlock|låst opp|achievement)/i.test(message);
  if (isMilestone) return { icon: "milestone", tone: "milestone", important: true };

  if (/(recruit|hired|ansatt|ny lead|casting board|new local lead)/i.test(message))
    return { icon: "newRecruit", tone: "success", important: true };

  if (/(heat|sheriff|risk|inspeksjon|raid|busted)/i.test(message))
    return { icon: "heat", tone: "danger", important: true };

  if (/(weekly|ukentlig|summary|oppsummering)/i.test(message))
    return { icon: "weeklySummary", tone: "info", important: true };

  if (/(sliten|cooldown|hvile|utbrent|burnout|tired)/i.test(message))
    return { icon: "tired", tone: "warning", important: false };

  if (m.includes("$") || /(cash|earned|inntekt|bonus|tjente|paid|kostet|cost)/i.test(message)) {
    const negative = /(lost|kostet|cost|tap|paid|-\$)/i.test(message);
    return {
      icon: negative ? "cashLoss" : "cashGain",
      tone: "cash",
      important: false,
    };
  }

  if (/(advarsel|warning|advarte)/i.test(message))
    return { icon: "warning", tone: "warning", important: false };

  return { icon: "info", tone: "info", important: false };
}

export const LOG_TONE_CLASS: Record<LogTone, string> = {
  info: "text-muted-foreground",
  success: "text-emerald-300",
  warning: "text-yellow-300",
  danger: "text-red-300",
  cash: "text-emerald-300",
  milestone: "text-primary",
};
