export type UtilityType = 'cobb-douglas' | 'ces';

export interface Params {
  utilityType: UtilityType;
  alpha: number;    // preference weight on good 1, 0..1
  rho: number;      // CES substitution parameter; ρ→0 → Cobb-Douglas; ρ→1 → perfect substitutes
  p1: number;
  p2: number;
  income: number;
  gridSize: number; // resolution of the surface mesh
  extent: number;   // axis max for x1 and x2
  showBudgetPlane: boolean;
  showContourFloor: boolean;
  showIsolines: boolean;    // indifference curves projected on floor
  isolineCount: number;
  showOptimalBundle: boolean;
}

export const defaultParams: Params = {
  utilityType: 'cobb-douglas',
  alpha: 0.5,
  rho: -0.5,
  p1: 1,
  p2: 1,
  income: 100,
  gridSize: 60,
  extent: 100,
  showBudgetPlane: true,
  showContourFloor: true,
  showIsolines: true,
  isolineCount: 10,
  showOptimalBundle: true,
};
