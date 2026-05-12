# Tyveri-rapport: HunieCam Studio + Passion Industry

Skrevet 2026-05-12. Kilder:
- HunieCam Studio Wiki: https://huniepop.miraheze.org/wiki/HunieCam_Studio
- EcchiGamer-strategiguide
- Steam/Nutaku-beskrivelser av Passion Industry (BarHat Games, 2025)

---

## Fra HunieCam Studio (cam-tycoon, raskt tempo)

### 1. Stress / Avhengighet-loop ⭐
Hver jente har skjulte drinking/smoking-frekvenser (Never → Addicted). Addicts tar mindre stress per jobb,
men forbrenner forsyninger raskt. Tomme forsyninger = +stress.

**Hos oss:** kobles direkte til Drama-modulen. Hver jente får `vices: { booze, pills, weed }`.
Moonshine Shack og Doc Lonnie blir nødvendige stops, ikke bare flavor.

### 2. Fetisj/Fans-pipeline ⭐
Fans er segmenterte per fetish. Reklame kjøpes per fetish-nisje for bulk-fans.

**Hos oss:** utvid `genres.ts` til en `fans[genre]: number`-vektor. Marketing kjøper målrettede fans
per genre. Filmslipp tjener mer hvis genre-fanbase er stor.

### 3. Investments-tre (12 spor, 71 oppgraderinger)
Klar tycoon-progresjon (Staffing, Capacity, Productivity, Web Servers, Hardware, Advertising slots, Automation osv).

**Hos oss:** "Studio Upgrades"-fane — utvid roster-cap, billigere bribes, flere marketing-slots per uke,
raskere film-produksjon, auto-collect på lokasjoner.

### 4. STD-system med condoms / antibiotika / steroider ⭐ (BYGGES NÅ)
Sleazy Motel = 40% STD-sjanse. Condom = 100% safe men forbrukbar. Steroider = midlertidig negering.

**Hos oss:** Doc Lonnie. Risikable scener (gonzo, fetish-shoots) trigger sjekk. Curable vs incurable,
midlertidig vs permanent debuff.

### 5. Accessory-loadout fra Adult Shop
Hver jente bærer X items (lipstick, vibrator osv.) som gir per-jente buffs.

**Hos oss:** lite "loadout"-system per jente — outfits/toys som booster bestemte scenetyper.

---

## Fra Passion Industry (AV-producer fantasy)

### 6. Starlet-cards med rarity & merge
Vi har tier-system; legg til "duplicate → upgrade".

### 7. Flirty chat / SMS-meldinger fra jentene ⭐ billig vinn
Tekst-popups mellom dager: jenta sender melding, valg påvirker loyalty/drama.

### 8. Romantic quests / dates
Periodiske "ta henne med på X"-oppdrag som låser opp scener i Galleri.

### 9. Animated date scenes som belønning
Cycling/parallax-frames som "animasjon" i galleri.

---

## Anbefalt implementeringsrekkefølge

1. **Stress + Vices loop** — forsterker hele økonomi-loopen
2. **Genre-fanbase-vektor + målrettet marketing** — utvider Inkrement A
3. **STD/Health-risiko-system** ← bygges nå
4. SMS-meldinger (billig vinn)
5. Investments-tre / accessories
