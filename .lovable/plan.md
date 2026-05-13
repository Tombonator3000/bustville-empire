# GUI-logikk for film + gameplay-gjennomgang

## 1) Er det logisk at "Filmer" ligger i HUD-en øverst?

Kort svar: **Nei, ikke helt.** Men premissen er litt feil — film-produksjon er teknisk åpen fra Lv 1, ikke Lv 3.

### Hva koden faktisk sier (`src/game/productions.ts`)
- `quickie` — `minLevel: 1`  ← åpen fra start (i trailer)
- `glamour` — `minLevel: 3`
- `feature` — `minLevel: 4`
- `blockbuster` — `minLevel: 5`

Så Lv 3 er når den **store** filmproduksjonen (Glamour Feature) åpner. Quickies er ment som "drittfilm i trailer'n" fra dag 1. Det er derfor knappen ikke er låst.

### Hvorfor det føles ulogisk i HUD
Filmer er ikke en handling man "gjør" fra hovedmenyen — det er en flerstegs-pipeline (briefing → casting → shooting → editing → release) som tematisk hører hjemme på et **sted** (trailer for quickie, Loft for glamour, Pro Studio for feature/blockbuster). Å ha den i den globale top-bar siden av Roster/Boss/Lager blander to lag:
- HUD = globale meta-handlinger (roster, lager, boss, klinikk, options)
- Lokasjons-handlinger = hva du faktisk gjør på stedet

### Foreslått endring (presentation only)

**A. Flytt "Filmer" ut av HUD-rad 2.**
I stedet legg den inn som en **action på relevante locations**:
- `trailer` (Lv 1+) → "🎬 Lag quickie"
- `loft` (Lv 3+) → "🎬 Lag Glamour Feature"
- `studio` (Lv 4+) → "🎬 Feature / Blockbuster"

Klikk åpner samme `ProductionsSheet` — bare forhåndsfiltrert til tier(s) som er logiske der.

**B. Legg en liten "🎬 Aktive produksjoner (N)" indikator** i HUD-status-strip ved siden av kampanje/rival, så spilleren fortsatt ser at noe ruller — men starter dem fra studioet.

**C. Beholder en kompakt snarvei?** Hvis du vil unngå friksjon kan vi beholde en liten `🎬 N`-pille i status-strip som åpner sheet i "oversikt"-modus (kun pågående/utgivelser, ikke "start ny"). Da skiller vi management (HUD) fra creation (location).

Implementasjon:
- `HUD.tsx`: fjern Filmer-NavBtn, legg `🎬 N` pill i status-strip om `productions.length > 0`.
- `LocationView.tsx` (eller `locations.ts`-actions-tabellen): legg "Lag film"-action på trailer/loft/studio som kaller `onOpenProductions()`.
- Ingen endring i `useGame.ts` / `productions.ts`.

## 2) Gameplay-logikk-gjennomgang — funn

Jeg leste `useGame.ts`, `productions.ts`, `locations.ts`, `data.ts`, `genres.ts`. Konsist:

### Det som funker bra
- **Tids-motor (`advance`)**: drainer stamina (4/t), tikker produksjoner, ruller dag, gir uke-tick hver 7. dag, håndterer auto-lån. Solid.
- **Mission-payout**: konsoliderer flere fullførte oppdrag i én toast/log med totalsum. Pent.
- **Gallery-credit fra produksjoner** (linje 1219–1234): `p.girlIds.includes(g.id)` → alle medvirkende får scene-kort i sitt gallery med farget hue. ✅ Det du beskriver fungerer allerede.
- **Health/STD-loop**: ukentlig loyalty-drain for syke jenter, varsling. Konsistent.
- **Kontrakt-utløp**: stjerner blir free agents + loyalty-hit. Fint trykk på spilleren.

### Logikk-røde flagg

1. **Quickie-tier i HUD vs. studio-mods** — quickies bruker `getStudioMods` (cost/hours/quality basert på `studioLevel` + utstyr) selv om du tematisk lager dem i trailer'n. Mindre rart hvis Filmer-knappen flyttes til selve trailer (så er det "trailer-quickie" tematisk uansett mods).

2. **Idle auto-tick (25 s = 1 t)** kjører selv om sheets er åpne. Hvis spilleren leser i Roster-sheet i 5 min siver det 12 timer. Vurder å pause idle-tick når noen sheet er åpen.

3. **Splash-detection** (`day===1 && hour===8 && girls.length===0`) er skjør — hvis spilleren har spilt og solgt alle jenter er den falskt true. Bedre med eksplisitt `started: boolean` flag.

4. **Auto-lån-betaling** trekker hele lånet automatisk så snart `cash >= loan` på forfall. Spilleren får ikke valg om å re-finansiere. Vurder å la den forfalle med rente i stedet, og la spilleren betale manuelt.

5. **Heat-razzia** (linje 423–426) trekker `min(cash, 200 + heat*10)` — kan tørrlegge spilleren helt og bryte forrige punkt (kan ikke betale lån etter razzia samme tick). Kjede-effekt verdt å sjekke balansering på.

6. **Gallery cap = 40 scener per jente** (`.slice(-40)`). Greit for ytelse, men "evergreen"-stjerner mister tidlig-karriere. Ikke bug, design-valg å notere.

7. **`flopped`-grein i release** gir fortsatt scene til galleriet (med 💀-emoji). Bevisst? Spilleren får et visuelt minnesmerke over fiaskoen — kult, men kan forvirre om en jente sier "Slapp X" når X floppet. Sjekk lastActivity-tekst (linje 1231 sier "Spilte i flopp" — det er greit).

8. **`weekTick` random event** kan gi negativ stamina/cash uten øvre grense på rep-tap (clampes til 0, ok). Men `RANDOM_EVENTS` i `data.ts` har ingen pos/neg balanse — gjennomgå for å sikre fair distribusjon over tid.

9. **Rivaler påvirkes av releases**, men ikke av webcam/visit/mission-payouts. Spilleren kan teoretisk maxe rep via solo-grind uten at rivalene reagerer. Vurder å la rep-vekst over terskel også presse rival-share.

10. **Genre-fanbase** (`genres.ts`) bygges kun fra produksjoner — webcam og missions taggear ingen genre. Webcam-toys-show kunne logisk gitt "wild"-fans, etc. Lavt-hengende kobling.

### Out of scope nå
Punktene over er *observasjoner*. Ingenting endres i denne planen utover GUI-flyttingen i seksjon 1, med mindre du peker på spesifikke punkter du vil ha løst.

## Leveranse hvis du godkjenner
1. Fjern Filmer-NavBtn fra `HUD.tsx`, legg `🎬 N`-pill i status-strip.
2. Legg "Lag film"-action på trailer/loft/studio i location-action-tabellen, åpner `ProductionsSheet`.
3. Ingen mekanikk-endringer.
