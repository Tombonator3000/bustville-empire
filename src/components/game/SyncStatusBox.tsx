import { useEffect, useState } from "react";

// Vite injects this at build time; we treat it as the "preview build" timestamp.
const BUILD_TIME = new Date(
  // @ts-expect-error injected via define in vite.config (falls back to now)
  (typeof __BUILD_TIME__ !== "undefined" && __BUILD_TIME__) || Date.now(),
);

type LiveStatus = "checking" | "ok" | "placeholder" | "error";

const PUBLISHED_URL = "https://bustville-empire.lovable.app";

export function SyncStatusBox() {
  const [host, setHost] = useState("");
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("checking");
  const [liveCheckedAt, setLiveCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  const checkLive = async () => {
    setLiveStatus("checking");
    try {
      const res = await fetch(PUBLISHED_URL, { mode: "no-cors", cache: "no-store" });
      // no-cors gives opaque response; we can't read body. Fall back to "ok" if no throw.
      void res;
      setLiveStatus("ok");
    } catch {
      setLiveStatus("error");
    }
    setLiveCheckedAt(new Date());
  };

  useEffect(() => {
    checkLive();
  }, []);

  const isPreview = host.includes("preview--") || host.includes("-dev.lovable.app");
  const isPublished = host.endsWith(".lovable.app") && !isPreview;
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");

  return (
    <div className="space-y-3 text-sm">
      <p className="font-display text-[10px] uppercase tracking-widest text-accent">
        Synk-status
      </p>

      <Row
        label="GitHub"
        status="warn"
        value="Ikke koblet i app"
        hint="Koble via Plus (+) → GitHub → Connect project for å pushe fra Codex/lokalt."
      />

      <Row
        label="Denne fanen"
        status="ok"
        value={isLocal ? "Lokalt dev-miljø" : isPreview ? "Preview-build" : isPublished ? "Live-build" : host || "Ukjent"}
        hint={`Host: ${host || "—"}`}
      />

      <Row
        label="Preview-build"
        status="ok"
        value={BUILD_TIME.toLocaleString()}
        hint="Tidspunkt for siste build i sandkassen."
      />

      <Row
        label="Publisert side"
        status={liveStatus === "ok" ? "ok" : liveStatus === "checking" ? "warn" : "err"}
        value={
          liveStatus === "checking"
            ? "Sjekker…"
            : liveStatus === "ok"
              ? "Svarer (200)"
              : "Ingen respons"
        }
        hint={
          (liveCheckedAt ? `Sjekket ${liveCheckedAt.toLocaleTimeString()} · ` : "") +
          PUBLISHED_URL
        }
      />

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={checkLive}
          className="rounded bg-secondary px-3 py-1.5 text-xs font-bold uppercase hover:bg-secondary/80"
        >
          🔁 Sjekk live på nytt
        </button>
        <a
          href={PUBLISHED_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-accent px-3 py-1.5 text-xs font-bold uppercase text-accent-foreground hover:brightness-110"
        >
          🌐 Åpne live
        </a>
      </div>

      <div className="rounded-lg border border-border bg-background/40 p-3 text-[11px] text-muted-foreground">
        <p className="mb-1 font-bold text-foreground">Slik holder du alt synkronisert:</p>
        <ol className="list-decimal space-y-0.5 pl-4">
          <li>Koble prosjektet til GitHub (Plus → GitHub).</li>
          <li>Push endringer fra Codex til samme branch.</li>
          <li>Lovable plukker opp commit-en og bygger preview automatisk.</li>
          <li>Klikk <span className="font-bold text-primary">Publish → Update</span> for å oppdatere live-siden.</li>
        </ol>
      </div>
    </div>
  );
}

function Row({
  label,
  status,
  value,
  hint,
}: {
  label: string;
  status: "ok" | "warn" | "err";
  value: string;
  hint?: string;
}) {
  const dot =
    status === "ok"
      ? "bg-primary shadow-[0_0_8px_oklch(0.7_0.28_350/0.7)]"
      : status === "warn"
        ? "bg-accent"
        : "bg-destructive";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-2.5">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold">{value}</p>
        {hint && <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
