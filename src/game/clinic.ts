/** Body upgrade-prosedyrer hos Doc Lonnie's Clinic. */
export interface BodyProcedure {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  hours: number;          // tid spilleren bruker
  restDays: number;       // restitusjonstid for jenta
  stat: "beauty" | "performance" | "popularity";
  inc: [number, number];  // min, max økning
  risk: number;           // sjanse for komplikasjon (0-1)
}

export const BODY_PROCEDURES: BodyProcedure[] = [
  { id: "lips",  label: "Lip Fillers",        emoji: "💋", cost: 600,  hours: 2, restDays: 2, stat: "beauty",      inc: [4, 9],   risk: 0.05 },
  { id: "fit",   label: "Personal Trainer",   emoji: "🏋️", cost: 800,  hours: 3, restDays: 3, stat: "performance", inc: [6, 12],  risk: 0.02 },
  { id: "boob",  label: "Boob Job",           emoji: "🍒", cost: 1800, hours: 4, restDays: 5, stat: "beauty",      inc: [10, 18], risk: 0.10 },
  { id: "butt",  label: "Butt Lift",          emoji: "🍑", cost: 2200, hours: 5, restDays: 7, stat: "popularity",  inc: [10, 18], risk: 0.12 },
];
