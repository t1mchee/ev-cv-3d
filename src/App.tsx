import { useState } from 'react';
import { MathSpan } from './Math';
import UtilitySurface from './components/UtilitySurface';
import Controls from './components/Controls';
import type { Params } from './types';
import { defaultParams } from './types';

export default function App() {
  const [params, setParams] = useState<Params>(defaultParams);
  const onChange = (patch: Partial<Params>) => setParams(prev => ({ ...prev, ...patch }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px 32px',
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Utility Surface</h1>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
          <MathSpan>
            {'Indifference curves as level sets of \\(U(x_1, x_2)\\). Rotate, zoom, hover.'}
          </MathSpan>
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 20,
          padding: 20,
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
          flex: 1,
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            padding: 12,
          }}
        >
          <UtilitySurface params={params} onChange={onChange} />
          <div style={{ fontSize: 12, color: '#6b7280', padding: '8px 12px 4px', lineHeight: 1.5 }}>
            <MathSpan>
              {'The coloured hill is \\(U(x_1, x_2)\\). Horizontal slices are indifference curves, '
                + 'the contours of that same hill. The red dot is the utility-maximising bundle '
                + 'on the budget plane; its projection on the floor is the standard '
                + '\\(\\mathbb{R}^2\\) optimum.'}
            </MathSpan>
          </div>
        </div>

        <aside
          style={{
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            position: 'sticky',
            top: 20,
            paddingRight: 4,
          }}
        >
          <Controls params={params} onChange={onChange} />
        </aside>
      </div>

      <footer style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
        <MathSpan>
          {'Companion to the \\(\\mathbb{R}^2\\) EV / CV / DWL visualisation.'}
        </MathSpan>
      </footer>
    </div>
  );
}
