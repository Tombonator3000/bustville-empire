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

- `hireCastingLead` (from Trailer Office → Casting Board, leads sourced by `bar:scoutBar`, `gas:postFlyer`, and `casting:openCall`)
- `velvet:scoutVip` (premium direct route)

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

## New flow (Early Game)

- Gas station and bar generate leads only.
- Forest no longer recruits performers.
- RecruitRevealModal appears only when a lead is actually hired into `girls` (sets `lastRecruitId`).
