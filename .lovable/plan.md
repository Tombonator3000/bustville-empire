## Mål
Lage et sett **originale, ikke-seksualiserte cover-bilder** som brukes som standard "plakat" i galleriet og i menyene for webshow, studio (produksjoner) og butikk — pluss fylle inn øvrig grafikk som mangler i gallery-flowen.

Stil: stilisert plakat-/albumcover-estetikk (ingen nakenhet, ingen kropper i fokus). Tenk neon-noir, retro-pulp, 70-tallsfilmplakat, art deco, vinyl-sleeve. Symboler, typografi, lys, objekter, silhuetter mot farge — ikke personer i seksualisert positur. Passer trygt som "default" når et galleri-/show-/produksjons-objekt ikke har eget bilde enda.

## Bilder som lages

**Webshow-covers (3 stk — `src/assets/cover-webshow-*.jpg`)**
- `solo` — ringlys på stativ, mikrofon, lavendel-glød, "ON AIR"-skilt.
- `lingerie` — silke-drapering, perler, satin-folder, varm rosa neon.
- `toys` — abstrakt sammensetning av runde geometriske former, rød neon, retro-arkadefølelse.

**Studio/produksjon-covers (4 stk — `src/assets/cover-studio-*.jpg`)** (én pr. TIER)
- `quickie` — 35mm-filmstrip, klaffe, gaffer-tape, lo-fi grain.
- `glamour` — art deco-vifte, champagneglass, gull/sort, marquee-bokstaver.
- `feature` — kino-marquee i regn, taxi-lys, noir-silhuett av bygning.
- `blockbuster` — Vegas-skyline, neon-palmer, helikopter-lys, technicolor.

**Butikk/shop-cover (1 stk — `src/assets/cover-shop.jpg`)**
- "Glitter & Garter"-vindusutstilling: parykker på mannequin-hoder, fjærboa på kleshenger, neon-skilt i vinduet, ingen personer.

**Visit/date-covers (6 stk — `src/assets/cover-visit-*.jpg`)** (én pr. VISIT_TYPES)
- `trucker`, `drunk`, `bachelor`, `politician`, `scout`, `vipsuite` — alle som stilleben/objektkomposisjoner (truck-ratt + termos, ølflaske + kortstokk, partyhatter + konfetti, etui + lommeur, solbriller + storyboard, champagne + diamant).

**Generiske gallery-fallbacks (4 stk — `src/assets/cover-scene-*.jpg`)** brukt når en scene ikke har en mer spesifikk match
- `mission` — kart, kompass, billettstump.
- `training` — speil, lysstoffrør, dans-stang som silhuett bak forheng.
- `production` — clapperboard + rull.
- `default` — generisk neon-rammet "Bustville"-plakat.

Totalt: **18 nye JPG-filer** i `src/assets/`, generert med `imagegen.generate_image` (premium for de som har tekst i seg, ellers standard), 3:2 / 16:9 alt etter bruk.

## Kode-endringer

1. **`src/game/data.ts`**
   - Importere de nye cover-bildene.
   - Legge til `cover: string` på `WebcamShowDef` og `VisitTypeDef` og fylle inn for hver oppføring.
   - Eksportere `STUDIO_COVERS: Record<TierId, string>` og `SHOP_COVER`, `SCENE_FALLBACKS: Record<string, string>`.

2. **`src/components/game/GallerySheet.tsx`** — `ScenePlaceholder`
   - Slå opp cover-bilde basert på `scene.kind` (`webcam-solo`, `visit-trucker`, `production-quickie`, `mission-*`, …) → bruke matchende cover som bakgrunn i stedet for hue-tintet portrett.
   - Beholde portrett som lite badge nede i hjørnet (hvem scenen tilhører).
   - Beholde fargetint via `scene.hue` som overlay-glød, ikke hovedbilde.

3. **`src/components/game/WebcamModal.tsx`** og **`VisitModal.tsx`**
   - Vise cover-bildet som thumbnail ved hver show/visit-type.

4. **`src/components/game/ProductionsSheet.tsx`**
   - Vise tier-cover som banner når man velger ny produksjon, og som thumbnail på hver aktiv produksjon.

5. **`src/components/game/InventorySheet.tsx`** (lett touch)
   - Bruke `SHOP_COVER` som header-banner i shop/inventar-fanen.

## QA
- Etter generering: åpne hvert bilde, sjekke at det er trygt (objekter/typografi, ingen kropper i seksualisert framstilling), riktig stemning, leselig komposisjon.
- Verifisere i preview: galleri viser nye covers, webcam/visit/productions-modaler viser thumbnails, shop-banner laster.

## Ikke i scope nå
- Nye portretter pr. enkeltjente (vi beholder `ARCHETYPE_PORTRAITS` slik de er — det er allerede 6 stk).
- Endring av lokasjons- eller kart-bilder.