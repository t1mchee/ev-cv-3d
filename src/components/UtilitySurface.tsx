import { useEffect, useRef } from 'react';
// @ts-expect-error — plotly.js-dist-min ships no bundled types
import Plotly from 'plotly.js-dist-min';
import type { Params } from '../types';
import { sampleSurface, budgetLine, marshallianBundle, utility } from '../utility';

interface Props {
  params: Params;
}

export default function UtilitySurface({ params }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const { x, y, z } = sampleSurface(params);

    // Max utility (top-right corner or bundle) to scale the z-axis sensibly.
    let zMax = 0;
    for (const row of z) for (const v of row) if (v > zMax) zMax = v;

    const bundle = marshallianBundle(params);
    const budget = budgetLine(params);

    // Indifference-curve contour lines on the floor (z = 0) via Plotly's contour
    // trace layered under the surface. We compute them as a separate contour trace
    // projected at z = floorZ using Surface with contours at `isolineCount`
    // evenly spaced utility levels between uMin and zMax.
    const contourStart = zMax * 0.05;
    const contourStep = (zMax - contourStart) / Math.max(1, params.isolineCount);

    const traces: unknown[] = [];

    // Main utility surface
    traces.push({
      type: 'surface',
      x, y, z,
      colorscale: 'Viridis',
      opacity: 0.95,
      showscale: false,
      contours: {
        z: {
          show: params.showContourFloor,
          usecolormap: true,
          project: { z: true },  // project contour lines onto the floor
          start: contourStart,
          end: zMax,
          size: contourStep,
        },
      },
      name: 'U(x₁, x₂)',
      hovertemplate: 'x₁=%{x:.1f}<br>x₂=%{y:.1f}<br>U=%{z:.2f}<extra></extra>',
    });

    // Indifference curves as line traces lifted to their utility height. These sit
    // on the surface itself — makes the "contour of a hill" point directly visible.
    if (params.showIsolines) {
      for (let k = 1; k <= params.isolineCount; k++) {
        const uLevel = contourStart + k * contourStep;
        // For Cobb-Douglas: x2 = (U / x1^α)^(1/(1-α)); for CES solve numerically.
        // We parameterize by x1 and find x2 that hits uLevel.
        const xs: number[] = [];
        const ys: number[] = [];
        const zs: number[] = [];
        const numSamples = 80;
        for (let i = 1; i <= numSamples; i++) {
          const x1 = (params.extent * i) / numSamples;
          const x2 = solveX2ForUtility(x1, uLevel, params);
          if (x2 != null && x2 > 0 && x2 <= params.extent) {
            xs.push(x1);
            ys.push(x2);
            zs.push(uLevel);
          }
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: xs, y: ys, z: zs,
          line: { color: 'rgba(255,255,255,0.55)', width: 2 },
          showlegend: false,
          hoverinfo: 'skip',
        });
      }
    }

    // Budget plane as a Mesh3d rectangle, standing vertically in (x1, x2, z).
    // The budget is flat in z; we show it as a shaded triangle from the axis-intercepts.
    if (params.showBudgetPlane) {
      // Rectangle in goods space, extended upward to span the utility range.
      // Render as a translucent vertical prism ("curtain"): for each point on the
      // budget polyline we stack two z values (0 and zMax).
      const bx: number[] = [];
      const by: number[] = [];
      const bz: number[] = [];
      const n = 30;
      const xEnd = params.income / params.p1;
      const yStart = params.income / params.p2;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x1 = t * xEnd;
        const x2 = yStart - (yStart / xEnd) * x1; // linear budget
        bx.push(x1, x1);
        by.push(x2, x2);
        bz.push(0, zMax * 1.05);
      }
      // Build triangle indices zig-zagging between the lower and upper rows.
      const i_: number[] = [];
      const j_: number[] = [];
      const k_: number[] = [];
      for (let seg = 0; seg < n; seg++) {
        const a = seg * 2;        // lower left
        const b = seg * 2 + 1;    // upper left
        const c = seg * 2 + 2;    // lower right
        const d = seg * 2 + 3;    // upper right
        i_.push(a, b);
        j_.push(b, d);
        k_.push(c, c);
      }
      traces.push({
        type: 'mesh3d',
        x: bx, y: by, z: bz,
        i: i_, j: j_, k: k_,
        color: '#2563eb',
        opacity: 0.18,
        flatshading: true,
        name: 'Budget plane',
        hoverinfo: 'skip',
      });

      // Budget line on the floor (the standard 2D picture)
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: budget.x,
        y: budget.y,
        z: [0, 0],
        line: { color: '#2563eb', width: 4 },
        name: 'Budget line',
        hoverinfo: 'skip',
      });
    }

    // Optimal bundle: a marker ball at the tangency and a vertical stem up to U*.
    if (params.showOptimalBundle) {
      traces.push({
        type: 'scatter3d',
        mode: 'markers+text',
        x: [bundle.x1],
        y: [bundle.x2],
        z: [bundle.u],
        marker: { size: 6, color: '#ef4444', line: { color: 'white', width: 1 } },
        text: ['A*'],
        textposition: 'top center',
        textfont: { size: 14, color: '#ef4444' },
        name: 'Optimal bundle',
        hovertemplate:
          'A* — Marshallian choice<br>x₁=%{x:.2f}<br>x₂=%{y:.2f}<br>U=%{z:.2f}<extra></extra>',
      });

      // Stem from floor up to the optimal utility on the surface.
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: [bundle.x1, bundle.x1],
        y: [bundle.x2, bundle.x2],
        z: [0, bundle.u],
        line: { color: '#ef4444', width: 3, dash: 'dot' },
        showlegend: false,
        hoverinfo: 'skip',
      });

      // Ground projection of the optimal bundle
      traces.push({
        type: 'scatter3d',
        mode: 'markers',
        x: [bundle.x1],
        y: [bundle.x2],
        z: [0],
        marker: { size: 4, color: '#ef4444', symbol: 'circle' },
        showlegend: false,
        hoverinfo: 'skip',
      });
    }

    const layout = {
      title: {
        text: `Utility surface — ${params.utilityType === 'cobb-douglas' ? 'Cobb-Douglas' : 'CES'}`,
        font: { size: 16 },
      },
      margin: { l: 0, r: 0, b: 0, t: 40 },
      scene: {
        xaxis: { title: { text: 'x₁' }, range: [0, params.extent], gridcolor: '#e5e7eb' },
        yaxis: { title: { text: 'x₂' }, range: [0, params.extent], gridcolor: '#e5e7eb' },
        zaxis: { title: { text: 'U(x₁, x₂)' }, gridcolor: '#e5e7eb' },
        camera: { eye: { x: 1.5, y: -1.6, z: 0.9 } },
        aspectmode: 'cube',
      },
      paper_bgcolor: '#ffffff',
    };

    const config = {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['toImage'],
    };

    Plotly.react(divRef.current, traces, layout, config);
  }, [params]);

  return <div ref={divRef} style={{ width: '100%', height: 640 }} />;
}

// Solve x2 such that U(x1, x2) = target for the given params. Monotone in x2,
// so bisection works cleanly.
function solveX2ForUtility(x1: number, target: number, params: Params): number | null {
  if (x1 <= 0 || target <= 0) return null;
  let lo = 1e-6;
  let hi = params.extent * 2;
  const f = (x2: number) =>
    utility(x1, x2, params.utilityType, params.alpha, params.rho) - target;
  if (f(hi) < 0) return null;
  if (f(lo) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
