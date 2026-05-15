import type { GameState } from "./useGame";
import { nextGoal } from "./goals";

export function bestNextActionHint(state: GameState): string {
  const goal = nextGoal(state.goals);
  if (goal) return `Push goal: ${goal.title}`;
  if (state.stamina < 20) return "Low stamina: End Day to recover.";
  if (state.castingLeads.length === 0) return "Scout local talent to keep your pipeline full.";
  if (state.girls.length === 0) return "Hire from the Casting Board to unlock most actions.";
  if (state.productions.filter((p) => p.stageIdx < 4).length === 0)
    return "Start a Quickie production for steady growth.";
  if (state.cash < 250) return "Run a short cash action before upgrades.";
  return "Advance active productions and keep heat under control.";
}
