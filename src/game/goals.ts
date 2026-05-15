import type { GameState } from "./useGame";
import { trackTelemetry } from "./telemetry";

export type GoalEvent =
  | "lead_generated"
  | "recruit_hired"
  | "production_started"
  | "stage_advanced"
  | "release_completed"
  | "first_hit";

export interface Goal {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  reward: { cash?: number; reputation?: number };
}

export interface GoalsState {
  list: Goal[];
  completedCount: number;
}

const BLUEPRINT: Omit<Goal, "progress" | "completed">[] = [
  { id: "lead_1", title: "Find your first lead", target: 1, reward: { cash: 60 } },
  { id: "hire_1", title: "Hire a performer", target: 1, reward: { cash: 75 } },
  { id: "prod_1", title: "Start a production", target: 1, reward: { reputation: 1 } },
  { id: "stage_3", title: "Advance 3 production stages", target: 3, reward: { cash: 120 } },
  { id: "release_1", title: "Complete a release", target: 1, reward: { cash: 180, reputation: 1 } },
  {
    id: "first_hit",
    title: "Land your first hit",
    target: 1,
    reward: { cash: 250, reputation: 1 },
  },
];

export function initGoalsState(): GoalsState {
  return {
    list: BLUEPRINT.map((b) => ({ ...b, progress: 0, completed: false })),
    completedCount: 0,
  };
}

export function normalizeGoalsState(raw: unknown): GoalsState {
  const base = initGoalsState();
  if (!raw || typeof raw !== "object") return base;
  const list = Array.isArray((raw as GoalsState).list) ? (raw as GoalsState).list : [];
  const merged = base.list.map((goal) => {
    const fromSave = list.find((x) => x?.id === goal.id);
    if (!fromSave) return goal;
    const progress = Math.max(0, Math.min(goal.target, Math.floor(fromSave.progress ?? 0)));
    return { ...goal, progress, completed: progress >= goal.target || !!fromSave.completed };
  });
  return { list: merged, completedCount: merged.filter((g) => g.completed).length };
}

function goalForEvent(event: GoalEvent): string | null {
  return {
    lead_generated: "lead_1",
    recruit_hired: "hire_1",
    production_started: "prod_1",
    stage_advanced: "stage_3",
    release_completed: "release_1",
    first_hit: "first_hit",
  }[event];
}

export function applyGoalEvent(state: GameState, event: GoalEvent): GameState {
  const goalId = goalForEvent(event);
  if (!goalId) return state;
  const idx = state.goals.list.findIndex((g) => g.id === goalId);
  if (idx === -1) return state;
  const goal = state.goals.list[idx];
  if (goal.completed) return state;
  const progress = Math.min(goal.target, goal.progress + 1);
  const completed = progress >= goal.target;
  const updatedGoal: Goal = { ...goal, progress, completed };
  const list = state.goals.list.map((g, i) => (i === idx ? updatedGoal : g));
  const cashBonus = completed ? (updatedGoal.reward.cash ?? 0) : 0;
  const repBonus = completed ? (updatedGoal.reward.reputation ?? 0) : 0;
  if (completed) {
    trackTelemetry({
      type: "goal_completion",
      at: new Date().toISOString(),
      goalId: updatedGoal.id,
    });
  }
  return {
    ...state,
    cash: state.cash + cashBonus,
    reputation: state.reputation + repBonus,
    goals: { list, completedCount: list.filter((g) => g.completed).length },
  };
}

export function nextGoal(goals: GoalsState): Goal | null {
  return goals.list.find((g) => !g.completed) ?? null;
}
