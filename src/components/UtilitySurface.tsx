import { useEffect, useRef } from 'react';
// @ts-expect-error - plotly.js-dist-min ships no bundled types
import Plotly from 'plotly.js-dist-min';
import type { Params } from '../types';

type PlotlyDiv = HTMLDivElement & { on?: (event: string, cb: (ev: unknown) => void) => void };
import {
  sampleSurface,
  applyTransformation,
  budgetLineAt,
  marshallianAt,
  marshallianBundle,
  hicksianAt,
  expenditureAt,
  utility,
} from '../utility';

interface Props {
  params: Params;
  onChange: (patch: Partial<Params>) => void;
}

const COLOR = {
  preTax: '#111827',
  postTax: '#ef4444',
  compensated: '#2563eb',
  revenue: '#10b981',
  sub: '#0d9488',
  income: '#f59e0b',
  ic: 'rgba(255,255,255,0.55)',
};

export default function UtilitySurface({ params, onChange }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the latest viewMode so the plotly_relayout event handler
  // (registered once) can read it without going stale.
  const viewModeRef = useRef(params.viewMode);
  viewModeRef.current = params.viewMode;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const relayoutRegistered = useRef(false);

  useEffect(() => {
    if (!divRef.current) return;

    // Base surface (transformed in ordinality mode).
    const surf = sampleSurface(params);
    const z =
      params.mode === 'ordinality'
        ? applyTransformation(surf.z, params.ordinality.transformation)
        : surf.z;

    let zMax = 0;
    for (const row of z) for (const v of row) if (v > zMax) zMax = v;

    const traces: unknown[] = [];

    // Main surface (guarded). Contour projection uses Plotly's built-in only in
    // the Surface mode; other modes draw their own isolines.
    if (params.showSurface) {
      traces.push({
        type: 'surface',
        x: surf.x, y: surf.y, z,
        colorscale: 'Viridis',
        opacity: params.mode === 'ordinality' ? 0.9 : 0.95,
        showscale: false,
        contours:
          params.mode === 'surface' && params.surface.showContourFloor
            ? {
                z: {
                  show: true, usecolormap: true, project: { z: true },
                  start: zMax * 0.05, end: zMax,
                  size: (zMax - zMax * 0.05) / Math.max(1, params.surface.isolineCount),
                },
              }
            : undefined,
        hovertemplate: 'x\u2081=%{x:.1f}<br>x\u2082=%{y:.1f}<br>z=%{z:.2f}<extra></extra>',
      });
    } else if (params.mode === 'surface' && params.surface.showContourFloor) {
      // Even without the surface, show the floor contour projection so the 2D
      // contour map remains visible.
      const start = zMax * 0.05;
      const step = (zMax - start) / Math.max(1, params.surface.isolineCount);
      const levels: number[] = [];
      for (let k = 1; k <= params.surface.isolineCount; k++) levels.push(start + k * step);
      renderIsolinesAt(traces, params, levels, 'rgba(17,24,39,0.35)', 1.5, false);
    }

    const bundle = marshallianBundle(params);

    // ------------ Mode dispatch ------------

    switch (params.mode) {
      case 'surface':
        renderSurfaceMode(traces, params, zMax, bundle);
        break;
      case 'slutsky':
        renderSlutsky(traces, params);
        break;
      case 'hicksian':
        renderHicksian(traces, params);
        break;
      case 'marshallian':
        renderMarshallianMode(traces, params, zMax);
        break;
      case 'ordinality':
        renderOrdinality(traces, params);
        break;
      case 'evcv':
        renderEVCV(traces, params, zMax);
        break;
    }

    // Top-down 2D snap: look straight down the z-axis, orthographic projection,
    // with x1 right and x2 up. Matches the canonical textbook diagram.
    const camera2D = {
      eye: { x: 0, y: 0, z: 2.3 },
      up: { x: 0, y: 1, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      projection: { type: 'orthographic' },
    };
    const camera3D = {
      eye: { x: 1.5, y: -1.6, z: 0.9 },
      up: { x: 0, y: 0, z: 1 },
      center: { x: 0, y: 0, z: 0 },
      projection: { type: 'perspective' },
    };

    // Fix the z-axis range to a single value driven by the raw surface height,
    // so toggling the hill off doesn't rescale the scene. The `_zMax` value is
    // always derived from the (possibly transformed) raw surface data.
    const zRange: [number, number] = [0, Math.max(1, zMax * 1.1)];

    const layout = {
      title: { text: titleFor(params), font: { size: 16 } },
      margin: { l: 0, r: 0, b: 0, t: 40 },
      scene: {
        xaxis: { title: { text: 'x\u2081' }, range: [0, params.extent], gridcolor: '#e5e7eb' },
        yaxis: { title: { text: 'x\u2082' }, range: [0, params.extent], gridcolor: '#e5e7eb' },
        zaxis: {
          title: { text: params.mode === 'ordinality' ? 'f(U)' : 'U(x\u2081, x\u2082)' },
          range: zRange,
          gridcolor: '#e5e7eb',
          visible: params.viewMode === '3d',
        },
        camera: params.viewMode === '2d' ? camera2D : camera3D,
        aspectmode: 'cube',
      },
      paper_bgcolor: '#ffffff',
    };

    const config = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['toImage'] };
    Plotly.react(divRef.current, traces, layout, config).then(() => {
      // Register the relayout handler once. When the user drags the scene in 2D
      // view, Plotly fires plotly_relayout with 'scene.camera' keys; we flip
      // back to 3D so the user sees real perspective.
      if (relayoutRegistered.current || !divRef.current) return;
      const div = divRef.current as PlotlyDiv;
      if (typeof div.on !== 'function') return;
      div.on('plotly_relayout', (ev) => {
        const e = ev as Record<string, unknown>;
        const cameraChanged = Object.keys(e).some(k => k.startsWith('scene.camera'));
        if (cameraChanged && viewModeRef.current === '2d') {
          onChangeRef.current({ viewMode: '3d' });
        }
      });
      relayoutRegistered.current = true;
    });
  }, [params]);

  return <div ref={divRef} style={{ width: '100%', height: 640 }} />;
}

