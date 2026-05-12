# GUI Layout — forbedringsplan

Dagens UI fungerer, men HUD-en er overfylt (15+ pills/knapper på én rad), kart-overlay konkurrerer med hendelseslogg, og LocationView har tre uavhengige scrollende kolonner som gir dårlig informasjonshierarki. Planen rydder opp uten å endre spillmekanikk.

## Mål
- Mindre visuell støy, klarere hierarki (ressurser vs. navigasjon vs. kontekst).
- Konsistent layout-grid på desktop, brukbart ned til 768px.
- Gjøre roster + valgt stjerne alltid synlig under spilling — ikke bare i sheet.

## Endringer

### 1. HUD → to-radig "command bar" (`src/components/game/HUD.tsx`)
- **Rad 1 (statuslinje):** kun ressurs-pills (Cash, Rep, Stam, Moon, Heat, Loan, Day/Time). Sentrert/jevn fordeling, fast høyde.
- **Rad 2 (action bar):** kun navigasjons-knapper (Inventar, Galleri, Klinikk, Boss, Filmer, Roster, Switch district, Options).
- Slå sammen `campaignBonus` + `topRival` + nyhetsticker til én smal "status-strip" under HUD.
- På < md: kollaps rad 2 i en `Sheet`/burger-meny; vis bare Cash, Stam, Time + meny-ikon.

### 2. Persistent venstre-sidebar for Roster (ny `src/components/game/RosterRail.tsx`)
- Smal kolonne (w-64, kollapsbar til w-14 med shadcn `Sidebar`) som viser alle stjerner som kort med portrett, status (klar/oppdrag/hviler), valgt-indikator.
- Klikk = velg stjerne (erstatter dagens "trykk roster-sheet → velg" flyt). Sheet-en beholdes for detalj-redigering ved dobbeltklikk.
- Frigjør LocationView fra å vise "valgt stjerne" tekstuelt — sidebaren er kilden.

### 3. MapView: rolig overlay-grid (`src/components/game/MapView.tsx`)
- Flytt distrikts-tittel inn i HUD som breadcrumb ("Bustville › Park"), fjern stort overlay øverst-venstre.
- Hendelses-loggen flyttes til høyre side (vertikal panel, kollapsbar) i stedet for å dekke nederste tredjedel.
- Sone-editor-knapp samles i et lite verktøy-flyout nederst-høyre sammen med district-switch.

### 4. LocationView: 12-kolonners grid (`src/components/game/LocationView.tsx`)
- Bilde 7 kol, handlinger 5 kol på desktop. Mobil: bilde stacker over.
- Handlings-listen får sticky header med valgt stjerne + intensitet, slik at lange action-lister ikke mister kontekst.
- Logg-panel deles med MapView (samme komponent), plassert i HUD-status-strip i stedet for duplisert i hver view.

### 5. Felles design-tokens (`src/styles.css`)
- Definer `--surface-1/2/3`, `--hud-height`, `--rail-width` og bruk dem i HUD/sidebar/views slik at høyder og bakgrunner er konsistente. Ingen hardkodede `bg-card/60` blandinger.

## Tekniske notater
- Bruker eksisterende `@/components/ui/sidebar` (shadcn) for RosterRail med `SidebarProvider` i `src/routes/__root.tsx` eller lokalt i `routes/index.tsx`.
- Ingen endring i `useGame.ts`, `data.ts`, `locations.ts`, `productions.ts`. Alt er presentation.
- Sheets (Stats, Productions, Inventory, Gallery, Clinic, Webcam, Visit, Options, Roster-detail) beholdes uendret — de åpnes nå fra rad 2 / sidebar.
- Responsive breakpoint: bruk Tailwind `lg:` for 3-kolonne, `md:` for 2-kolonne, base = stacked.

## Out of scope
- Ingen nye spill-features eller balansjustering.
- Ingen endring av bilder/assets.
- Ingen ny tema-farger; bare token-rydding.

## Leveranse-rekkefølge
1. Tokens i `styles.css`.
2. HUD splitt + status-strip.
3. RosterRail + integrasjon i `routes/index.tsx`.
4. MapView overlay-rydding.
5. LocationView grid + sticky header.
