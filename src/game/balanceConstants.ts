export const LOW_EQUIPMENT_PENALTY_BANDS = [
  {
    maxEqSum: 0,
    qualityCapPenalty: 12,
    shootHoursMult: 1.2,
    editHoursMult: 1.15,
    flopFloor: 0.18,
    payoutCeilingMult: 0.72,
  },
  {
    maxEqSum: 1,
    qualityCapPenalty: 8,
    shootHoursMult: 1.14,
    editHoursMult: 1.1,
    flopFloor: 0.14,
    payoutCeilingMult: 0.8,
  },
  {
    maxEqSum: 2,
    qualityCapPenalty: 4,
    shootHoursMult: 1.08,
    editHoursMult: 1.06,
    flopFloor: 0.1,
    payoutCeilingMult: 0.9,
  },
] as const;

export const DEFAULT_LOW_EQUIPMENT_PENALTIES = {
  qualityCapPenalty: 0,
  shootHoursMult: 1,
  editHoursMult: 1,
  flopFloor: 0.02,
  payoutCeilingMult: 1,
} as const;

export function getLowEquipmentPenalties(eqSum: number) {
  return (
    LOW_EQUIPMENT_PENALTY_BANDS.find((band) => eqSum <= band.maxEqSum) ??
    DEFAULT_LOW_EQUIPMENT_PENALTIES
  );
}

export const EQUIPMENT_LEVEL_ZERO_FLAVOR: Record<"camera" | "lighting" | "editing", string> = {
  camera: "Broken Camcorder",
  lighting: "Garage Lamp",
  editing: "Cheap VCR Deck",
};
