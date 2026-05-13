import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const [prodOpen, setProdOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);

  if (!g.loaded) return <div className="min-h-screen" />;

  if (!started && g.state.day === 1 && g.state.girls.length === 0 && g.state.hour === 8) {
    return <Splash onStart={() => setStarted(true)} onReset={g.reset} />;
  }
  if (g.state.won) {
    return (
      <WinScreen
        onReset={() => {
          g.reset();
          setStarted(false);
        }}
      />
    );
  }

  const district = DISTRICTS.find((d) => d.id === g.state.district)!;
  const activeLoc = g.state.activeLocation;

  return (
    <main className="relative min-h-screen w-full">
      <HUD
        state={g.state}
        onOpenRoster={() => setRosterOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenStaff={() => setStaffOpen(true)}
        onOpenProductions={() => setProdOpen(true)}
        onOpenInventory={() => setInvOpen(true)}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenClinic={() => setClinicOpen(true)}
        onOpenOptions={() => setOptionsOpen(true)}
        onSwitch={g.switchDistrict}
        onAdvanceTime={g.advanceTime}
        onEndDay={g.endDay}
      />

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
        />
      ) : (
        <MapView
          state={g.state}
          district={district}
          onGoTo={g.goTo}
          onSwitchDistrict={g.switchDistrict}
        />
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
        <StaffPanel state={g.state} onClose={() => setStaffOpen(false)} onHire={g.hireStaff} onUpgrade={g.upgradeStaff} />
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
          }}
        />
      )}

      <footer className="mx-auto mt-4 max-w-7xl px-3 pb-3 text-center text-[10px] text-muted-foreground">
        <button
          onClick={() => {
            if (confirm("Slett all progresjon?")) {
              g.reset();
              setStarted(false);
            }
          }}
          className="underline hover:text-primary"
        >
          Reset
        </button>
        <span className="mx-2">·</span>
        Bustville Empire — A Lula-style satire.
      </footer>
    </main>
  );
}
