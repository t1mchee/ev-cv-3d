import type { Params, UtilityType, Mode, Transformation } from '../types';

interface Props {
  params: Params;
  onChange: (patch: Partial<Params>) => void;
}

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: 'surface', label: '1 · Surface', hint: 'The utility hill + indifference-curve family.' },
  { key: 'slutsky', label: '2 · Slutsky', hint: 'Substitution is a slide along a contour; income is a drop between contours.' },
  { key: 'hicksian', label: '3 · Hicksian', hint: 'Hold U̅ fixed; watch the bundle slide along the contour as p₁ varies.' },
  { key: 'marshallian', label: '4 · Marshallian', hint: 'A* traces a trajectory on the surface as p₁ or m varies.' },
  { key: 'ordinality', label: '5 · Ordinality', hint: 'Monotonic transformations reshape the hill but leave the contours unchanged.' },
  { key: 'evcv', label: '6 · EV / CV', hint: 'Four parallel budget curtains. Income-axis gaps between them = EV and CV.' },
];

const section: React.CSSProperties = {
  background: 'white',
  padding: '14px 16px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  marginBottom: 12,
};

const header: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4, display: 'block',
};

const slider: React.CSSProperties = { width: '100%', cursor: 'pointer' };

const checkboxRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', fontSize: 12, padding: '3px 0', cursor: 'pointer',
};

const hint: React.CSSProperties = {
  fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic',
};