function titleFor(p: Params): string {
  const base = p.utilityType === 'cobb-douglas' ? 'Cobb-Douglas' : 'CES';
  switch (p.mode) {
    case 'surface': return `Utility surface: ${base}`;
    case 'slutsky': return `Slutsky decomposition: ${base}`;
    case 'hicksian': return 'Hicksian demand: bundle slides along contour';
    case 'marshallian':
      return `Marshallian path as ${p.marshallian.varyBy === 'p1' ? 'p\u2081' : 'm'} varies`;
    case 'ordinality': return 'Ordinality: contours are invariant under f(U)';
    case 'evcv': return 'CV and EV as parallel budget-curtain shifts';
  }
}

// --------- helpers that add traces for each mode ---------

function renderIsolinesAt(
  traces: unknown[], params: Params, levels: number[],
  lineColor = COLOR.ic, width = 2, onSurface = true,
): void {
  for (const u of levels) {
    const xs: number[] = [], ys: number[] = [], zs: number[] = [];
    const N = 100;
    for (let i = 1; i <= N; i++) {
      const x1 = (params.extent * i) / N;
      const x2 = solveX2ForU(x1, u, params);
      if (x2 != null && x2 > 0 && x2 <= params.extent) {
        xs.push(x1); ys.push(x2); zs.push(onSurface ? u : 0);
      }
    }
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: xs, y: ys, z: zs,
      line: { color: lineColor, width },
      showlegend: false, hoverinfo: 'skip',
    });
  }
}

