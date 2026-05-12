
# Bustville vs. Lula: The Sexy Empire — gap-analyse & implementeringsplan

Vi har allerede mye av Lula-DNAet (klikkbart bykart, lokasjons-scener, klokke/time-system, roster med stats, produksjons-pipeline, sheriff/heat, lån, oppgraderinger, butikker for filmstock/kostymer/audition). Under er det Lula har som vi **ikke** har — rangert etter spill-impact og implementerings-kost.

## Det vi mangler vs. Lula

### Kjerne-mekanikker (høy impact)
1. **Konkurrenter/rivaliserende studioer** — Lula har AI-rivaler som kaprer markedsandeler, stjeler stjerner og lager egne filmer. Vi har null konkurranse → ingen markedspress.
2. **Filmgenre + publikums-matching** — i Lula velger du genre (romance, action, fetish…) og målgruppen reagerer ulikt. Vi har bare "tier" (Quickie/Glamour/Feature/Blockbuster). Genre+jente-arketype-synergi er savnet.
3. **Awards / prisutdelinger** — sesongsluttsgalla, "Bustville Awards" med nominasjoner, statuetter og rep+salgs-boost. Lula har Golden G-strings.
4. **Stjerne-kontrakter + agenter** — i dag signerer du jenter gratis og evig. Lula har eksklusiv-kontrakter, kontraktslengde, signing bonus, agenter som forhandler.
5. **Stjerne-moral/drama-system** — sjalusi, romanser mellom stjerner, rusproblemer, krav om hovedroller. Vi har bare loyalty + cooldown.

### Innhold/scener (medium impact)
6. **Aksje-/børs-handel eller investeringer** — Lula har sekundære inntektskilder (eiendom, aksjer).
7. **Marketing-kampanjer** — kjøp annonser før release (avis, TV, plakat) → påvirker åpningssalg.
8. **Fan mail / fanklubb** — passive inntekter fra stjernenes popularitet.
9. **Magazine covers / TV-talkshow-bookinger** — egne mini-aksjoner for å booste enkelt-stjerner.
10. **Body upgrades på klinikken** — Doc Lonnie tilbyr i dag bare heling. Lula har "enhancements" som permanent øker beauty/popularity (med risiko/cooldown).

### Spill-følelse (lav-medium impact)
11. **Casino/poker mini-spill** — gambling for cash på Velvet eller Dirty Dan's.
12. **Sesonger/år-system** — vi teller dag/uke, men ikke år. Lula har 4 sesonger som påvirker hva som selger.
13. **Newspaper / Daily News-tikker** — kort overskrift hver morgen om byen + dine handlinger (Lula har Bustville Bugle vibe).
14. **Achievements / milepæler** — i dag har vi bare "level 5 = vinn". Trenger mellom-mål (første $10k, første award, etc).
15. **Save-slots / NG+** — bare ett localStorage-save nå.

### Vi har, men kan dypne
- Heat/razzia: bra, men kunne hatt fengsel + bail-out (Lula har).
- Roster-trening: kan utvides med spesialist-coacher (acting coach, fitness, charisma).
- Random events: bare 11 stk og fyrer ved endWeek. Lula har lokasjons-trigget drama hver gang du går inn et sted.

## Anbefalt implementerings-rekkefølge

Jeg foreslår 3 inkrement, hver leverbar separat:

### Inkrement A — "Markedet lever" (mest impact for minst kost)
**Mål:** spillet føles ikke som solo-sandkasse lenger.
1. **Rivaler** (2 AI-studioer): tikker i bakgrunnen ved endWeek, lager filmer, tar markedsandel. Vises som leaderboard-widget i HUD. Påvirker dine release-inntekter: `payout × (1 - rivalShare × 0.3)`.
2. **Genre på produksjoner**: 4 genrer (Romance, Wild, Glamour, Fetish). Velges ved briefing. Hver genre matcher 1-2 arketyper → +25% kvalitet/payout ved match. Tom match → −15%.
3. **Marketing-aksjon på distrib**: ny action `runCampaign` ($300/$800/$2000) → 1×/1.5×/2× release-multiplier.
4. **Daily News-tikker** i HUD topp: rotere 1 linje per dag (mix av rival-nytt, awards-teasere, by-rykter).

Filer: ny `src/game/rivals.ts`, ny `src/game/genres.ts`, utvid `productions.ts` (genre-felt), `useGame.ts` (endWeek-rival-tick, payout-formel, news-state), `LocationView`/`ProductionsSheet` (genre-velger), `HUD` (news-ticker).

### Inkrement B — "Stjernene betyr noe" (drama + kontrakter)
5. **Stjerne-kontrakter**: ved scout/signing tegnes kontrakt (4/8/12 uker, signing bonus $X, ukentlig minstelønn). Utløp → ny forhandling eller frigi.
6. **Drama-events** på stjerner: sjalusi når to jobber sammen, rusproblemer ved 3+ intense oppdrag på rad, krav om hovedrolle ved høy popularity.
7. **Body upgrades** i klinikken: +5 beauty for $1500 (1 dags cooldown), +5 performance for $1200, risiko 10% for "botched" → −popularity i 1 uke.
8. **Talent agent** på Velvet: betal $400 → bedre scout-roll (filter på min beauty/performance).

Filer: utvid `Girl`-typen (contract, drugUse, jealousyWith), nye events i `data.ts`, klinikk-actions i `useGame.ts`.

### Inkrement C — "Glansen og prestisjen"
9. **Bustville Awards** hver 12. uke: nominasjoner basert på topp-kvalitet-produksjoner siste sesong. Vinn → +25 rep, +30% salg neste 2 uker, stjerner får +popularity.
10. **Achievements-panel**: 12-15 milepæler med toast + permanente passive buffs.
11. **Fanklubb-inntekt**: passiv $X per uke per stjerne med popularity ≥ 60.
12. **Sesonger** (4 stk, 3 uker hver): hver sesong booster én genre (sommer = Wild, vinter = Romance).

Filer: ny `src/game/awards.ts`, `src/game/achievements.ts`, ny `AwardsModal.tsx`, sesong-felt i state, sesong-multiplier i payout.

## Hvis du må velge én ting først
**Inkrement A** gir mest "Lula-følelse" raskest fordi rivaler + genre + marketing forvandler produksjons-pipelinen fra "klikk gjennom stages" til "strategiske valg per film".

## Spørsmål før jeg starter
- Vil du jeg skal starte rett på **Inkrement A**, eller plukke spesifikke punkter fra forskjellige inkrement?
- Skal rivalene være statiske (2 faste, scriptet) eller prosedyralt navngitte med egne stjerner?
- Awards og sesonger — beholde 7-dagers uke, eller utvide til 4-sesongers år?
