export type UtilityType = 'cobb-douglas' | 'ces';

export type Mode =
  | 'surface'       // just the utility hill + IC family
  | 'slutsky'       // substitution (slide) vs income (drop) decomposition
  | 'hicksian'      // H(p, U̅) traced as the bundle slides along a contour
  | 'marshallian'   // x(p,m) or Engel curve traced as bundle moves over surface
  | 'ordinality'    // monotonic transformation → contours unchanged
  | 'evcv';         // four budget "curtains" → EV, CV as parallel-plane shifts

export type Transformation = 'identity' | 'log' | 'square' | 'sqrt' | 'affine';

export interface SurfaceOpts {
  showBudgetPlane: boolean;
  showContourFloor: boolean;
  showIsolines: boolean;
  isolineCount: number;
  showOptimalBundle: boolean;
}

export interface SlutskyOpts {
  t1: number;
  showPreTaxIC: boolean;        // U₀ contour on the hill
  showPostTaxIC: boolean;       // U₁ contour
  showPreTaxBudget: boolean;
  showPostTaxBudget: boolean;
  showHicksianBudget: boolean;  // compensated: new slope, tangent to U₀
  showBundles: boolean;         // A, H, Ã as dots
  showSubArrow: boolean;        // A → H along U₀ contour (substitution)
  showIncArrow: boolean;        // H → Ã between contours (income)
}

export interface HicksianOpts {
  currentP1: number;
  pMin: number;
  pMax: number;
  useUAtA: boolean;             // true → use U at Marshallian A with current params
  customU: number;              // used when useUAtA is false
  showTrace: boolean;           // the full Hicksian path along U̅ as p₁ varies
  showSidePanel: boolean;       // 2D (p₁, x₁) Hicksian demand curve
}

export interface MarshallianOpts {
  varyBy: 'p1' | 'income';
  currentValue: number;
  min: number;
  max: number;
  showTrace: boolean;
  showSidePanel: boolean;
}

export interface OrdinalityOpts {
  transformation: Transformation;
  showContours: boolean;
}

export interface EVCVOpts {
  t1: number;
  showPreTaxCurtain: boolean;
  showPostTaxCurtain: boolean;
  showEVCurtain: boolean;
  showCVCurtain: boolean;
  showBrackets: boolean;
  showBundleA: boolean;
  showBundleTildeA: boolean;
}

export interface Params {
  mode: Mode;

  // shared
  utilityType: UtilityType;
  alpha: number;
  rho: number;
  p1: number;
  p2: number;
  income: number;
  gridSize: number;
  extent: number;

  // per-mode options
  surface: SurfaceOpts;
  slutsky: SlutskyOpts;
  hicksian: HicksianOpts;
  marshallian: MarshallianOpts;
  ordinality: OrdinalityOpts;
  evcv: EVCVOpts;
}

export const defaultParams: Params = {
  mode: 'surface',
  utilityType: 'cobb-douglas',
  alpha: 0.5,
  rho: -0.5,
  p1: 1,
  p2: 1,
  income: 100,
  gridSize: 60,
  extent: 100,
  surface: {
    showBudgetPlane: true,
    showContourFloor: true,
    showIsolines: true,
    isolineCount: 10,
    showOptimalBundle: true,
  },
  slutsky: {
    t1: 0.5,
    showPreTaxIC: true,
    showPostTaxIC: true,
    showPreTaxBudget: true,
    showPostTaxBudget: true,
    showHicksianBudget: true,
    showBundles: true,
    showSubArrow: true,
    showIncArrow: true,
  },
  hicksian: {
    currentP1: 1,
    pMin: 0.4,
    pMax: 2.5,
    useUAtA: true,
    customU: 30,
    showTrace: true,
    showSidePanel: true,
  },
  marshallian: {
    varyBy: 'p1',
    currentValue: 1,
    min: 0.4,
    max: 2.5,
    showTrace: true,
    showSidePanel: true,
  },
  ordinality: {
    transformation: 'identity',
    showContours: true,
  },
  evcv: {
    t1: 0.5,
    showPreTaxCurtain: true,
    showPostTaxCurtain: true,
    showEVCurtain: true,
    showCVCurtain: true,
    showBrackets: true,
    showBundleA: true,
    showBundleTildeA: true,
  },
};
