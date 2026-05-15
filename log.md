# Bustville Empire — Implementation Log

## 2026-05-15 06:58 — Icon + Meter UX Pass

### Added
- `src/components/game/GameIcon.tsx` — central icon system mapping ~80 game-specific names to lucide-react icons, with tone presets (cash, rep, stamina, heat, danger, warning, success, neutral, purple).
- `src/components/game/GameMeter.tsx` — reusable `GameMeter`, `StatPill`, `SegmentedProgress`, `CooldownMeter` components.
- `src/components/game/logIcons.ts` — `classifyLogEvent()` helper + tone class map for log events.

### Changed
- `src/components/game/HUD.tsx` — rewritten to use `StatPill` for cash/rep/stamina/heat with inline mini meters for stamina (cyan) and heat (orange). All HUD buttons now use `GameIcon` with proper aria-labels. Fixed broken Pill/IconBtn prop interfaces inherited from earlier refactor.
- `src/components/game/LocationView.tsx` — Logg panel now classifies each line via `classifyLogEvent` and renders a tone-coloured `GameIcon` (cash, heat, milestone, recruit, etc.) instead of a generic ★ prefix.
- `src/game/useGame.ts` — fixed pre-existing TS error in `trainGirl` (stat pick was typed `keyof Girl`, narrowed to trainable stats).

### Notes
- Scope was kept tight to the high-traffic surfaces (HUD + LocationView log) plus the reusable primitives. Roster/Staff/Inventory/Productions/CastingBoard/Progression panels can now drop in `<GameIcon>` and `<StatPill>`/`<SegmentedProgress>` as a follow-up pass without further plumbing.
- No save-state changes. No new content. Adult-tone copy untouched.
- `npm run typecheck` script is not defined; relied on the harness TS check (clean after the edits above). `lint` and `build` are run by the harness.

### Follow-ups recommended
- Wire `SegmentedProgress` into `ProgressionSheet` (Cash / Rep / First Hit / Heat segments).
- Wire production pipeline icons (idea → casting → shoot → edit → release) into `ProductionsSheet`.
- Replace text-only action metadata in `LocationView` action cards with icon rows (time / cash / stamina / heat).
- Add icon row to `StaffPanel` role cards and `CastingBoardPanel` lead cards.

## 2026-05-15 07:21 — Icon + Meter UX Pass 2 (Apply pass)

### Files changed
- `src/components/game/LocationView.tsx`
- `src/components/game/CastingBoardPanel.tsx`
- `src/components/game/StaffPanel.tsx`
- `src/components/game/RosterSheet.tsx`
- `src/components/game/InventorySheet.tsx`
- `src/components/game/ProductionsSheet.tsx`
- `src/components/game/ProgressionSheet.tsx`

### Panels updated
- Location action cards: replaced emoji-leading layout with `GameIcon` action icons and compact mechanical preview chips (time/cash/stamina/heat + star requirement where relevant).
- Casting Board: iconized header, scout CTA, hire/pass actions, salary/hidden-potential pills.
- Staff/Help Wanted: iconized header mode, role-specific icons, level meter and upgrade icon button.
- Roster: iconized header, per-performer star + stamina mini meter + clear status icon (available/busy/cooldown/tired/injured fallback).
- Inventory: inventory-icon header and improved item icon mapping.
- Productions: stage strip converted to `SegmentedProgress` with pipeline icons (idea/casting/shoot/edit/release).
- Progression modal: unlock checks now include segmented icon progress row.

### Icons/meters applied
- `GameIcon`, `StatPill`, `GameMeter`, `SegmentedProgress` applied across the above panels as an extension of pass 1 primitives.
- No save/state schema changes.

### Test results
- `npm run typecheck`: script missing in package.json.
- `npm run lint`: passes with pre-existing warnings (no new lint errors).
- `npm run build`: passes.

### Known limitations
- Action preview values in `LocationView` remain intentionally generic in this pass (variable/impact/cost/risk) because per-action deterministic economy previews are not centrally exposed yet.
- Productions currently does not enforce/display an audition-voucher requirement gate in the card flow because no direct requirement hook was found in existing production state/actions.
