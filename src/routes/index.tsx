import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/useGame";
import { DISTRICTS } from "@/game/locations";
import { ProductionsSheet } from "@/components/game/ProductionsSheet";
import { OptionsMenu } from "@/components/game/OptionsMenu";
import { InventorySheet } from "@/components/game/InventorySheet";
import { GallerySheet } from "@/components/game/GallerySheet";
import { WebcamModal } from "@/components/game/WebcamModal";
import { VisitModal } from "@/components/game/VisitModal";
import { ClinicSheet } from "@/components/game/ClinicSheet";
import { HUD } from "@/components/game/HUD";
import { MapView } from "@/components/game/MapView";
import { LocationView } from "@/components/game/LocationView";
import { RosterSheet } from "@/components/game/RosterSheet";
import { StatsSheet } from "@/components/game/StatsSheet";
import { StaffPanel } from "@/components/game/StaffPanel";
import { Splash, WinScreen } from "@/components/game/Splash";
import { ProgressionSheet } from "@/components/game/ProgressionSheet";
import { RecruitRevealModal } from "@/components/game/RecruitRevealModal";
import { CastingBoardPanel } from "@/components/game/CastingBoardPanel";

const STARTED_FLAG_KEY = "bustville-started";

export const Route = createFileRoute("/")({
  component: GamePage,
  head: () => ({
    meta: [
      { title: "Bustville Empire — Lula-style Tycoon Sim" },
      {
        name: "description",
        content:
          "Klikkbar tycoon-simulator: bygg et erotikk-imperium fra en rusten trailer i Bustville, Alabama.",
      },
    ],
  }),
});

