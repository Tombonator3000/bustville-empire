# Modularitet — status og refaktor-plan

## Kort svar
Spillet er **delvis modulært**. Domene-laget (`src/game/*`) er allerede pent splittet i tema-filer (data, locations, productions, genres, rivals, clinic, drama, health). **To filer er imidlertid blitt for store** og er den reelle smerten hvis du vil bytte ut deler:

| Fil | Linjer | Problem |
|---|---|---|
| `src/game/useGame.ts` | **1530** | Én monolittisk hook med all spill-logikk (tid, navigasjon, actions, produksjoner, missions, webcam, visits, helse, utstyr). Endrer du én feature må du scrolle gjennom alt. |
| `src/routes/index.tsx` | **965** | Inneholder 13 komponenter (HUD, MapView, LocationView, ActionRow, RosterSheet, GirlCard, StatsSheet, Splash, WinScreen, Pill, IconBtn osv.) i én rute-fil. |

Resten (`data.ts`, `locations.ts`, `productions.ts`, `clinic.ts`, `drama.ts`, `genres.ts`, `health.ts`, `rivals.ts`, samt `WebcamModal`, `VisitModal`, `GallerySheet`, `ClinicSheet`, `InventorySheet`, `ProductionsSheet`, `HotspotEditor`, `OptionsMenu`) er allerede i egne moduler på 100–330 linjer — det er sunt.

**Ja, det bør refaktoreres**, men det kan gjøres trygt og i etapper uten å endre spill-oppførsel.

---

## Foreslått refaktor (3 etapper)

### Etappe 1 — Splitt `routes/index.tsx` (raskest gevinst, lav risiko)

Flytt komponenter til egne filer. Rute-filen blir kun "skjelett" som komponerer dem:

```text
src/components/game/
├── HUD.tsx              ← HUD + IconBtn + Pill  (~120 linjer)
├── MapView.tsx          ← MapView                (~200 linjer)
├── LocationView.tsx     ← LocationView + ActionRow (~250 linjer)
├── RosterSheet.tsx      ← RosterSheet + GirlCard + Stat (~180 linjer)
├── StatsSheet.tsx       ← StatsSheet            (~70 linjer)
└── Splash.tsx           ← Splash + WinScreen     (~50 linjer)
```

Etter dette er `routes/index.tsx` ~120 linjer (kun `GamePage` + state-vriding + modal-toggles).

### Etappe 2 — Splitt `useGame.ts` etter domene

Behold `useGame.ts` som **orkestrator** som setter sammen mindre hooks/moduler. Pure helpers flyttes til egne filer; setState-callbacks samles i feature-hooks:

```text
src/game/
├── state.ts             ← GameState type, INITIAL, log(), absHour(), persist
├── time.ts              ← advance(), weekTick(), rollEncounter() (rene funksjoner)
├── recruiting.ts        ← rollRecruit(), contractTerms() (allerede halvveis)
├── studio.ts            ← getStudioMods, stageCost, stageHours, EQUIPMENT_*
├── hooks/
│   ├── useNavigation.ts ← goTo, backToMap, switchDistrict
│   ├── useActions.ts    ← perform + doAction (den store)
│   ├── useGirls.ts      ← fire/train/gift/resign/upgradeStat
│   ├── useProductions.ts← start/advance/assign/setRole/cancel/archive
│   ├── useMissions.ts   ← startMission/cancelMission
│   ├── useWebcam.ts     ← webcamShow + upgradeWebcamLevel
│   ├── useVisits.ts     ← acceptVisit + upgradeTrailerLevel
│   └── useSaves.ts      ← saveToSlot/loadFromSlot/delete/export/import
└── useGame.ts           ← komponerer alt + eier setState  (~150 linjer)
```

Mønster: hver feature-hook tar `setState` (eller en `dispatch`) som argument og returnerer sine callbacks. Da kan du **bytte ut webcam-logikken** ved å redigere `useWebcam.ts` alene — uten å åpne hovedfilen.

### Etappe 3 (valgfritt) — Reducer-mønster

Hvis du vil gå hele veien: bytt setState-spagetti med `useReducer` + actions. Hver feature-fil eksporterer rene `(state, action) => state`-reducere som komponeres. Bedre testbarhet og enklere å skrive om enkeltdeler. Gjør **kun** hvis du vil teste enheter eller dele logikk med f.eks. en server-versjon — ellers er etappe 2 nok.

---

## Anbefaling

- **Gjør etappe 1 først** (1 melding, ~30 min): index.tsx blir håndterbar med én gang.
- **Gjør etappe 2 etterpå** (1–2 meldinger): krever litt mer testing men gjør det trygt å skifte ut features som webcam, visits, produksjoner uavhengig.
- **Hopp over etappe 3** med mindre du planlegger enhetstesting eller multiplayer.

Ingen oppførsel i spillet endres — det er kun filer som flyttes og imports som oppdateres. Save-format (`bustville-empire-v2`) forblir likt.

Si fra hvilken etappe du vil starte med, så kjører jeg.
