import React, { useState } from 'react';

const CONDITIONS = [
  { label: 'Distressed', adj: -0.15, desc: 'Major repairs needed, uninhabitable' },
  { label: 'Fair', adj: -0.07, desc: 'Functional but dated, needs work' },
  { label: 'Good', adj: 0, desc: 'Average condition, move-in ready' },
  { label: 'Updated', adj: 0.05, desc: 'Recently renovated, modern finishes' },
];

export default function ARVTool() {
  const [zip, setZip] = useState('');
  const [propType, setPropType] = useState('Single Family');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [condition, setCondition] = useState('Good');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runAnalysis = async () => {
    if (!zip) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: localStorage.getItem('clearpath_settings') ? JSON.parse(localStorage.getItem('clearpath_settings')).apiKey : '',
          useSearch: true,
          prompt: `You are a real estate comp analyst. Search for recently sold homes in ZIP code ${zip} to estimate ARV.

Search for: recent home sales in ZIP ${zip}, median home prices ${zip}, real estate market ${zip} 2024 2025

Property details to match comps to:
- ZIP: ${zip}
- Type: ${propType}
- Beds: ${beds || 'any'}
- Baths: ${baths || 'any'}  
- Sqft: ${sqft || 'any'}

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "zip": "${zip}",
  "city_state": "City, ST",
  "median_price": 185000,
  "avg_price": 192000,
  "price_per_sqft": 115,
  "total_sold_12mo": 142,
  "avg_dom": 28,
  "market_trend": "Appreciating",
  "trend_pct": 4.2,
  "comps": [
    {"address": "123 Main St", "beds": 3, "baths": 2, "sqft": 1450, "sold_price": 178000, "price_sqft": 123, "sold_date": "2025-02-15", "dom": 22},
    {"address": "456 Oak Ave", "beds": 3, "baths": 2, "sqft": 1380, "sold_price": 165000, "price_sqft": 120, "sold_date": "2025-01-08", "dom": 35},
    {"address": "789 Pine Rd", "beds": 4, "baths": 2, "sqft": 1820, "sold_price": 215000, "price_sqft": 118, "sold_date": "2024-12-20", "dom": 18}
  ],
  "investor_activity": "High",
  "foreclosure_rate": "Above Average",
  "quarterly_trend": [
    {"quarter": "Q2 2024", "avg_price": 180000},
    {"quarter": "Q3 2024", "avg_price": 184000},
    {"quarter": "Q4 2024", "avg_price": 188000},
    {"quarter": "Q1 2025", "avg_price": 192000}
  ]
}`
        })
      });
      const json = await res.json();
      const text = json.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(clean);
      setResult(data);
    } catch (e) {
      setResult({ error: 'Could not load market data. Check ZIP code and try again.' });
    }
    setLoading(false);
  };

  const getARV = () => {
    if (!result || result.error) return null;
    const base = result.avg_price;
    const cond = CONDITIONS.find(c => c.label === condition);
    const adj = cond?.adj || 0;
    const sqftAdj = sqft ? (parseInt(sqft) - 1500) * result.price_per_sqft * 0.1 : 0;
    return {
      low: Math.round(base * (1 + adj) * 0.93 + sqftAdj),
      mid: Math.round(base * (1 + adj) + sqftAdj),
      high: Math.round(base * (1 + adj) * 1.07 + sqftAdj),
    };
  };

  const arv = getARV();

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>AI ARV Tool</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Pull last 12 months of sold comps by ZIP code</p>

      {/* Search inputs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">ZIP Code *</label>
              <input className="form-input" placeholder="e.g. 77016" value={zip} onChange={e => setZip(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAnalysis()} />
            </div>
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-select" value={propType} onChange={e => setPropType(e.target.value)}>
                {['Single Family','Multi-Family','Condo','Townhouse'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Beds</label>
              <input className="form-input" placeholder="3" value={beds} onChange={e => setBeds(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Baths</label>
              <input className="form-input" placeholder="2" value={baths} onChange={e => setBaths(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sqft</label>
              <input className="form-input" placeholder="1500" value={sqft} onChange={e => setSqft(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={!zip || loading}>
            {loading ? '🔍 Searching comps...' : '🔍 Run ARV Analysis'}
          </button>
        </div>
      </div>

      {result?.error && (
        <div style={{ padding: 16, background: '#FEE2E2', borderRadius: 10, color: '#DC2626', marginBottom: 16 }}>{result.error}</div>
      )}

      {result && !result.error && (
        <>
          {/* Market Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Median Price', value: `$${result.median_price?.toLocaleString()}` },
              { label: 'Avg Price', value: `$${result.avg_price?.toLocaleString()}` },
              { label: 'Price / Sqft', value: `$${result.price_per_sqft}` },
              { label: 'Sold (12mo)', value: result.total_sold_12mo },
              { label: 'Avg DOM', value: `${result.avg_dom} days` },
              { label: 'Market Trend', value: result.market_trend, sub: `+${result.trend_pct}%` },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
                {s.sub && <div className="stat-sub" style={{ color: 'var(--green)' }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Condition & ARV */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>ARV Estimator</h2></div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Property Condition</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CONDITIONS.map(c => (
                    <button key={c.label} onClick={() => setCondition(c.label)} style={{
                      padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                      borderColor: condition === c.label ? 'var(--navy)' : 'var(--gray-200)',
                      background: condition === c.label ? 'var(--navy)' : 'var(--white)',
                      color: condition === c.label ? 'var(--white)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans'
                    }}>
                      <div style={{ fontWeight: 500 }}>{c.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{c.adj > 0 ? '+' : ''}{(c.adj * 100).toFixed(0)}%</div>
                    </button>
                  ))}
                </div>
              </div>
              {arv && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Low ARV', value: arv.low, color: 'var(--red)' },
                    { label: 'Mid ARV', value: arv.mid, color: 'var(--navy)', highlight: true },
                    { label: 'High ARV', value: arv.high, color: 'var(--green)' },
                  ].map((a, i) => (
                    <div key={i} style={{
                      padding: 16, borderRadius: 10, textAlign: 'center',
                      background: a.highlight ? 'var(--navy)' : 'var(--gray-100)',
                      border: a.highlight ? 'none' : '1px solid var(--gray-200)'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: a.highlight ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{a.label}</div>
                      <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: a.highlight ? 'var(--gold)' : a.color }}>${a.value?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comps Table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Comparable Sales</h2></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Address</th><th>Bed</th><th>Bath</th><th>Sqft</th><th>Sold Price</th><th>$/Sqft</th><th>Sold Date</th><th>DOM</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comps?.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{c.address}</td>
                      <td>{c.beds}</td><td>{c.baths}</td>
                      <td>{c.sqft?.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>${c.sold_price?.toLocaleString()}</td>
                      <td>${c.price_sqft}</td>
                      <td>{c.sold_date}</td>
                      <td>{c.dom}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Neighborhood */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-label">Investor Activity</div>
              <div className="stat-value" style={{ fontSize: 18, color: result.investor_activity === 'High' ? 'var(--green)' : 'var(--amber)' }}>{result.investor_activity}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Foreclosure Rate</div>
              <div className="stat-value" style={{ fontSize: 18, color: result.foreclosure_rate?.includes('Above') ? 'var(--green)' : 'var(--text-muted)' }}>{result.foreclosure_rate}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