function GamePage() {
  const g = useGame();
  const [started, setStarted] = useState(true);
  const [selectedGirl, setSelectedGirl] = useState<string | undefined>();
  const [rosterOpen, setRosterOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffMode, setStaffMode] = useState<"overview" | "helpWanted">("overview");
  const [castingOpen, setCastingOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const initializedStartedRef = useRef(false);

  useEffect(() => {
    if (!g.loaded || typeof window === "undefined" || initializedStartedRef.current) return;

    const hasStartedFlag = window.localStorage.getItem(STARTED_FLAG_KEY) === "true";
    const isFreshState = g.state.day === 1 && g.state.hour === 8 && g.state.girls.length === 0;

    setStarted(hasStartedFlag || !isFreshState);
    initializedStartedRef.current = true;
  }, [g.loaded, g.state.day, g.state.girls.length, g.state.hour]);

  if (!g.loaded) return <div className="min-h-screen" />;

  if (!started && g.state.day === 1 && g.state.girls.length === 0 && g.state.hour === 8) {
    return (
      <Splash
        onStart={() => {
          setStarted(true);
          window.localStorage.setItem(STARTED_FLAG_KEY, "true");
        }}
        onReset={() => {
          g.reset();
          setStarted(false);
          window.localStorage.removeItem(STARTED_FLAG_KEY);
        }}
      />
    );
  }
  if (g.state.won) {
    return (
      <WinScreen
        onReset={() => {
          g.reset();
          setStarted(false);
          window.localStorage.removeItem(STARTED_FLAG_KEY);
        }}
      />
    );
  }

  const district = DISTRICTS.find((d) => d.id === g.state.district)!;
  const activeLoc = g.state.activeLocation;
  const recruitRevealGirl = g.state.lastRecruitId
    ? (g.state.girls.find((x) => x.id === g.state.lastRecruitId) ?? null)
    : null;

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-background">
      <HUD
        state={g.state}
        onOpenRoster={() => setRosterOpen(true)}
        onOpenStaff={() => {
          setStaffMode("overview");
          setStaffOpen(true);
        }}
        onOpenInventory={() => setInvOpen(true)}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
        onAdvanceTime={g.advanceTime}
        onEndDay={g.endDay}
        onOpenProgression={() => setProgressionOpen(true)}
      />

      <div className="relative flex-1 min-h-0 overflow-hidden">
        {activeLoc ? (
          <LocationView
            state={g.state}
            locId={activeLoc}
            selectedGirl={selectedGirl}
            onBack={g.backToMap}
            onPerform={(id, girlId, intensity) => {
              if (activeLoc === "trailer" && id === "webcam") {
                setWebcamOpen(true);
                return;
              }
              if (activeLoc === "trailer" && id === "visit") {
                setVisitOpen(true);
                return;
              }
              g.perform(activeLoc, id, girlId ?? selectedGirl, intensity);
            }}
            onOpenRoster={() => setRosterOpen(true)}
            onOpenProductions={() => setProdOpen(true)}
            onOpenCastingBoard={() => setCastingOpen(true)}
            onOpenHelpWanted={() => {
              setStaffMode("helpWanted");
              setStaffOpen(true);
            }}
          />
        ) : (
          <MapView
            state={g.state}
            district={district}
            onGoTo={g.goTo}
            onSwitchDistrict={g.switchDistrict}
          />
        )}
      </div>

      {progressionOpen && (
        <ProgressionSheet state={g.state} onClose={() => setProgressionOpen(false)} />
      )}

      {rosterOpen && (
        <RosterSheet
          state={g.state}
          selected={selectedGirl}
          onClose={() => setRosterOpen(false)}
          onSelect={(id) => setSelectedGirl(id === selectedGirl ? undefined : id)}
          onFire={g.fireGirl}
          onTrain={g.trainGirl}
          onGift={g.giftGirl}
          onResign={g.resignGirl}
          onStartMission={g.startMission}
          onCancelMission={g.cancelMission}
        />
      )}
      {statsOpen && (
        <StatsSheet state={g.state} onClose={() => setStatsOpen(false)} onUpgrade={g.upgradeStat} />
      )}
      {staffOpen && (
        <StaffPanel
          state={g.state}
          onClose={() => setStaffOpen(false)}
          onHire={g.hireStaff}
          onUpgrade={g.upgradeStaff}
          mode={staffMode}
        />
      )}
      {castingOpen && (
        <CastingBoardPanel
          leads={g.state.castingLeads}
          onClose={() => setCastingOpen(false)}
          onScout={g.scoutLocalTalent}
          onHire={g.hireCastingLead}
          onPass={g.rejectCastingLead}
        />
      )}
      {prodOpen && (
        <ProductionsSheet
          state={g.state}
          onClose={() => setProdOpen(false)}
          onStart={g.startProduction}
          onAdvance={g.advanceProduction}
          onAssign={g.assignToProduction}
          onSetRole={g.setCastRole}
          onCancel={g.cancelProduction}
          onUpgradeEquipment={g.upgradeEquipment}
          onAssignDeal={g.assignDistributionDeal}
        />
      )}
      {invOpen && <InventorySheet state={g.state} onClose={() => setInvOpen(false)} />}
      {galleryOpen && <GallerySheet girls={g.state.girls} onClose={() => setGalleryOpen(false)} />}
      {clinicOpen && (
        <ClinicSheet state={g.state} onClose={() => setClinicOpen(false)} onPerform={g.perform} />
      )}
      {webcamOpen && (
        <WebcamModal
          state={g.state}
          onClose={() => setWebcamOpen(false)}
          onRun={(showId, girlId, intensity) => g.webcamShow(showId, girlId, intensity)}
          onUpgrade={g.upgradeWebcamLevel}
        />
      )}
      {visitOpen && (
        <VisitModal
          state={g.state}
          onClose={() => setVisitOpen(false)}
          onRun={(visitId, girlId, intensity) => g.acceptVisit(visitId, girlId, intensity)}
          onUpgrade={g.upgradeTrailerLevel}
        />
      )}
      {recruitRevealGirl && (
        <RecruitRevealModal girl={recruitRevealGirl} onClose={g.clearRecruitReveal} />
      )}

      {optionsOpen && (
        <OptionsMenu
          onClose={() => setOptionsOpen(false)}
          onSave={g.saveToSlot}
          onLoad={g.loadFromSlot}
          onDelete={g.deleteSlot}
          onExport={g.exportSave}
          onImport={g.importSave}
          onReset={() => {
            g.reset();
            setStarted(false);
            window.localStorage.removeItem(STARTED_FLAG_KEY);
          }}
        />
      )}
    </main>
  );
}
