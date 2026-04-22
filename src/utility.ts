import type { Params, UtilityType, Transformation } from './types';

export function utility(x1: number, x2: number, type: UtilityType, alpha: number, rho: number): number {
  if (x1 <= 0 || x2 <= 0) return 0;
  if (type === 'cobb-douglas') {
    return Math.pow(x1, alpha) * Math.pow(x2, 1 - alpha);
  }
  if (Math.abs(rho) < 1e-4) {
    return Math.pow(x1, alpha) * Math.pow(x2, 1 - alpha);
  }
  const inner = alpha * Math.pow(x1, rho) + (1 - alpha) * Math.pow(x2, rho);
  if (inner <= 0) return 0;
  return Math.pow(inner, 1 / rho);
}

// Marshallian bundle at arbitrary prices / income.
export function marshallianAt(
  p: Params, p1: number, p2: number, income: number,
): { x1: number; x2: number; u: number } {
  const { alpha, rho, utilityType } = p;
  if (utilityType === 'cobb-douglas') {
    const x1 = (alpha * income) / p1;
    const x2 = ((1 - alpha) * income) / p2;
    return { x1, x2, u: utility(x1, x2, 'cobb-douglas', alpha, rho) };
  }
  const sigma = 1 / (1 - rho);
  const pi1 = Math.pow(alpha, sigma) * Math.pow(p1, 1 - sigma);
  const pi2 = Math.pow(1 - alpha, sigma) * Math.pow(p2, 1 - sigma);
  const denom = pi1 + pi2;
  const x1 = (income * pi1) / (p1 * denom);
  const x2 = (income * pi2) / (p2 * denom);
  return { x1, x2, u: utility(x1, x2, 'ces', alpha, rho) };
}

export function marshallianBundle(p: Params): { x1: number; x2: number; u: number } {
  return marshallianAt(p, p.p1, p.p2, p.income);
}

// Minimum expenditure e(p, U) at given prices to reach utility U.
export function expenditureAt(
  p: Params, p1: number, p2: number, U: number,
): number {
  const { alpha, rho, utilityType } = p;
  if (U <= 0) return 0;
  if (utilityType === 'cobb-douglas') {
    const C = Math.pow(alpha, alpha) * Math.pow(1 - alpha, 1 - alpha);
    return (U * Math.pow(p1, alpha) * Math.pow(p2, 1 - alpha)) / C;
  }
  if (Math.abs(rho) < 1e-4) {
    const C = Math.pow(alpha, alpha) * Math.pow(1 - alpha, 1 - alpha);
    return (U * Math.pow(p1, alpha) * Math.pow(p2, 1 - alpha)) / C;
  }
  const sigma = 1 / (1 - rho);
  const term1 = Math.pow(p1 / alpha, 1 - sigma);
  const term2 = Math.pow(p2 / (1 - alpha), 1 - sigma);
  const priceIndex = Math.pow(term1 + term2, 1 / (1 - sigma));
  return U * priceIndex;
}

// Hicksian bundle h(p, U): cheapest bundle achieving U at given prices.
export function hicksianAt(
  p: Params, p1: number, p2: number, U: number,
): { x1: number; x2: number } {
  const { alpha, rho, utilityType } = p;
  if (U <= 0) return { x1: 0, x2: 0 };
  const e = expenditureAt(p, p1, p2, U);
  if (utilityType === 'cobb-douglas') {
    return { x1: (alpha * e) / p1, x2: ((1 - alpha) * e) / p2 };
  }
  if (Math.abs(rho) < 1e-4) {
    return { x1: (alpha * e) / p1, x2: ((1 - alpha) * e) / p2 };
  }
  const sigma = 1 / (1 - rho);
  const priceRatio1 = p1 / p2;
  const prefRatio = (1 - alpha) / alpha;
  const x1 = e / (p1 + p2 * Math.pow(prefRatio, sigma) * Math.pow(priceRatio1, rho * sigma));
  const priceRatio2 = p2 / p1;
  const prefRatio2 = alpha / (1 - alpha);
  const x2 = e / (p2 + p1 * Math.pow(prefRatio2, sigma) * Math.pow(priceRatio2, rho * sigma));
  return { x1, x2 };
}

// Utility sampled on a regular grid.
export function sampleSurface(p: Params): { x: number[]; y: number[]; z: number[][] } {
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

// Apply a monotonic transformation f: ℝ → ℝ to every z. Contours at f(U*) levels
// still live at the same x1,x2 points. That is the ordinality point.
export function applyTransformation(
  z: number[][], t: Transformation,
): number[][] {
  const f = transformationFn(t);
  return z.map(row => row.map(v => f(v)));
}

export function transformationFn(t: Transformation): (u: number) => number {
  // All transformations are applied on top of raw U ≥ 0. We shift log by 1 so
  // f(0) = 0 (no extreme negative z that would dwarf the rest of the surface),
  // while staying strictly monotone so contour ordering is preserved.
  switch (t) {
    case 'identity': return u => u;
    case 'log': return u => Math.log(Math.max(0, u) + 1);
    case 'square': return u => u * u;
    case 'sqrt': return u => Math.sqrt(Math.max(0, u));
    case 'affine': return u => 3 * u + 10;
  }
}

export function budgetLine(p: Params): { x: number[]; y: number[] } {
  const { p1, p2, income } = p;
  return { x: [0, income / p1], y: [income / p2, 0] };
}

// Budget polyline at arbitrary slope/income.
export function budgetLineAt(
  p1: number, p2: number, income: number,
): { x: number[]; y: number[] } {
  return { x: [0, income / p1], y: [income / p2, 0] };
}
