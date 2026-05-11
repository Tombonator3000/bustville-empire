# Bustville Empire → Lula-style Simulation Overhaul

Akkurat nå er spillet ett dashboard med knapper. Lula: The Sexy Empire fungerer som en **klikkbar by-kartsimulering**: du beveger deg mellom lokasjoner (motel, bar, politi, videobutikk, studio), hver lokasjon har sine egne handlinger og NPCer, og økonomien drives av kjøp/salg, kontrakter og tid som går. Vi bygger om Bustville til samme modell.

## Ny spillstruktur

### 1. Bykart (Trailer Park View)
Erstatt nåværende dashboard med et **klikkbart isometrisk kart** av trailer-parken (Phase 1). Hver bygning er en knapp med ikon + hover-state. Lokasjoner:

```
[Din Trailer]  [Moonshine-skjul]  [Sheriff Buck's kontor]
[Bar "Dirty Dan's"]  [Bensinstasjon]  [Cherry's trailer]
[Skogen (scouting)]  [Veien ut → Phase 2: Downtown]
```

Topp-HUD beholdes: $cash, rep, stamina, dag/klokke, level.

### 2. Lokasjons-visning
Klikk på bygning → full-screen bilde + handlingspanel (som Lula's motel/kontor-scener). Hver lokasjon har:
- Bakgrunnsbilde (vi har allerede loc-trailer, loc-apartment osv. — genererer 4-5 nye for byggninger)
- 2-4 handlinger spesifikke for stedet
- NPC som dukker opp (sheriff, kunder, jenter)
- "Tilbake til kart"-knapp

**Lokasjoner Phase 1:**
- **Din Trailer** – Sov (regen stamina), Webcam Show, Ta imot besøk, Se på roster
- **Moonshine-skjul** – Brygg, Lager (vis flasker), oppgrader destilleri
- **Bar "Dirty Dan's"** – Selg moonshine (random pris), Rekrutter dansere, Hør rykter (events)
- **Bensinstasjon** – Selg moonshine til truckere, kjøp forsyninger ($ for stamina-drikker)
- **Sheriff's kontor** – Betal bestikkelse (reduserer razzia-risiko), eller risiker razzia
- **Skogen** – Scout nye jenter (billigere men lavere kvalitet enn senere)
- **Cherry's trailer** – Nabo som gir oppdrag/tips (event-trigger)

**Lokasjoner Phase 2 (Downtown - låst opp på Level 3):**
- **Loft Studio** – Glamour shoots, OnlyFans
- **Talent Agency** – Scout premium-jenter
- **Klubb "Velvet"** – Nettverk, fest, rep-gain
- **Bank** – Lån (Level 3+)
- **Pro Studio / HQ** – Feature films, internasjonale deals

### 3. Tidssystem (Lula-style)
Lula bruker en klokke som tikker per handling. Vi gjør samme:
- Hver handling koster **timer** (ikke bare stamina). 1 dag = 16 vakne timer.
- "Sov" hopper til morgenen, regen stamina.
- Visse handlinger kun tilgjengelig på visse tider (Bar åpen kveld, Bank åpen dag).
- 7 dager = uke = lønn/royalties (eksisterende endWeek-logikk).

### 4. NPCer og dialog
Enkle modal-dialoger når man interagerer (1-3 valg). Eksempel sheriff:
> "Buck: 'Hørt du brygger igjen, gutt. $200 så glemmer jeg det.'"
> [Betal $200] [Avslå – risiko] [Lyv (Charisma-sjekk)]

Charisma/Business/Hustle-stats påvirker sjekker.

### 5. Roster og Stjerner
Beholdes, men flyttes til en egen "Roster"-knapp i HUD (modal/sheet). Trene/sparke/gave fungerer som før.

## Filendringer

**Nye filer:**
- `src/game/locations.ts` – lokasjonsdata, handlinger per sted, åpningstider
- `src/game/npcs.ts` – NPC-dialoger og sjekker
- `src/components/game/MapView.tsx` – klikkbart kart
- `src/components/game/LocationView.tsx` – fullscreen lokasjons-scene
- `src/components/game/HUD.tsx` – topp-bar (cash/rep/tid/stamina)
- `src/components/game/RosterSheet.tsx` – roster i Sheet
- `src/components/game/DialogModal.tsx` – NPC-dialoger
- 4-5 nye genererte bilder: `loc-bar.jpg`, `loc-sheriff.jpg`, `loc-gasstation.jpg`, `loc-moonshine.jpg`, `loc-forest.jpg`, `map-trailerpark.jpg` (isometrisk kart-bakgrunn)

**Endrede filer:**
- `src/game/useGame.ts` – legg til `currentLocation`, `hour`, `advanceTime()`, lokasjons-spesifikke handlinger
- `src/game/data.ts` – beholdt, content types blir trigget fra lokasjoner
- `src/routes/index.tsx` – orchestrerer Map↔Location-view-switching

## Tekniske detaljer

- State: `view: "map" | "location"`, `activeLocation: string | null`, `hour: number (0-23)`, `dayOfWeek`.
- Kart implementeres som ett bakgrunnsbilde + absolute-positionerte `<button>` med `clip-path` for hot-spots, hver med hover glow.
- Lokasjons-view: bakgrunnsbilde fyller skjerm, handlings-panel som "kort" nederst (mobil) eller høyre (desktop).
- Random events fyres fortsatt ved `endWeek`, men også som lokasjons-trigger (sheriff dukker opp 15% sjanse i bar).
- localStorage migration: ny versjonsnøkkel `bustville-empire-v2` så gamle saves resettes pent.

Resultat: spillet føles som en faktisk by du beveger deg i, ikke et regneark. Sterk Lula-arv, men med vår neon-Bustville-stil.