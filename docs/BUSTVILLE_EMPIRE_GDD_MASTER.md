# Bustville Empire — GDD Master (MVP Grounded)

This master GDD summarizes what is **already implemented** and what the team should prioritize next without drifting away from the current playable loop.

## 1) Implemented Systems

### 1.1 State engine and simulation core
- The main game state is centralized in `GameState` inside `useGame.ts`, covering economy (`cash`, `loan`, `backlog`), risk (`heatLevel`, bribery tracking), progression (`locationLevel`, `studioLevel`, equipment), cast (`girls`), content progression (`productions`), and resources/inventory (`filmstock`, `costumes`, `auditionVouchers`, `condoms`, campaign/distribution bonuses).  
- Time is modeled as day/hour with helper utilities (`absHour`, `hoursUntilNextClockTime`), and many systems consume hours/stamina and apply cooldowns to workers.  
- Intensity tiers (`chill`, `standard`, `intense`) are implemented and alter outcomes via heat and cooldown modifiers (`applyIntensityHeat`, `previewHeat`, `intensityCooldownHours`).

### 1.2 Locations, districts, and map flow
- District architecture is implemented with two districts (`park`, `downtown`) and explicit unlock levels and map art in `locations.ts` (`DISTRICTS`).
- Interactive hotspot navigation exists via `HOTSPOTS` per district, including a special transition hotspot (`downtown_exit`) and typed support for location vs special hotspots.
- Location definitions include open hours, district ownership, unlock requirements, and descriptions (`LOCATION_DEFS`).
- Route-level flow in `src/routes/index.tsx` already supports map view vs location view switching depending on `activeLocation`, with district switching handlers wired through HUD and map components.

### 1.3 Production pipeline
- Production data model is formalized in `productions.ts` with stage-driven progression:
  - Stage order: `briefing → casting → shooting → editing → release`.
  - Tiered content ladder: `quickie`, `glamour`, `feature`, `blockbuster`, each with unique base payout/rep, stage costs/hours/stamina costs, and title pools.
- Cast-role specialization is implemented (`casting`, `shooting`, `editing`, `release`) with role metadata and labels.
- `useGame.ts` includes production-affecting modifiers from studio/equipment (`getStudioMods`) that influence cost, speed, quality cap, and parallel capacity.

### 1.4 Roster, clinic, inventory, gallery, and save-load
- Roster system is exposed in route UI via `RosterSheet` and handlers for select/fire/train/gift/resign/missions.
- Clinic is integrated in the primary HUD flow (`ClinicSheet`) and connected to action execution (`onPerform={g.perform}`), with health/procedure hooks imported in `useGame.ts` (`rollSTD`, `activeSTD`, `isBlockedByStd`, `BODY_PROCEDURES`).
- Inventory systems are represented in state and UI (`InventorySheet`) and reinforced by location actions in `locations.ts` (buy filmstock, costumes, condoms, audition vouchers, marketing/distribution boosts).
- Gallery browsing is implemented through `GallerySheet`, fed from cast data.
- Save/load exists with multi-slot local storage metadata (`listSaveSlots` in `useGame.ts`) plus options menu wiring for save/load/delete/export/import in `index.tsx`.

### 1.5 Risk, rivals, and live world signals
- Risk loop includes heat accumulation, bribery windows, and law-pressure framing in state and sheriff actions.
- Rival simulation and city-news headline hooks are integrated (`INITIAL_RIVALS`, `tickRivals`, `dailyHeadline`) from `useGame.ts` imports.
- Random events, missions, and drama/health rolls are integrated as active subsystems supporting emergent play.

---

## MVP RULE
Bustville Empire is first and foremost a business tycoon game.
Adult content is theme, tone and satire — not the mechanical core.
Every feature must improve at least one of these:
1. Money decisions
2. Time pressure
3. Character management
4. Risk/reward
5. Progression toward the next location

## 2) MVP Focus (Core Loop)

The MVP should stay strict to this shipped loop:

1. **Recruit / staff pipeline** (scouting + roster decisions + role assignment).  
2. **Produce content** through staged pipeline with constrained resources (cash, stamina, inventory, cooldown/time).  
3. **Release and monetize** (tier payouts, campaign/distribution modifiers, reputation/fan impact).  
4. **Manage risk/resources** (heat, bribery timing, loan pressure, consumables, capacity upgrades).

This is already mechanically represented in current data structures and route/component wiring. MVP polish should improve reliability, readability, and tuning of this loop—not widen scope with unrelated meta-systems.

---

## 3) Next Roadmap (Post-loop Clarity & Depth)

### 3.1 Clarity UX (highest near-term)
- Make map/location affordances clearer (open-hours, lock reasons, and “why action is blocked”).
- Improve production pipeline readability (current stage, required resources, projected completion/release impact).
- Consolidate risk feedback (heat changes, bribery efficacy decay, and upcoming danger windows).

### 3.2 Balancing pass
- Tune economy curves across tier payouts vs upkeep/upgrades.
- Rebalance stamina/cooldown pressure and intensity multipliers.
- Validate inventory sinks/sources so consumables feel strategic, not chore-like.

### 3.3 Onboarding and guidance
- Add stronger first-session direction around: first recruit, first production start, first release, first risk response.
- Expand contextual hints in sheets/modals for non-obvious dependencies (e.g., inventory gating for shooting/casting).

### 3.4 Advanced rivals and live events (after loop polish)
- Deepen rival escalation and differentiation (distinct archetype behaviors).
- Build more event cadence tied to district progression and release cadence.
- Add higher-variance “city pulse” moments without breaking core resource logic.

---

## 4) Safety & Style Rules

These are **mandatory content constraints** for all current and future assets/content:

- Satirical, tongue-in-cheek tone is allowed; explicit pornographic depiction is not.
- All characters implied or represented in game systems are consenting adults.
- No explicit sexual imagery in UI, art, copy, or event text.
- Use stylized, non-explicit assets and suggestive-but-safe framing.
- Keep writing in line with current “Lula-style satire” brand voice while remaining platform-safe.

---

## 5) Known Non-MVP Features (Do Not Block Current Loop Polish)

The following can be deferred and are not required to declare the current loop polished:

- Deep narrative branching/campaign chapters.
- Full rival faction diplomacy or territory wars.
- Complex live-ops calendars and seasonal event infrastructures.
- Expanded endgame empire-management layers beyond present district/tier progression.
- Heavy cosmetic progression systems not tied to recruit → produce → release → risk management.

Use these as future expansion candidates only after the MVP loop is stable, legible, and balanced.