function renderBudgetCurtain(
  traces: unknown[], p1: number, p2: number, income: number,
  zTop: number, color: string, opacity: number, dash = 'solid',
): void {
  // The raw opacity is the caller's hint; we boost it to make curtains read
  // clearly against the Viridis surface. Feel free to re-tune.
  opacity = Math.min(0.65, opacity + 0.25);
  const xEnd = income / p1;
  const yStart = income / p2;
  const n = 30;
  const bx: number[] = [], by: number[] = [], bz: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x1 = t * xEnd;
    const x2 = yStart - (yStart / xEnd) * x1;
    bx.push(x1, x1); by.push(x2, x2); bz.push(0, zTop * 1.05);
  }
  const i_: number[] = [], j_: number[] = [], k_: number[] = [];
  for (let seg = 0; seg < n; seg++) {
    const a = seg * 2, b = seg * 2 + 1, c = seg * 2 + 2, d = seg * 2 + 3;
    i_.push(a, b); j_.push(b, d); k_.push(c, c);
  }
  traces.push({
    type: 'mesh3d', x: bx, y: by, z: bz, i: i_, j: j_, k: k_,
    color, opacity, flatshading: true, hoverinfo: 'skip',
  });
  // Floor line
  const budget = budgetLineAt(p1, p2, income);
  traces.push({
    type: 'scatter3d', mode: 'lines',
    x: budget.x, y: budget.y, z: [0, 0],
    line: { color, width: 4, dash },
    showlegend: false, hoverinfo: 'skip',
  });
}

// --------- Surface mode (original behaviour) ---------
function renderSurfaceMode(
  traces: unknown[], p: Params, zMax: number, bundle: { x1: number; x2: number; u: number },
): void {
  const o = p.surface;

  if (o.showIsolines) {
    const levels: number[] = [];
    const start = zMax * 0.05;
    const step = (zMax - start) / Math.max(1, o.isolineCount);
    for (let k = 1; k <= o.isolineCount; k++) levels.push(start + k * step);
    renderIsolinesAt(traces, p, levels);
  }

  if (o.showBudgetPlane) {
    renderBudgetCurtain(traces, p.p1, p.p2, p.income, zMax, COLOR.compensated, 0.18);
  }

  if (o.showOptimalBundle) {
    // IC at A*
    renderIsolinesAt(traces, p, [bundle.u], COLOR.postTax, 5, true);
    renderIsolinesAt(traces, p, [bundle.u], COLOR.postTax, 2, false);  // floor projection
    traces.push({
      type: 'scatter3d', mode: 'markers+text',
      x: [bundle.x1], y: [bundle.x2], z: [bundle.u],
      marker: { size: 6, color: COLOR.postTax },
      text: ['A*'], textposition: 'top center',
      textfont: { size: 14, color: COLOR.postTax },
      hovertemplate: 'A*<br>x\u2081=%{x:.2f}<br>x\u2082=%{y:.2f}<br>U=%{z:.2f}<extra></extra>',
    });
    // stem
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: [bundle.x1, bundle.x1], y: [bundle.x2, bundle.x2], z: [0, bundle.u],
      line: { color: COLOR.postTax, width: 3, dash: 'dot' },
      showlegend: false, hoverinfo: 'skip',
    });
    // floor shadow
    traces.push({
      type: 'scatter3d', mode: 'markers',
      x: [bundle.x1], y: [bundle.x2], z: [0],
      marker: { size: 4, color: COLOR.postTax },
      showlegend: false, hoverinfo: 'skip',
    });
  }
}

