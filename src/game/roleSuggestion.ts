import type { Girl } from "@/game/data";
import type { CastRole } from "@/game/productions";

export interface RoleSuggestion {
  role: CastRole;
  reason: string;
  scores: Record<CastRole, number>;
}

const roundScore = (value: number) => Math.round(value);

export function suggestRole(girl: Girl): RoleSuggestion {
  const scores: Record<CastRole, number> = {
    casting: roundScore(girl.beauty * 0.55 + girl.popularity * 0.45),
    shooting: roundScore(girl.performance * 0.75 + girl.beauty * 0.25),
    editing: roundScore(girl.performance * 0.7 + girl.loyalty * 0.3),
    release: roundScore(girl.popularity * 0.6 + girl.beauty * 0.4),
  };

  const rank: CastRole[] = ["casting", "shooting", "editing", "release"];
  const role = rank.reduce(
    (best, candidate) => (scores[candidate] > scores[best] ? candidate : best),
    rank[0],
  );

  const reasonByRole: Record<CastRole, string> = {
    casting: `Suggested because Bea ${girl.beauty}, Pop ${girl.popularity}`,
    shooting: `Suggested because Perf ${girl.performance}, Bea ${girl.beauty}`,
    editing: `Suggested because Perf ${girl.performance}, Loy ${girl.loyalty}`,
    release: `Suggested because Pop ${girl.popularity}, Bea ${girl.beauty}`,
  };

  return {
    role,
    reason: reasonByRole[role],
    scores,
  };
}
