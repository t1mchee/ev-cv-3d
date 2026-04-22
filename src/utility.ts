import type { Params, UtilityType } from './types';

export function utility(x1: number, x2: number, type: UtilityType, alpha: number, rho: number): number {
  if (x1 <= 0 || x2 <= 0) return 0;
  if (type === 'cobb-douglas') {
    return Math.pow(x1, alpha) * Math.pow(x2, 1 - alpha);
  }
  // CES: U = (α x1^ρ + (1-α) x2^ρ)^(1/ρ)
  // Special case ρ→0 ~ Cobb-Douglas, handle numerical guard
  if (Math.abs(rho) < 1e-4) {
    return Math.pow(x1, alpha) * Math.pow(x2, 1 - alpha);
  }
  const inner = alpha * Math.pow(x1, rho) + (1 - alpha) * Math.pow(x2, rho);
  if (inner <= 0) return 0;
  return Math.pow(inner, 1 / rho);
}

// Marshallian demand for given prices and income — closed form for CD and CES.
export function marshallianBundle(p: Params): { x1: number; x2: number; u: number } {
  const { alpha, rho, p1, p2, income, utilityType } = p;
  if (utilityType === 'cobb-douglas') {
    const x1 = (alpha * income) / p1;
    const x2 = ((1 - alpha) * income) / p2;
    return { x1, x2, u: utility(x1, x2, 'cobb-douglas', alpha, rho) };
  }
  // CES: see Varian. σ = 1/(1-ρ). Demand share on good i depends on prices.
  const sigma = 1 / (1 - rho);
  const pi1 = Math.pow(alpha, sigma) * Math.pow(p1, 1 - sigma);
  const pi2 = Math.pow(1 - alpha, sigma) * Math.pow(p2, 1 - sigma);
  const denom = pi1 + pi2;
  const x1 = (income * pi1) / (p1 * denom);
  const x2 = (income * pi2) / (p2 * denom);
  return { x1, x2, u: utility(x1, x2, 'ces', alpha, rho) };
}

// Sample the utility function on a regular grid over [step, extent].
// Returned arrays follow Plotly's surface convention: z[j][i] = U(x[i], y[j]).
export function sampleSurface(p: Params): {
  x: number[];
  y: number[];
  z: number[][];
} {
  const { gridSize, extent, utilityType, alpha, rho } = p;
  const step = extent / gridSize;
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= gridSize; i++) {
    const v = i * step;
    x.push(v);
    y.push(v);
  }
  const z: number[][] = [];
  for (let j = 0; j <= gridSize; j++) {
    const row: number[] = [];
    for (let i = 0; i <= gridSize; i++) {
      row.push(utility(x[i], y[j], utilityType, alpha, rho));
    }
    z.push(row);
  }
  return { x, y, z };
}

// Polyline on the floor: (0, m/p2) → (m/p1, 0).
export function budgetLine(p: Params): { x: number[]; y: number[] } {
  const { p1, p2, income } = p;
  return {
    x: [0, income / p1],
    y: [income / p2, 0],
  };
}