// --------- Slutsky ---------
function renderSlutsky(traces: unknown[], p: Params): void {
  const o = p.slutsky;
  const A = marshallianAt(p, p.p1, p.p2, p.income);
  const q1 = p.p1 + o.t1;
  const tildeA = marshallianAt(p, q1, p.p2, p.income);
  const U0 = A.u, U1 = tildeA.u;
  const H = hicksianAt(p, q1, p.p2, U0);

  if (o.showPreTaxIC) renderIsolinesAt(traces, p, [U0], COLOR.preTax, 4, true);
  if (o.showPostTaxIC) renderIsolinesAt(traces, p, [U1], COLOR.postTax, 4, true);

  // Floor projections of the ICs for 2D context
  if (o.showPreTaxIC) renderIsolinesAt(traces, p, [U0], COLOR.preTax, 2, false);
  if (o.showPostTaxIC) renderIsolinesAt(traces, p, [U1], COLOR.postTax, 2, false);

  let zTop = 0;
  for (const u of [U0, U1]) if (u > zTop) zTop = u;
  zTop *= 1.3;

  if (o.showPreTaxBudget)
    renderBudgetCurtain(traces, p.p1, p.p2, p.income, zTop, COLOR.preTax, 0.14);
  if (o.showPostTaxBudget)
    renderBudgetCurtain(traces, q1, p.p2, p.income, zTop, COLOR.postTax, 0.14);
  if (o.showHicksianBudget) {
    // Compensated: same slope as post-tax but tangent to U_0.
    const incCV = expenditureAt(p, q1, p.p2, U0);
    renderBudgetCurtain(traces, q1, p.p2, incCV, zTop, COLOR.sub, 0.14, 'dash');
  }

  if (o.showBundles) {
    dotLabel(traces, A.x1, A.x2, U0, 'A', COLOR.preTax);
    dotLabel(traces, H.x1, H.x2, U0, 'H', COLOR.sub);
    dotLabel(traces, tildeA.x1, tildeA.x2, U1, 'A\u0303', COLOR.postTax);
  }

  if (o.showSubArrow) {
    // Slide along the U_0 contour from A to H, parameterised by x_1.
    addContourSegment(traces, p, U0, A.x1, H.x1, COLOR.sub, 5);
  }
  if (o.showIncArrow) {
    // Income effect: from H (at U_0) to tilde-A (at U_1), at post-tax prices.
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: [H.x1, tildeA.x1], y: [H.x2, tildeA.x2], z: [U0, U1],
      line: { color: COLOR.income, width: 5 },
      showlegend: false, hoverinfo: 'skip',
    });
    // Arrowhead-ish marker at the end
    traces.push({
      type: 'scatter3d', mode: 'markers',
      x: [tildeA.x1], y: [tildeA.x2], z: [U1],
      marker: { size: 4, color: COLOR.income, symbol: 'diamond' },
      showlegend: false, hoverinfo: 'skip',
    });
  }
}

// --------- Hicksian demand trajectory ---------
function renderHicksian(traces: unknown[], p: Params): void {
  const o = p.hicksian;
  const A = marshallianAt(p, p.p1, p.p2, p.income);
  const uBar = o.useUAtA ? A.u : o.customU;

  // The target contour on the surface + floor
  renderIsolinesAt(traces, p, [uBar], COLOR.postTax, 5, true);
  renderIsolinesAt(traces, p, [uBar], COLOR.postTax, 2, false);

  if (o.showTrace) {
    // Trace of h(p₁, uBar) for p₁ ∈ [pMin, pMax]. This IS the contour too (since
    // the Hicksian bundle at any price is on U̅), but we draw the path as coloured
    // dots to emphasise it's a parameterised trajectory.
    const N = 40;
    const xs: number[] = [], ys: number[] = [], zs: number[] = [];
    for (let i = 0; i <= N; i++) {
      const p1 = o.pMin + ((o.pMax - o.pMin) * i) / N;
      const h = hicksianAt(p, p1, p.p2, uBar);
      xs.push(h.x1); ys.push(h.x2); zs.push(uBar);
    }
    traces.push({
      type: 'scatter3d', mode: 'markers',
      x: xs, y: ys, z: zs,
      marker: { size: 3, color: COLOR.compensated },
      showlegend: false, hoverinfo: 'skip',
    });
  }

  // Current bundle
  const hNow = hicksianAt(p, o.currentP1, p.p2, uBar);
  dotLabel(traces, hNow.x1, hNow.x2, uBar, `H(p\u2081=${o.currentP1.toFixed(2)})`, COLOR.postTax);

  // Show the compensated budget that achieves exactly U̅ at the current p₁.
  const inc = expenditureAt(p, o.currentP1, p.p2, uBar);
  renderBudgetCurtain(traces, o.currentP1, p.p2, inc, uBar * 1.3, COLOR.compensated, 0.18);
}

