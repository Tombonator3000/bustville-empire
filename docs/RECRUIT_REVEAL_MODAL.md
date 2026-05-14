# Recruit Reveal Modal

## Purpose
Adds a full-screen recruit reveal every time a **new** girl is successfully added to the roster.

## Data generation
- Recruit presentation metadata is generated in `src/game/recruitPresentation.ts` via `generateRecruitPresentation(girl, locLevel, playerCharisma)`.
- `genGirl(...)` in `src/game/useGame.ts` merges these fields into each new recruit.

## Girl fields added
- `age?: number`
- `profession?: string`
- `preferences?: string[]`
- `starRating?: 1 | 2 | 3 | 4 | 5`
- `tagline?: string`
- `recruitRarityLabel?: string`

## Recruit paths covered
`lastRecruitId` is set only on successful add-to-roster outcomes for:
- `bar:scoutBar`
- `gas:hitchhike`
- `forest:scoutForest`
- `velvet:scoutVip`
- `casting:openCall`

## Content naming policy
- Uses adult-industry short labels only (e.g. Solo, Fetish, Glamour, Premium, Webcam).
- Avoids forbidden terms and explicit prose.
- Keeps tone flashy, satirical, business-oriented.

## Old save compatibility
- New fields are optional on `Girl`.
- Modal computes safe fallbacks for missing legacy data:
  - age 24
  - profession from archetype
  - preferences `Solo` + `Glamour`
  - star rating from stats
  - default tagline

## Future improvements (not implemented)
- Unique portraits per recruit
- Animated card flip
- Reveal sound effect
- 5-star special reveal variant
- Recruit history log
- Rare special recruit events
