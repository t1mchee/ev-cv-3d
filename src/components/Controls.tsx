import { MathSpan, Tex } from '../Math';
import type { Params, UtilityType, Mode, Transformation } from '../types';

interface Props {
  params: Params;
  onChange: (patch: Partial<Params>) => void;
}

// Each mode's label and hint as a `node` so it can contain inline TeX.
const MODES: { key: Mode; label: string; hint: React.ReactNode }[] = [
  { key: 'surface', label: '1. Surface', hint: 'The utility hill plus the indifference-curve family.' },
  {
    key: 'slutsky', label: '2. Slutsky',
    hint: (
      <MathSpan>
        {'Substitution is a slide along a contour of \\(U_0\\); income is a drop to the \\(U_1\\) contour.'}
      </MathSpan>
    ),
  },
  {
    key: 'hicksian', label: '3. Hicksian',
    hint: (
      <MathSpan>
        {'Hold \\(\\bar U\\) fixed; watch the bundle slide along the contour as \\(p_1\\) varies.'}
      </MathSpan>
    ),
  },
  {
    key: 'marshallian', label: '4. Marshallian',
    hint: (
      <MathSpan>
        {'\\(A^\\star\\) traces a trajectory on the surface as \\(p_1\\) or \\(m\\) varies.'}
      </MathSpan>
    ),
  },
  {
    key: 'ordinality', label: '5. Ordinality',
    hint: (
      <MathSpan>
        {'Monotonic transformations \\(f(U)\\) reshape the hill but leave the contours unchanged.'}
      </MathSpan>
    ),
  },
  {
    key: 'evcv', label: '6. EV / CV',
    hint: (
      <MathSpan>
        {'Four parallel budget curtains; income-axis gaps between them equal \\(EV\\) and \\(CV\\).'}
      </MathSpan>
    ),
  },
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
      {/* View controls */}
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
          2D plus hide-surface gives you the familiar textbook picture;
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
            {t === 'cobb-douglas'
              ? <><Tex>{'U = x_1^{\\alpha} \\cdot x_2^{1-\\alpha}'}</Tex> (Cobb-Douglas)</>
              : <><Tex>{'U = (\\alpha x_1^{\\rho} + (1-\\alpha) x_2^{\\rho})^{1/\\rho}'}</Tex> (CES)</>}
          </label>
        ))}
        <label style={{ ...label, marginTop: 10 }}>
          <Tex>{'\\alpha'}</Tex>: {params.alpha.toFixed(2)}
        </label>
        <input
          type="range" min={0.1} max={0.9} step={0.05} value={params.alpha}
          onChange={e => onChange({ alpha: parseFloat(e.target.value) })}
          style={slider}
        />
        {params.utilityType === 'ces' && (
          <>
            <label style={{ ...label, marginTop: 6 }}>
              <Tex>{'\\rho'}</Tex>: {params.rho.toFixed(2)}
            </label>
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
        <label style={label}>Income <Tex>{'m'}</Tex>: {params.income.toFixed(0)}</label>
        <input type="range" min={30} max={200} step={5} value={params.income}
          onChange={e => onChange({ income: parseFloat(e.target.value) })} style={slider} />
        <label style={{ ...label, marginTop: 8 }}>
          <Tex>{'p_1'}</Tex>: {params.p1.toFixed(2)}
        </label>
        <input type="range" min={0.3} max={3} step={0.05} value={params.p1}
          onChange={e => onChange({ p1: parseFloat(e.target.value) })} style={slider} />
        <label style={{ ...label, marginTop: 8 }}>
          <Tex>{'p_2'}</Tex>: {params.p2.toFixed(2)}
        </label>
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
        <input type="range" min={10} max={120} step={2} value={params.gridSize}
          onChange={e => onChange({ gridSize: parseInt(e.target.value, 10) })} style={slider} />
        <div style={hint}>
          Low values make the surface facets visible; 60+ looks perfectly smooth.
        </div>
      </div>
    </div>
  );
}

// Typed toggle list helper
function Toggle({
  labelNode, checked, onToggle,
}: { labelNode: React.ReactNode; checked: boolean; onToggle: () => void }) {
  return (
    <label style={checkboxRow}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span style={{ marginLeft: 8 }}>{labelNode}</span>
    </label>
  );
}