// --------- Marshallian / Engel path ---------
function renderMarshallianMode(
  traces: unknown[], p: Params, zMax: number,
): void {
  const o = p.marshallian;
  if (o.showTrace) {
    const N = 40;
    const xs: number[] = [], ys: number[] = [], zs: number[] = [];
    for (let i = 0; i <= N; i++) {
      const v = o.min + ((o.max - o.min) * i) / N;
      const b =
        o.varyBy === 'p1'
          ? marshallianAt(p, v, p.p2, p.income)
          : marshallianAt(p, p.p1, p.p2, v);
      xs.push(b.x1); ys.push(b.x2); zs.push(b.u);
    }
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: xs, y: ys, z: zs,
      line: { color: COLOR.postTax, width: 5 },
      name: o.varyBy === 'p1' ? 'Price path' : 'Income-expansion path',
    });
    // Floor projection
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: xs, y: ys, z: xs.map(() => 0),
      line: { color: COLOR.postTax, width: 2, dash: 'dot' },
      showlegend: false, hoverinfo: 'skip',
    });
  }

  // Current bundle
  const now =
    o.varyBy === 'p1'
      ? marshallianAt(p, o.currentValue, p.p2, p.income)
      : marshallianAt(p, p.p1, p.p2, o.currentValue);
  dotLabel(
    traces, now.x1, now.x2, now.u,
    `A*(${o.varyBy === 'p1' ? 'p\u2081' : 'm'}=${o.currentValue.toFixed(2)})`,
    COLOR.postTax,
  );

  // Current budget curtain
  if (o.varyBy === 'p1') {
    renderBudgetCurtain(traces, o.currentValue, p.p2, p.income, zMax, COLOR.compensated, 0.15);
  } else {
    renderBudgetCurtain(traces, p.p1, p.p2, o.currentValue, zMax, COLOR.compensated, 0.15);
  }
}

// --------- Ordinality ---------
function renderOrdinality(traces: unknown[], p: Params): void {
  if (!p.ordinality.showContours) return;
  // Contours at the ORIGINAL U levels, not f(U). Draw them on the *transformed* surface
  // by looking up the transformed height at each x1,x2 on the contour.
  const levels: number[] = [];
  // Pick contour levels as a small set of original-U values.
  const grid = sampleSurface(p);
  let uMax = 0;
  for (const row of grid.z) for (const v of row) if (v > uMax) uMax = v;
  const start = uMax * 0.1;
  const step = (uMax - start) / 8;
  for (let k = 1; k <= 8; k++) levels.push(start + k * step);

  const f = transformationOf(p.ordinality.transformation);

  for (const u of levels) {
    const xs: number[] = [], ys: number[] = [], zs: number[] = [];
    const N = 120;
    for (let i = 1; i <= N; i++) {
      const x1 = (p.extent * i) / N;
      const x2 = solveX2ForU(x1, u, p);
      if (x2 != null && x2 > 0 && x2 <= p.extent) {
        xs.push(x1); ys.push(x2); zs.push(f(u));
      }
    }
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: xs, y: ys, z: zs,
      line: { color: 'rgba(239,68,68,0.85)', width: 3 },
      showlegend: false, hoverinfo: 'skip',
    });
    // Floor projections are the SAME for every f. That is the point.
    traces.push({
      type: 'scatter3d', mode: 'lines',
      x: xs, y: ys, z: xs.map(() => 0),
      line: { color: 'rgba(239,68,68,0.5)', width: 2, dash: 'dot' },
      showlegend: false, hoverinfo: 'skip',
    });
  }
}

