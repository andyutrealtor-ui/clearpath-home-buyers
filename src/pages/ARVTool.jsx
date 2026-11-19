import React from 'react';
import { emptyComp, arvFromComps, compWarnings, money } from '../dealMath';

const COMP_CONDITIONS = [
  { id: 'inferior', label: 'Worse', hint: 'Comp was in worse shape than the subject after repairs' },
  { id: 'similar', label: 'Similar', hint: 'Comp is like the subject after repairs' },
  { id: 'superior', label: 'Better', hint: 'Comp was nicer (luxury reno, upgrades, pool…)' },
];

export default function ARVTool({ deal, setDeal, setPage }) {
  const update = (k, v) => setDeal(d => ({ ...d, [k]: v }));
  const comps = deal.comps?.length ? deal.comps : [emptyComp(), emptyComp(), emptyComp()];
  const setComps = (fn) => setDeal(d => ({ ...d, comps: fn(d.comps?.length ? d.comps : [emptyComp(), emptyComp(), emptyComp()]) }));
  const updateComp = (i, k, v) => setComps(cs => cs.map((c, j) => j === i ? { ...c, [k]: v } : c));

  const result = arvFromComps(comps, Number(deal.sqft));
  const warnings = compWarnings(comps, Number(deal.sqft));

  const useInMAO = () => {
    setDeal(d => ({ ...d, arv: result.mid }));
    setPage('mao');
  };

  const field = (k, label, props = {}) => (
    <div className="form-group" style={props.span ? { gridColumn: `span ${props.span}` } : undefined}>
      <label className="form-label">{label}</label>
      <input className="form-input" value={deal[k] ?? ''} onChange={e => update(k, e.target.value)} placeholder={props.placeholder} type={props.type || 'text'} />
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ARV Tool</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enter 3–6 sold comps from Zillow or Redfin (sold in the last 6 months, within ~1 mile, similar size). Step 1 of 3: ARV → MAO → LOI.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { if (confirm('Clear this deal and start a new one?')) setDeal({}); }}>＋ New deal</button>
      </div>

      {/* Subject property */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>🏠 Subject Property</h2></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {field('address', 'Address', { span: 2, placeholder: '4775 W 4895 S' })}
          {field('city', 'City', { placeholder: 'Salt Lake City' })}
          {field('state', 'State', { placeholder: 'UT' })}
          {field('zip', 'ZIP', { placeholder: '84118' })}
          {field('beds', 'Beds', { type: 'number', placeholder: '3' })}
          {field('baths', 'Baths', { type: 'number', placeholder: '2' })}
          {field('sqft', 'Sqft *', { type: 'number', placeholder: '1500' })}
          {field('asking', 'Asking / list price', { type: 'number', placeholder: '389900' })}
        </div>
      </div>

      {/* Comps */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>📊 Sold Comps</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setComps(cs => [...cs, emptyComp()])} disabled={comps.length >= 8}>＋ Add comp</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Address</th><th>Sqft</th><th>Bd/Ba</th><th>Sold price</th><th>Sold date</th><th>Condition vs. subject</th><th>$/sqft</th><th>Adjusted value</th><th></th></tr>
            </thead>
            <tbody>
              {comps.map((c, i) => {
                const r = result.rows[i];
                return (
                  <tr key={i}>
                    <td><input className="form-input" style={{ minWidth: 150 }} value={c.address} onChange={e => updateComp(i, 'address', e.target.value)} placeholder="123 Main St" /></td>
                    <td><input className="form-input" style={{ width: 80 }} type="number" value={c.sqft} onChange={e => updateComp(i, 'sqft', e.target.value)} /></td>
                    <td><input className="form-input" style={{ width: 70 }} value={c.bdba} onChange={e => updateComp(i, 'bdba', e.target.value)} placeholder="3/2" /></td>
                    <td><input className="form-input" style={{ width: 110 }} type="number" value={c.price} onChange={e => updateComp(i, 'price', e.target.value)} /></td>
                    <td><input className="form-input" style={{ width: 140 }} type="date" value={c.date} onChange={e => updateComp(i, 'date', e.target.value)} /></td>
                    <td>
                      <select className="form-select" value={c.condition} onChange={e => updateComp(i, 'condition', e.target.value)} title={COMP_CONDITIONS.find(x => x.id === c.condition)?.hint}>
                        {COMP_CONDITIONS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r?.ppsf ? money(r.ppsf) : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r?.adjusted ? money(r.adjusted) : '—'}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setComps(cs => cs.filter((_, j) => j !== i))} title="Remove comp">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
          Adjusted value = comp's $/sqft × your sqft, then +10% if the comp was in worse shape or −10% if it was nicer. ARV assumes the subject is fully repaired.
        </div>
      </div>

      {warnings.length > 0 && (
        <div style={{ padding: 14, background: '#FEF3C7', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400E', border: '1px solid #FDE68A' }}>
          {warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}

      {/* Result */}
      {result.count >= 1 && result.mid ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>After-Repair Value ({result.count} comp{result.count > 1 ? 's' : ''})</h2></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Low ARV', value: result.low, color: 'var(--red)' },
                { label: 'ARV (median)', value: result.mid, color: 'var(--gold)', highlight: true },
                { label: 'High ARV', value: result.high, color: 'var(--green)' },
                { label: 'Avg adjusted $/sqft', value: result.avgPpsf, color: 'var(--navy)' },
              ].map((a, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, textAlign: 'center', background: a.highlight ? 'var(--navy)' : 'var(--gray-100)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: a.highlight ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{a.label}</div>
                  <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: a.color }}>{money(a.value)}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={useInMAO}>
              Use {money(result.mid)} ARV → MAO Calculator
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          Enter the subject's sqft and at least one comp (sqft + sold price) to see the ARV. Three or more comps give a reliable number.
        </div>
      )}
    </div>
  );
}
