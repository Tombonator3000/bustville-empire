import { fanMultiplier, genreMatchMult, type GenreId } from "@/game/genres";
import { getTier, type CastRole, type Production } from "@/game/productions";
import { type Girl } from "@/game/data";
import { playerMarketShare, type Rival } from "@/game/rivals";
import { getLowEquipmentPenalties } from "@/game/balanceConstants";

export interface ProductionForecastContext {
  girls: Girl[];
  reputation: number;
  rivals: Rival[];
  playerBusiness: number;
  playerHustle: number;
  studioLevel: number;
  equipmentSum: number;
  distribBonus: number;
  campaignBonus: number;
  fans: Partial<Record<GenreId, number>>;
}

export function roleScoreForProduction(
  production: Production,
  girls: Girl[],
  role: CastRole,
): { count: number; score: number } {
  const assigned = production.girlIds
    .map((gid) => girls.find((x) => x.id === gid))
    .filter((g): g is Girl => !!g && (production.roles?.[g.id] ?? "shooting") === role);
  if (!assigned.length) return { count: 0, score: 0 };
  const score =
    assigned.reduce((acc, g) => {
      switch (role) {
        case "casting":
          return acc + g.beauty * 0.6 + g.popularity * 0.3 + g.loyalty * 0.2;
        case "shooting":
          return acc + g.performance * 0.6 + g.beauty * 0.3 + g.loyalty * 0.1;
        case "editing":
          return acc + g.loyalty * 0.5 + g.performance * 0.3;
        case "release":
          return acc + g.popularity * 0.7 + g.beauty * 0.2;
      }
    }, 0) / assigned.length;
  return { count: assigned.length, score };
}

export function deriveProductionReleaseForecast(
  production: Production,
  ctx: ProductionForecastContext,
) {
  const tier = getTier(production.tierId)!;
  const castStats = production.girlIds
    .map((gid) => ctx.girls.find((x) => x.id === gid))
    .filter(Boolean) as Girl[];
  const castAvg = castStats.length
    ? castStats.reduce((a, g) => a + (g.beauty + g.performance + g.popularity) / 3, 0) /
      castStats.length
    : 0;

  const qualityMult = (production.quality + castAvg) / 100;
  const hustleMult = 1 + ctx.playerHustle * 0.04;
  const studioMult = 1 + (ctx.studioLevel - 1) * 0.15 + ctx.equipmentSum * 0.04;
  const release = roleScoreForProduction(production, ctx.girls, "release");
  const promoMult = 1 + (release.score / 100) * 0.25 + release.count * 0.02;
  const castArchetypes = castStats.map((g) => g.archetype);
  const genreMult = genreMatchMult(production.genreId, castArchetypes);
  const share = playerMarketShare(ctx.rivals, ctx.reputation);
  const marketMult = 0.55 + share * 0.6;
  const campMult = 1 + (ctx.campaignBonus || 0) / 100;
  const genreFans = production.genreId ? (ctx.fans[production.genreId as GenreId] ?? 0) : 0;
  const fanMult = production.genreId ? fanMultiplier(genreFans) : 1;
  const lowEqPenalties = getLowEquipmentPenalties(ctx.equipmentSum);
  const flopChance = Math.max(
    lowEqPenalties.flopFloor,
    0.55 -
      production.quality / 120 -
      ctx.playerBusiness * 0.02 -
      ctx.equipmentSum * 0.015 -
      release.score / 220 -
      (genreMult - 1) * 0.3 -
      Math.min(0.15, genreFans / 4000),
  );
  const distribMult = 1 + (ctx.distribBonus || 0) / 100;
  const rawGross = Math.floor(
    tier.basePayout *
      (0.7 + qualityMult) *
      hustleMult *
      studioMult *
      promoMult *
      distribMult *
      genreMult *
      marketMult *
      campMult *
      fanMult,
  );
  const expectedGross = Math.floor(rawGross * lowEqPenalties.payoutCeilingMult);

  return {
    flopChance,
    expectedGross,
    conservativeGross: Math.floor(expectedGross * 0.3),
    releaseRoleCount: release.count,
    genreMult,
    fanMult,
  };
}
