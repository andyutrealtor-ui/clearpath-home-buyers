import React from 'react';
import { calcMAO, repairEstimate, REPAIR_LEVELS, money } from '../dealMath';

export default function MAOCalc({ deal, setDeal, setPage }) {
  const update = (k, v) => setDeal(d => ({ ...d, [k]: v }));
  const pct = deal.pct ?? 70;
  const fee = deal.fee ?? 10000;
  const repairs = Number(deal.repairs) || 0;
  const arv = Number(deal.arv) || 0;
  const asking = Number(deal.asking) || 0;
  const mao = calcMAO({ arv, repairs, fee, pct });

  const offerLow = mao ? Math.floor((mao * 0.95) / 500) * 500 : null;   // opening offer, rounded down to $500
  const buyerPrice = mao != null ? mao + fee : null;                     // what your cash buyer pays
  const buyerProfit = arv && buyerPrice != null ? arv - buyerPrice - repairs : null;
  const gap = mao != null && asking ? asking - mao : null;

  const applyRepair = (id) => {
    const est = repairEstimate(id, Number(deal.sqft));
    if (est != null) setDeal(d => ({ ...d, repairs: est, repairLevel: id }));
  };

  const toLOI = (price) => {
    setDeal(d => ({ ...d, offer: Math.round(price) }));
    setPage('loi');
  };

  const num = (k, label, placeholder, extra) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" value={deal[k] ?? ''} placeholder={placeholder} onChange={e => update(k, e.target.value === '' ? '' : Number(e.target.value))} />
      {extra}
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>MAO Calculator</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Max Allowable Offer = ARV × {pct}% − repairs − wholesale fee. Step 2 of 3.
        {deal.address && <> &nbsp;·&nbsp; <strong>{deal.address}{deal.city ? `, ${deal.city}` : ''}</strong></>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>💰 Numbers</h2></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {num('arv', 'ARV', '300000', !deal.arv && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: 6 }} onClick={() => setPage('arv')}>← Get ARV from comps</button>
              ))}
              {num('asking', 'Asking / list price', '389900')}
              {num('repairs', 'Repairs', '45000')}
              {num('fee', 'Wholesale fee', '10000')}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Rule % of ARV: {pct}%</label>
                <input type="range" min={60} max={80} step={1} value={pct} onChange={e => update('pct', Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--navy)' }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>70% is standard. Go lower for heavy rehabs or slow markets.</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>🔨 Quick repair estimate</h2></div>
            <div className="card-body">
              {Number(deal.sqft) > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {REPAIR_LEVELS.map(l => (
                    <button key={l.id} onClick={() => applyRepair(l.id)} style={{
                      padding: '8px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', textAlign: 'left',
                      borderColor: deal.repairLevel === l.id ? 'var(--navy)' : 'var(--gray-200)',
                      background: deal.repairLevel === l.id ? 'var(--navy)' : 'var(--white)',
                      color: deal.repairLevel === l.id ? 'var(--white)' : 'var(--text-secondary)', fontFamily: 'DM Sans', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 600 }}>{l.label} · ${l.perSqft}/sqft</div>
                      <div style={{ opacity: 0.75 }}>{money(repairEstimate(l.id, Number(deal.sqft)))} — {l.desc}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add the property's sqft in the ARV Tool to use quick estimates, or type repairs above.</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Ballpark only — replace with a contractor's number after the walkthrough.</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>MAO Breakdown</h2></div>
          <div className="card-body">
            {mao == null ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Enter an ARV to calculate.</div>
            ) : (
              <>
                {[
                  ['ARV', money(arv)],
                  [`× ${pct}%`, money(arv * pct / 100)],
                  ['− Repairs', money(-repairs).replace('$-', '−$')],
                  ['− Wholesale fee', money(-fee).replace('$-', '−$')],
                ].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Max Allowable Offer</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: mao > 0 ? 'var(--green)' : 'var(--red)' }}>{money(mao)}</span>
                </div>
                {mao > 0 && (
                  <div style={{ padding: 12, background: 'var(--gray-100)', borderRadius: 8, fontSize: 13, margin: '8px 0' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Offer range (open low, walk away above MAO)</div>
                    <div style={{ fontWeight: 600 }}>{money(offerLow)} – {money(mao)}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>Your cash buyer pays {money(buyerPrice)} → their profit ≈ {money(buyerProfit)} after repairs</div>
                  </div>
                )}
                {gap != null && (
                  <div style={{ padding: 12, borderRadius: 8, fontSize: 13, background: gap > 0 ? '#FEE2E2' : '#D1FAE5', color: gap > 0 ? '#991B1B' : '#065F46' }}>
                    {gap > 0
                      ? <>Asking {money(asking)} is <strong>{money(gap)} above</strong> your MAO ({Math.round(gap / asking * 100)}% cut needed). Negotiate down or pass.</>
                      : <>Asking {money(asking)} is <strong>{money(-gap)} below</strong> your MAO. ✅ The deal works at asking.</>}
                  </div>
                )}
                {mao > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => toLOI(offerLow)}>LOI at {money(offerLow)}</button>
                    <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => toLOI(Math.min(mao, asking || mao))}>
                      LOI at {money(Math.min(mao, asking || mao))} →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