// --------- CV / EV ---------
function renderEVCV(traces: unknown[], p: Params, _zMax: number): void {
  const o = p.evcv;
  const A = marshallianAt(p, p.p1, p.p2, p.income);
  const q1 = p.p1 + o.t1;
  const tildeA = marshallianAt(p, q1, p.p2, p.income);
  const U0 = A.u, U1 = tildeA.u;

  // CV: income needed at new prices to reach U₀
  const mCV = expenditureAt(p, q1, p.p2, U0);
  // EV: income needed at old prices to reach U₁
  const mEV = expenditureAt(p, p.p1, p.p2, U1);

  const zTop = Math.max(U0, U1) * 1.25;

  renderIsolinesAt(traces, p, [U0], COLOR.preTax, 4, true);
  renderIsolinesAt(traces, p, [U1], COLOR.postTax, 4, true);
  renderIsolinesAt(traces, p, [U0], COLOR.preTax, 2, false);
  renderIsolinesAt(traces, p, [U1], COLOR.postTax, 2, false);

  if (o.showPreTaxCurtain)
    renderBudgetCurtain(traces, p.p1, p.p2, p.income, zTop, COLOR.preTax, 0.14);
  if (o.showPostTaxCurtain)
    renderBudgetCurtain(traces, q1, p.p2, p.income, zTop, COLOR.postTax, 0.14);
  if (o.showEVCurtain)
    renderBudgetCurtain(traces, p.p1, p.p2, mEV, zTop, COLOR.compensated, 0.14, 'dash');
  if (o.showCVCurtain)
    renderBudgetCurtain(traces, q1, p.p2, mCV, zTop, '#ef4444', 0.14, 'dash');

  if (o.showBundleA) dotLabel(traces, A.x1, A.x2, U0, 'A', COLOR.preTax);
  if (o.showBundleTildeA) dotLabel(traces, tildeA.x1, tildeA.x2, U1, 'A\u0303', COLOR.postTax);

  if (o.showBrackets) {
    // Show the two incomes as text anchored at the y-axis intercepts of each curtain.
    const bracket = (y: number, color: string, label: string, dx = 0) => {
      traces.push({
        type: 'scatter3d', mode: 'markers+text',
        x: [dx], y: [y], z: [0],
        marker: { size: 2, color },
        text: [label], textposition: 'middle right',
        textfont: { size: 12, color },
        showlegend: false, hoverinfo: 'skip',
      });
    };
    bracket(p.income / p.p2, COLOR.preTax, `m = ${p.income.toFixed(0)}`, -2);
    bracket(mCV / p.p2, '#ef4444', `m + CV = ${mCV.toFixed(1)}`, -2);
    bracket(mEV / p.p2, COLOR.compensated, `m - EV = ${mEV.toFixed(1)}`, -2);
  }
}

// --------- primitive helpers ---------

function dotLabel(
  traces: unknown[], x: number, y: number, z: number, label: string, color: string,
): void {
  traces.push({
    type: 'scatter3d', mode: 'markers+text',
    x: [x], y: [y], z: [z],
    marker: { size: 6, color },
    text: [label], textposition: 'top center',
    textfont: { size: 14, color },
    hovertemplate: `${label}<br>x\u2081=%{x:.2f}<br>x\u2082=%{y:.2f}<br>U=%{z:.2f}<extra></extra>`,
  });
}

// Walk along the contour of utility level u from x1=fromX1 to toX1, drawing
// a polyline lifted to that utility.
function addContourSegment(
  traces: unknown[], p: Params, u: number,
  fromX1: number, toX1: number, color: string, width: number,
): void {
  const xs: number[] = [], ys: number[] = [], zs: number[] = [];
  const N = 60;
  const lo = Math.min(fromX1, toX1);
  const hi = Math.max(fromX1, toX1);
  for (let i = 0; i <= N; i++) {
    const x1 = lo + ((hi - lo) * i) / N;
    const x2 = solveX2ForU(x1, u, p);
    if (x2 != null) { xs.push(x1); ys.push(x2); zs.push(u); }
  }
  // If original direction is reversed, flip for proper arrow sense
  if (fromX1 > toX1) { xs.reverse(); ys.reverse(); zs.reverse(); }
  traces.push({
    type: 'scatter3d', mode: 'lines',
    x: xs, y: ys, z: zs,
    line: { color, width },
    showlegend: false, hoverinfo: 'skip',
  });
}

function solveX2ForU(x1: number, target: number, params: Params): number | null {
  if (x1 <= 0 || target <= 0) return null;
  let lo = 1e-6, hi = params.extent * 2;
  const f = (x2: number) =>
    utility(x1, x2, params.utilityType, params.alpha, params.rho) - target;
  if (f(hi) < 0) return null;
  if (f(lo) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function transformationOf(t: string): (u: number) => number {
  switch (t) {
    case 'identity': return u => u;
    case 'log': return u => Math.log(Math.max(0, u) + 1);
    case 'square': return u => u * u;
    case 'sqrt': return u => Math.sqrt(Math.max(0, u));
    case 'affine': return u => 3 * u + 10;
    default: return u => u;
  }
}
