import type { Params, UtilityType } from '../types';

interface Props {
  params: Params;
  onChange: (patch: Partial<Params>) => void;
}

const section: React.CSSProperties = {
  background: 'white',
  padding: '14px 16px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  marginBottom: 12,
};

const header: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#111827',
  marginBottom: 4,
  display: 'block',
};

const slider: React.CSSProperties = { width: '100%', cursor: 'pointer' };

const checkboxRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 13,
  padding: '4px 0',
  cursor: 'pointer',
};

export default function Controls({ params, onChange }: Props) {
  return (
    <div>
      <div style={section}>
        <div style={header}>Utility function</div>
        {(['cobb-douglas', 'ces'] as UtilityType[]).map(t => (
          <label key={t} style={{ display: 'block', fontSize: 13, marginBottom: 4, cursor: 'pointer' }}>
            <input
              type="radio"
              checked={params.utilityType === t}
              onChange={() => onChange({ utilityType: t })}
            />{' '}
            {t === 'cobb-douglas' ? 'Cobb-Douglas: U = x₁^α · x₂^(1−α)' : 'CES: U = (α·x₁^ρ + (1−α)·x₂^ρ)^(1/ρ)'}
          </label>
        ))}
      </div>

      <div style={section}>
        <div style={header}>Preferences</div>
        <label style={label}>α: {params.alpha.toFixed(2)}</label>
        <input
          type="range" min={0.1} max={0.9} step={0.05}
          value={params.alpha}
          onChange={e => onChange({ alpha: parseFloat(e.target.value) })}
          style={slider}
        />
        {params.utilityType === 'ces' && (
          <>
            <label style={{ ...label, marginTop: 10 }}>ρ: {params.rho.toFixed(2)}</label>
            <input
              type="range" min={-2} max={0.9} step={0.1}
              value={params.rho}
              onChange={e => onChange({ rho: parseFloat(e.target.value) })}
              style={slider}
            />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
              ρ → 1: perfect substitutes · ρ → 0: Cobb-Douglas · ρ → −∞: perfect complements
            </div>
          </>
        )}
      </div>

      <div style={section}>
        <div style={header}>Budget</div>
        <label style={label}>Income m: {params.income.toFixed(0)}</label>
        <input
          type="range" min={30} max={200} step={5}
          value={params.income}
          onChange={e => onChange({ income: parseFloat(e.target.value) })}
          style={slider}
        />
        <label style={{ ...label, marginTop: 10 }}>Price p₁: {params.p1.toFixed(2)}</label>
        <input
          type="range" min={0.3} max={3} step={0.05}
          value={params.p1}
          onChange={e => onChange({ p1: parseFloat(e.target.value) })}
          style={slider}
        />
        <label style={{ ...label, marginTop: 10 }}>Price p₂: {params.p2.toFixed(2)}</label>
        <input
          type="range" min={0.3} max={3} step={0.05}
          value={params.p2}
          onChange={e => onChange({ p2: parseFloat(e.target.value) })}
          style={slider}
        />
      </div>

      <div style={section}>
        <div style={header}>Display</div>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={params.showContourFloor}
            onChange={e => onChange({ showContourFloor: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Contours projected onto floor</span>
        </label>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={params.showIsolines}
            onChange={e => onChange({ showIsolines: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Indifference curves on surface</span>
        </label>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={params.showBudgetPlane}
            onChange={e => onChange({ showBudgetPlane: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Budget plane (vertical curtain)</span>
        </label>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={params.showOptimalBundle}
            onChange={e => onChange({ showOptimalBundle: e.target.checked })}
          />
          <span style={{ marginLeft: 8 }}>Optimal bundle A*</span>
        </label>
        <label style={{ ...label, marginTop: 10 }}>Indifference-curve count: {params.isolineCount}</label>
        <input
          type="range" min={3} max={20} step={1}
          value={params.isolineCount}
          onChange={e => onChange({ isolineCount: parseInt(e.target.value, 10) })}
          style={slider}
        />
        <label style={{ ...label, marginTop: 10 }}>Grid resolution: {params.gridSize}</label>
        <input
          type="range" min={30} max={120} step={5}
          value={params.gridSize}
          onChange={e => onChange({ gridSize: parseInt(e.target.value, 10) })}
          style={slider}
        />
      </div>
    </div>
  );
}