function SurfacePanel({ params, onChange }: Props) {
  const o = params.surface;
  const set = (patch: Partial<typeof o>) => onChange({ surface: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Surface mode</div>
      <Toggle labelNode="Floor contour projection"
        checked={o.showContourFloor}
        onToggle={() => set({ showContourFloor: !o.showContourFloor })} />
      <Toggle labelNode="Indifference curves on surface"
        checked={o.showIsolines}
        onToggle={() => set({ showIsolines: !o.showIsolines })} />
      <Toggle labelNode="Budget plane (curtain)"
        checked={o.showBudgetPlane}
        onToggle={() => set({ showBudgetPlane: !o.showBudgetPlane })} />
      <Toggle labelNode={<>Optimal bundle <Tex>{'A^\\star'}</Tex> and the IC through <Tex>{'A^\\star'}</Tex></>}
        checked={o.showOptimalBundle}
        onToggle={() => set({ showOptimalBundle: !o.showOptimalBundle })} />
      <label style={{ ...label, marginTop: 8 }}>IC count: {o.isolineCount}</label>
      <input type="range" min={0} max={20} step={1} value={o.isolineCount}
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
      <label style={label}>
        Price change <Tex>{'t_1'}</Tex>: {o.t1.toFixed(2)}
      </label>
      <input type="range" min={0} max={2} step={0.05} value={o.t1}
        onChange={e => set({ t1: parseFloat(e.target.value) })} style={slider} />
      <Toggle labelNode={<>Pre-tax IC <Tex>{'U_0'}</Tex></>}
        checked={o.showPreTaxIC} onToggle={() => set({ showPreTaxIC: !o.showPreTaxIC })} />
      <Toggle labelNode={<>Post-tax IC <Tex>{'U_1'}</Tex></>}
        checked={o.showPostTaxIC} onToggle={() => set({ showPostTaxIC: !o.showPostTaxIC })} />
      <Toggle labelNode="Pre-tax budget"
        checked={o.showPreTaxBudget} onToggle={() => set({ showPreTaxBudget: !o.showPreTaxBudget })} />
      <Toggle labelNode="Post-tax budget"
        checked={o.showPostTaxBudget} onToggle={() => set({ showPostTaxBudget: !o.showPostTaxBudget })} />
      <Toggle labelNode={<>Compensated budget (new slope, tangent to <Tex>{'U_0'}</Tex>)</>}
        checked={o.showHicksianBudget} onToggle={() => set({ showHicksianBudget: !o.showHicksianBudget })} />
      <Toggle labelNode={<>Bundles <Tex>{'A'}</Tex> / <Tex>{'H'}</Tex> / <Tex>{'\\tilde A'}</Tex></>}
        checked={o.showBundles} onToggle={() => set({ showBundles: !o.showBundles })} />
      <Toggle labelNode={<>Substitution arrow (slide along <Tex>{'U_0'}</Tex>)</>}
        checked={o.showSubArrow} onToggle={() => set({ showSubArrow: !o.showSubArrow })} />
      <Toggle labelNode={<>Income arrow (drop to <Tex>{'U_1'}</Tex>)</>}
        checked={o.showIncArrow} onToggle={() => set({ showIncArrow: !o.showIncArrow })} />
    </div>
  );
}

function HicksianPanel({ params, onChange }: Props) {
  const o = params.hicksian;
  const set = (patch: Partial<typeof o>) => onChange({ hicksian: { ...o, ...patch } });
  return (
    <div style={section}>
      <div style={header}>Hicksian</div>
      <label style={label}>
        Current <Tex>{'p_1'}</Tex>: {o.currentP1.toFixed(2)}
      </label>
      <input type="range" min={o.pMin} max={o.pMax} step={0.02} value={o.currentP1}
        onChange={e => set({ currentP1: parseFloat(e.target.value) })} style={slider} />
      <label style={{ ...label, marginTop: 8 }}>
        <Tex>{'p_1'}</Tex> range: {o.pMin.toFixed(2)} to {o.pMax.toFixed(2)}
      </label>
      <Toggle labelNode={<>Use <Tex>{'U = U(A^\\star)'}</Tex> at current global prices</>}
        checked={o.useUAtA} onToggle={() => set({ useUAtA: !o.useUAtA })} />
      {!o.useUAtA && (
        <>
          <label style={{ ...label, marginTop: 6 }}>
            Custom <Tex>{'\\bar U'}</Tex>: {o.customU.toFixed(1)}
          </label>
          <input type="range" min={2} max={80} step={1} value={o.customU}
            onChange={e => set({ customU: parseFloat(e.target.value) })} style={slider} />
        </>
      )}
      <Toggle labelNode={<>Hicksian trace along <Tex>{'\\bar U'}</Tex></>}
        checked={o.showTrace} onToggle={() => set({ showTrace: !o.showTrace })} />
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
        Current <Tex>{o.varyBy === 'p1' ? 'p_1' : 'm'}</Tex>: {o.currentValue.toFixed(2)}
      </label>
      <input type="range" min={o.min} max={o.max} step={o.varyBy === 'p1' ? 0.02 : 2}
        value={o.currentValue}
        onChange={e => set({ currentValue: parseFloat(e.target.value) })} style={slider} />
      <Toggle labelNode="Trace on surface plus floor"
        checked={o.showTrace} onToggle={() => set({ showTrace: !o.showTrace })} />
    </div>
  );
}

function OrdinalityPanel({ params, onChange }: Props) {
  const o = params.ordinality;
  const set = (patch: Partial<typeof o>) => onChange({ ordinality: { ...o, ...patch } });
  const transforms: { key: Transformation; tex: string }[] = [
    { key: 'identity', tex: 'f(U) = U' },
    { key: 'log', tex: 'f(U) = \\ln(U + 1)' },
    { key: 'sqrt', tex: 'f(U) = \\sqrt{U}' },
    { key: 'square', tex: 'f(U) = U^2' },
    { key: 'affine', tex: 'f(U) = 3U + 10' },
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
          <Tex>{t.tex}</Tex>
        </label>
      ))}
      <Toggle labelNode="Show contours at original-U levels"
        checked={o.showContours} onToggle={() => set({ showContours: !o.showContours })} />
      <div style={hint}>
        <MathSpan>
          {'Floor projections of the contours should stay put as you switch \\(f\\). '
            + 'That is the ordinal property: only the height and slope of the hill change.'}
        </MathSpan>
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
      <label style={label}>
        Price change <Tex>{'t_1'}</Tex>: {o.t1.toFixed(2)}
      </label>
      <input type="range" min={0} max={2} step={0.05} value={o.t1}
        onChange={e => set({ t1: parseFloat(e.target.value) })} style={slider} />
      <Toggle labelNode="Pre-tax curtain (black)"
        checked={o.showPreTaxCurtain} onToggle={() => set({ showPreTaxCurtain: !o.showPreTaxCurtain })} />
      <Toggle labelNode="Post-tax curtain (red)"
        checked={o.showPostTaxCurtain} onToggle={() => set({ showPostTaxCurtain: !o.showPostTaxCurtain })} />
      <Toggle labelNode={<>EV curtain (blue, old slope, tangent to <Tex>{'U_1'}</Tex>)</>}
        checked={o.showEVCurtain} onToggle={() => set({ showEVCurtain: !o.showEVCurtain })} />
      <Toggle labelNode={<>CV curtain (red dashed, new slope, tangent to <Tex>{'U_0'}</Tex>)</>}
        checked={o.showCVCurtain} onToggle={() => set({ showCVCurtain: !o.showCVCurtain })} />
      <Toggle labelNode={<>Bundle <Tex>{'A'}</Tex></>}
        checked={o.showBundleA} onToggle={() => set({ showBundleA: !o.showBundleA })} />
      <Toggle labelNode={<>Bundle <Tex>{'\\tilde A'}</Tex></>}
        checked={o.showBundleTildeA} onToggle={() => set({ showBundleTildeA: !o.showBundleTildeA })} />
      <Toggle labelNode="Income labels on axis"
        checked={o.showBrackets} onToggle={() => set({ showBrackets: !o.showBrackets })} />
    </div>
  );
}