export default function Controls({ params, onChange }: Props) {
  return (
    <div>
      {/* View controls — applies across all modes */}
      <div style={section}>
        <div style={header}>View</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {(['3d', '2d'] as const).map(v => (
            <button
              key={v}
              onClick={() => onChange({ viewMode: v })}
              style={{
                flex: 1, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                border: '1px solid #d1d5db',
                background: params.viewMode === v ? '#1e40af' : 'white',
                color: params.viewMode === v ? 'white' : '#111827',
                borderRadius: 4,
              }}
            >
              {v === '3d' ? '3D (rotatable)' : '2D (top-down)'}
            </button>
          ))}
        </div>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={params.showSurface}
            onChange={e => onChange({ showSurface: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Show utility surface (the coloured hill)</span>
        </label>
        <div style={hint}>
          2D + hide-surface gives you the familiar textbook picture;
          flip back to 3D with the hill on to see where it came from.
        </div>
      </div>

      {/* Mode selector */}
      <div style={section}>
        <div style={header}>Mode</div>
        {MODES.map(m => (
          <label
            key={m.key}
            style={{
              display: 'block', fontSize: 13, padding: '4px 6px', borderRadius: 4,
              cursor: 'pointer',
              background: params.mode === m.key ? '#eef2ff' : 'transparent',
              color: params.mode === m.key ? '#1e40af' : '#111827',
            }}
          >
            <input
              type="radio" checked={params.mode === m.key}
              onChange={() => onChange({ mode: m.key })}
              style={{ marginRight: 6 }}
            />
            {m.label}
          </label>
        ))}
        <div style={hint}>
          {MODES.find(m => m.key === params.mode)?.hint}
        </div>
      </div>

      {/* Shared params */}
      <div style={section}>
        <div style={header}>Utility function</div>
        {(['cobb-douglas', 'ces'] as UtilityType[]).map(t => (
          <label key={t} style={{ display: 'block', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
            <input
              type="radio" checked={params.utilityType === t}
              onChange={() => onChange({ utilityType: t })}
              style={{ marginRight: 6 }}
            />
            {t === 'cobb-douglas' ? 'Cobb-Douglas' : 'CES'}
          </label>
        ))}
        <label style={{ ...label, marginTop: 10 }}>α: {params.alpha.toFixed(2)}</label>
        <input
          type="range" min={0.1} max={0.9} step={0.05} value={params.alpha}
          onChange={e => onChange({ alpha: parseFloat(e.target.value) })}
          style={slider}
        />
        {params.utilityType === 'ces' && (
          <>
            <label style={{ ...label, marginTop: 6 }}>ρ: {params.rho.toFixed(2)}</label>
            <input
              type="range" min={-2} max={0.9} step={0.1} value={params.rho}
              onChange={e => onChange({ rho: parseFloat(e.target.value) })}
              style={slider}
            />
          </>
        )}
      </div>

      <div style={section}>
        <div style={header}>Prices / income</div>
        <label style={label}>Income m: {params.income.toFixed(0)}</label>
        <input type="range" min={30} max={200} step={5} value={params.income}
          onChange={e => onChange({ income: parseFloat(e.target.value) })} style={slider} />
        <label style={{ ...label, marginTop: 8 }}>p₁: {params.p1.toFixed(2)}</label>
        <input type="range" min={0.3} max={3} step={0.05} value={params.p1}
          onChange={e => onChange({ p1: parseFloat(e.target.value) })} style={slider} />
        <label style={{ ...label, marginTop: 8 }}>p₂: {params.p2.toFixed(2)}</label>
        <input type="range" min={0.3} max={3} step={0.05} value={params.p2}
          onChange={e => onChange({ p2: parseFloat(e.target.value) })} style={slider} />
      </div>

      {/* Mode-specific panels */}
      {params.mode === 'surface' && <SurfacePanel params={params} onChange={onChange} />}
      {params.mode === 'slutsky' && <SlutskyPanel params={params} onChange={onChange} />}
      {params.mode === 'hicksian' && <HicksianPanel params={params} onChange={onChange} />}
      {params.mode === 'marshallian' && <MarshallianPanel params={params} onChange={onChange} />}
      {params.mode === 'ordinality' && <OrdinalityPanel params={params} onChange={onChange} />}
      {params.mode === 'evcv' && <EVCVPanel params={params} onChange={onChange} />}

      <div style={section}>
        <div style={header}>Chart chrome</div>
        <label style={label}>Grid resolution: {params.gridSize}</label>
        <input type="range" min={30} max={120} step={5} value={params.gridSize}
          onChange={e => onChange({ gridSize: parseInt(e.target.value, 10) })} style={slider} />
      </div>
    </div>
  );
}

// ----- small helper: typed toggle list -----
function Toggle<T extends Record<string, unknown>>({
  label, checked, onToggle,
}: { label: string; checked: boolean; onToggle: () => void } & Partial<T>) {
  return (
    <label style={checkboxRow}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span style={{ marginLeft: 8 }}>{label}</span>
    </label>
  );
}

// --- per-mode panels ---

function SurfacePanel({ params, onChange }: Props) {
  const o = params.surface;
  const set = (patch: Partial<typeof o>) =>
    onChange({ surface: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Surface mode</div>
      <Toggle label="Floor contour projection" checked={o.showContourFloor}
        onToggle={() => set({ showContourFloor: !o.showContourFloor })} />
      <Toggle label="Indifference curves on surface" checked={o.showIsolines}
        onToggle={() => set({ showIsolines: !o.showIsolines })} />
      <Toggle label="Budget plane (curtain)" checked={o.showBudgetPlane}
        onToggle={() => set({ showBudgetPlane: !o.showBudgetPlane })} />
      <Toggle label="Optimal bundle A* + red IC through A*" checked={o.showOptimalBundle}
        onToggle={() => set({ showOptimalBundle: !o.showOptimalBundle })} />
      <label style={{ ...label, marginTop: 8 }}>IC count: {o.isolineCount}</label>
      <input type="range" min={3} max={20} step={1} value={o.isolineCount}
        onChange={e => set({ isolineCount: parseInt(e.target.value, 10) })} style={slider} />
    </div>
  );
}

function SlutskyPanel({ params, onChange }: Props) {
  const o = params.slutsky;
  const set = (patch: Partial<typeof o>) => onChange({ slutsky: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Slutsky</div>
      <label style={label}>Price change t₁: {o.t1.toFixed(2)}</label>
      <input type="range" min={0} max={2} step={0.05} value={o.t1}
        onChange={e => set({ t1: parseFloat(e.target.value) })} style={slider} />
      <Toggle label="Pre-tax IC U₀" checked={o.showPreTaxIC}
        onToggle={() => set({ showPreTaxIC: !o.showPreTaxIC })} />
      <Toggle label="Post-tax IC U₁" checked={o.showPostTaxIC}
        onToggle={() => set({ showPostTaxIC: !o.showPostTaxIC })} />
      <Toggle label="Pre-tax budget" checked={o.showPreTaxBudget}
        onToggle={() => set({ showPreTaxBudget: !o.showPreTaxBudget })} />
      <Toggle label="Post-tax budget" checked={o.showPostTaxBudget}
        onToggle={() => set({ showPostTaxBudget: !o.showPostTaxBudget })} />
      <Toggle label="Compensated budget (new slope, U₀)" checked={o.showHicksianBudget}
        onToggle={() => set({ showHicksianBudget: !o.showHicksianBudget })} />
      <Toggle label="Bundles A / H / Ã" checked={o.showBundles}
        onToggle={() => set({ showBundles: !o.showBundles })} />
      <Toggle label="Substitution arrow (slide along U₀)" checked={o.showSubArrow}
        onToggle={() => set({ showSubArrow: !o.showSubArrow })} />
      <Toggle label="Income arrow (drop to U₁)" checked={o.showIncArrow}
        onToggle={() => set({ showIncArrow: !o.showIncArrow })} />
    </div>
  );
}

function HicksianPanel({ params, onChange }: Props) {
  const o = params.hicksian;
  const set = (patch: Partial<typeof o>) => onChange({ hicksian: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Hicksian</div>
      <label style={label}>Current p₁: {o.currentP1.toFixed(2)}</label>
      <input type="range" min={o.pMin} max={o.pMax} step={0.02} value={o.currentP1}
        onChange={e => set({ currentP1: parseFloat(e.target.value) })} style={slider} />
      <label style={{ ...label, marginTop: 8 }}>p₁ range: {o.pMin.toFixed(2)} → {o.pMax.toFixed(2)}</label>
      <Toggle label="Use U = U(A*) at current global prices" checked={o.useUAtA}
        onToggle={() => set({ useUAtA: !o.useUAtA })} />
      {!o.useUAtA && (
        <>
          <label style={{ ...label, marginTop: 6 }}>Custom U̅: {o.customU.toFixed(1)}</label>
          <input type="range" min={2} max={80} step={1} value={o.customU}
            onChange={e => set({ customU: parseFloat(e.target.value) })} style={slider} />
        </>
      )}
      <Toggle label="Hicksian trace along U̅" checked={o.showTrace}
        onToggle={() => set({ showTrace: !o.showTrace })} />
    </div>
  );
}

function MarshallianPanel({ params, onChange }: Props) {
  const o = params.marshallian;
  const set = (patch: Partial<typeof o>) => onChange({ marshallian: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Marshallian</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['p1', 'income'] as const).map(v => (
          <button
            key={v}
            onClick={() => set({
              varyBy: v,
              min: v === 'p1' ? 0.4 : 30,
              max: v === 'p1' ? 2.5 : 200,
              currentValue: v === 'p1' ? 1 : 100,
            })}
            style={{
              flex: 1, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
              border: '1px solid #d1d5db',
              background: o.varyBy === v ? '#1e40af' : 'white',
              color: o.varyBy === v ? 'white' : '#111827',
              borderRadius: 4,
            }}
          >
            vary {v === 'p1' ? 'p₁' : 'income'}
          </button>
        ))}
      </div>
      <label style={label}>
        Current {o.varyBy === 'p1' ? 'p₁' : 'm'}: {o.currentValue.toFixed(2)}
      </label>
      <input type="range" min={o.min} max={o.max} step={o.varyBy === 'p1' ? 0.02 : 2}
        value={o.currentValue}
        onChange={e => set({ currentValue: parseFloat(e.target.value) })} style={slider} />
      <Toggle label="Trace on surface + floor" checked={o.showTrace}
        onToggle={() => set({ showTrace: !o.showTrace })} />
    </div>
  );
}

function OrdinalityPanel({ params, onChange }: Props) {
  const o = params.ordinality;
  const set = (patch: Partial<typeof o>) => onChange({ ordinality: { ...o, ...patch } });
  const transforms: { key: Transformation; label: string }[] = [
    { key: 'identity', label: 'f(U) = U' },
    { key: 'log', label: 'f(U) = log(U)' },
    { key: 'sqrt', label: 'f(U) = √U' },
    { key: 'square', label: 'f(U) = U²' },
    { key: 'affine', label: 'f(U) = 3U + 10' },
  ];
  return (
    <div style={section}>
      <div style={header}>Ordinality</div>
      {transforms.map(t => (
        <label key={t.key} style={{ display: 'block', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
          <input
            type="radio" checked={o.transformation === t.key}
            onChange={() => set({ transformation: t.key })}
            style={{ marginRight: 6 }}
          />
          {t.label}
        </label>
      ))}
      <Toggle label="Show contours at original-U levels" checked={o.showContours}
        onToggle={() => set({ showContours: !o.showContours })} />
      <div style={hint}>
        Floor projections of the contours should stay put as you switch f — that's
        the ordinal property. Only the hill's height and slope change.
      </div>
    </div>
  );
}

function EVCVPanel({ params, onChange }: Props) {
  const o = params.evcv;
  const set = (patch: Partial<typeof o>) => onChange({ evcv: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>EV / CV</div>
      <label style={label}>Price change t₁: {o.t1.toFixed(2)}</label>
      <input type="range" min={0} max={2} step={0.05} value={o.t1}
        onChange={e => set({ t1: parseFloat(e.target.value) })} style={slider} />
      <Toggle label="Pre-tax curtain (black)" checked={o.showPreTaxCurtain}
        onToggle={() => set({ showPreTaxCurtain: !o.showPreTaxCurtain })} />
      <Toggle label="Post-tax curtain (red)" checked={o.showPostTaxCurtain}
        onToggle={() => set({ showPostTaxCurtain: !o.showPostTaxCurtain })} />
      <Toggle label="EV curtain (blue, old slope, tangent to U₁)" checked={o.showEVCurtain}
        onToggle={() => set({ showEVCurtain: !o.showEVCurtain })} />
      <Toggle label="CV curtain (red dashed, new slope, tangent to U₀)" checked={o.showCVCurtain}
        onToggle={() => set({ showCVCurtain: !o.showCVCurtain })} />
      <Toggle label="Bundle A" checked={o.showBundleA}
        onToggle={() => set({ showBundleA: !o.showBundleA })} />
      <Toggle label="Bundle Ã" checked={o.showBundleTildeA}
        onToggle={() => set({ showBundleTildeA: !o.showBundleTildeA })} />
      <Toggle label="Income labels on axis" checked={o.showBrackets}
        onToggle={() => set({ showBrackets: !o.showBrackets })} />
    </div>
  );
}
