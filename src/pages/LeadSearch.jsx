import React, { useState } from 'react';

const SEARCH_TYPES = [
  { id: 'pricecut', label: 'Price-Cut Window', icon: '⏳', color: '#0EA5E9', bg: '#E0F2FE', desc: '50–59 days on market — right before the price-cut talk' },
  { id: 'stale', label: 'Stale Listings', icon: '📅', color: '#F59E0B', bg: '#FEF3C7', desc: '90+ days on market, or any price reduction' },
  { id: 'preforeclosure', label: 'Foreclosure / Short Sale', icon: '🏚️', color: '#EF4444', bg: '#FEE2E2', desc: 'Listed as foreclosure, bank-owned or short sale' },
];

const STATES = ['UT', 'TX', 'CO', 'AZ'];
const STATE_INFO = {
  TX: { name: 'Texas', city: 'Houston' },
  UT: { name: 'Utah', city: 'Salt Lake City' },
  CO: { name: 'Colorado', city: 'Denver' },
  AZ: { name: 'Arizona', city: 'Phoenix' },
};
const MAX_PER_STATE = 25;
const MAX_PRICE = 400000; // cash-offer ceiling

// 50–59 days on market: the listing is about to hit the usual 60-day price-cut conversation.
export const inPriceCutWindow = (lead) => {
  const d = Number(lead?.days_on_market);
  return lead?.days_on_market != null && lead?.days_on_market !== '' && d >= 50 && d <= 59;
};

const DISTRESS_TYPES = /foreclos|short\s*sale|bank|reo|auction/i;

// Price changes for the current listing period, from RentCast's history (keyed by date).
export function priceHistory(listing) {
  const entries = Object.entries(listing?.history || {})
    .map(([date, e]) => ({ date, ...e }))
    .filter(e => !listing.listedDate || !e.listedDate || e.listedDate === listing.listedDate)
    .filter(e => Number.isFinite(e.price))
    .sort((a, b) => a.date.localeCompare(b.date));
  const prices = entries.map(e => e.price);
  if (Number.isFinite(listing?.price)) prices.push(listing.price);
  let drops = 0;
  for (let i = 1; i < prices.length; i++) if (prices[i] < prices[i - 1]) drops++;
  const original = prices.length ? prices[0] : null;
  return { original, drops, cutPct: original && listing.price < original ? (original - listing.price) / original : 0 };
}

export function daysOnMarket(listing) {
  if (Number.isFinite(listing?.daysOnMarket)) return listing.daysOnMarket;
  if (!listing?.listedDate) return null;
  return Math.floor((Date.now() - new Date(listing.listedDate).getTime()) / 86400000);
}

// Same rubric as the daily HubSpot task: start at 5, add for time on market, cuts and distress.
export function motivationScore(dom, ph, distressed) {
  let s = 5;
  if (dom >= 90) s += 2; else if (dom >= 50) s += 1;
  s += Math.min(ph.drops, 2);
  if (ph.cutPct >= 0.10) s += 1;
  if (distressed) s += 1;
  return Math.min(10, s);
}

export function categorize(listing) {
  const dom = daysOnMarket(listing);
  const ph = priceHistory(listing);
  const distressed = DISTRESS_TYPES.test(listing?.listingType || '');
  let type = null;
  if (distressed) type = 'preforeclosure';
  else if (dom != null && dom >= 50 && dom <= 59) type = 'pricecut';
  else if ((dom != null && dom >= 90) || ph.drops > 0) type = 'stale';
  return { type, dom, ph, distressed };
}

const money = (n) => Number.isFinite(n) ? '$' + n.toLocaleString() : '?';

export default function LeadSearch({ leads, setLeads, settings }) {
  const [selectedTypes, setSelectedTypes] = useState(['pricecut', 'stale', 'preforeclosure']);
  const [selectedStates, setSelectedStates] = useState(settings?.activeStates || ['TX', 'UT', 'CO', 'AZ']);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);
  const [windowOnly, setWindowOnly] = useState(false);

  // RentCast's key lives on the server (Vercel env var), so no browser API key is needed here.

  const toggleType = (id) => setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleState = (s) => setSelectedStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const addLog = (msg) => setLog(p => [...p, { msg, time: new Date().toLocaleTimeString() }]);

  const runSearch = async () => {
    if (!selectedTypes.length) { alert('Select at least one search type.'); return; }
    if (!selectedStates.length) { alert('Select at least one state.'); return; }

    setRunning(true); setResults([]); setLog([]); setDone(false);
    const allResults = [];

    // One RentCast request per state: listings 50–59 days on market (a 50+ query overflows the 500 cap in big metros).
    for (const state of selectedStates) {
      const { city } = STATE_INFO[state];
      addLog(`🔍 Pulling active listings in ${city}, ${state} from RentCast...`);
      try {
        const res = await fetch('/api/rentcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, state, daysOld: '50:59', price: `*:${MAX_PRICE}`, limit: 500 }),
        });
        const json = await res.json();
        if (!res.ok || json.error) { addLog(`❌ RentCast error: ${json.error || res.status}`); continue; }

        const counts = { pricecut: 0, stale: 0, preforeclosure: 0 };
        const found = [];
        for (const l of json.listings || []) {
          const c = categorize(l);
          if (!c.type || !selectedTypes.includes(c.type)) continue;
          counts[c.type]++;
          const typeName = SEARCH_TYPES.find(t => t.id === c.type).label;
          const agent = l.listingAgent || {};
          const office = l.listingOffice || {};
          const address = l.formattedAddress || [l.addressLine1, l.city, l.state, l.zipCode].filter(Boolean).join(', ');
          const cut = c.ph.original && l.price < c.ph.original
            ? `${c.ph.drops || 1} price drop${c.ph.drops > 1 ? 's' : ''}: ${money(c.ph.original)} → ${money(l.price)} (−${(c.ph.cutPct * 100).toFixed(1)}%)`
            : 'No price drops';
          found.push({
            id: l.id || Date.now() + Math.random(),
            rentcast_id: l.id || '',
            property_address: l.addressLine1 || address,
            city: l.city || city, state: l.state || state, zip: l.zipCode || '',
            asking_price: Number.isFinite(l.price) ? l.price : null,
            days_on_market: c.dom,
            price_drops: c.ph.drops,
            original_price: c.ph.original,
            listed_date: l.listedDate || '',
            listing_type: l.listingType || '',
            mls_number: l.mlsNumber || '', mls_name: l.mlsName || '',
            listing_url: `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`,
            source_site: 'Zillow search',
            listing_agent_name: agent.name || '',
            listing_agent_brokerage: office.name || '',
            listing_agent_phone: agent.phone || office.phone || '',
            listing_agent_email: agent.email || '',
            keywords: c.distressed && l.listingType ? [l.listingType] : [],
            urgency_score: motivationScore(c.dom ?? 0, c.ph, c.distressed),
            seller_summary: `${l.propertyType || 'Home'}${l.bedrooms ? `, ${l.bedrooms} bd` : ''}${l.bathrooms ? ` / ${l.bathrooms} ba` : ''}${l.squareFootage ? `, ${l.squareFootage.toLocaleString()} sqft` : ''}. ${cut}.`,
            source: typeName,
            source_verified: true,
            price_cut_window: c.type === 'pricecut',
            owner_name: 'Unknown', phone: '', email: '',
            status: 'New',
            date_added: new Date().toISOString(),
            last_contacted: '', follow_up_date: '', follow_up_note: '', call_notes: '',
            skip_trace_phone: '', skip_trace_email: '', skip_trace_confidence: '',
            arv: null, repair_estimate: null, offer_made: null, mao: null,
            equity_percent: null, auction_date: '', loan_amount: null,
            days_to_auction: null, lender: '', filing_date: '',
          });
        }
        found.sort((a, b) => b.urgency_score - a.urgency_score || (b.days_on_market ?? 0) - (a.days_on_market ?? 0));
        const kept = found.slice(0, MAX_PER_STATE);
        allResults.push(...kept);
        addLog(`✅ ${state}: ${json.listings?.length || 0} listings checked — ${counts.pricecut} price-cut window, ${counts.stale} stale, ${counts.preforeclosure} foreclosure/short sale${found.length > kept.length ? ` (showing top ${kept.length})` : ''}`);
      } catch (e) {
        addLog(`❌ Error: ${e.message}`);
      }
    }

    setResults(allResults);
    setDone(true);
    setRunning(false);
    addLog(`🎯 Done — found ${allResults.length} total listings`);
  };

  const shown = windowOnly ? results.filter(inPriceCutWindow) : results;

  // Import All only takes listings whose link came back from the web search itself.
  // Unverified ones can still be added one at a time after checking the link.
  const importAll = () => {
    const existing = new Set(leads.map(l => l.property_address + l.city));
    const verified = shown.filter(r => r.source_verified);
    const newOnes = verified.filter(r => !existing.has(r.property_address + r.city));
    setLeads(prev => [...prev, ...newOnes]);
    const left = shown.length - verified.length;
    alert(`✅ Imported ${newOnes.length} new leads!${left ? ` ${left} unverified listing(s) left — check the link, then add them one by one.` : ''}`);
    setResults(prev => prev.filter(r => !verified.includes(r)));
    if (!left) { setLog([]); setDone(false); }
  };

  const importOne = (lead) => {
    setLeads(prev => [...prev, lead]);
    setResults(prev => prev.filter(r => r.id !== lead.id));
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lead Search Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Pulls live MLS listings from RentCast and flags motivated sellers in your markets</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>Search Types</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {SEARCH_TYPES.map(t => (
            <button key={t.id} onClick={() => toggleType(t.id)} style={{
              padding: '12px 16px', borderRadius: 10, border: '2px solid',
              borderColor: selectedTypes.includes(t.id) ? t.color : 'var(--gray-200)',
              background: selectedTypes.includes(t.id) ? t.bg : 'var(--white)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans'
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: selectedTypes.includes(t.id) ? t.color : 'var(--text-primary)' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>States</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {STATES.map(s => (
            <button key={s} onClick={() => toggleState(s)} style={{
              padding: '10px 20px', borderRadius: 8, border: '2px solid',
              borderColor: selectedStates.includes(s) ? 'var(--navy)' : 'var(--gray-200)',
              background: selectedStates.includes(s) ? 'var(--navy)' : 'transparent',
              color: selectedStates.includes(s) ? 'var(--white)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: 15
            }}>{s}</button>
          ))}
        </div>
      </div>

      <button className="btn btn-gold btn-lg" onClick={runSearch} disabled={running}
        style={{ marginBottom: 24, width: '100%', justifyContent: 'center' }}>
        {running ? '🔍 Searching...' : '🚀 Run Lead Search'}
      </button>

      {log.length > 0 && (
        <div style={{ background: 'var(--navy)', borderRadius: 10, padding: 16, marginBottom: 20, fontFamily: 'monospace', fontSize: 12 }}>
          {log.map((l, i) => (
            <div key={i} style={{
              color: l.msg.startsWith('✅') ? '#10B981' : l.msg.startsWith('❌') ? '#EF4444' : l.msg.startsWith('🎯') ? '#E8A020' : 'rgba(255,255,255,0.8)',
              marginBottom: 4
            }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>{l.time}</span>{l.msg}
            </div>
          ))}
          {running && <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>⏳ Running...</div>}
        </div>
      )}

      {done && results.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Found {shown.length} Listings</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={windowOnly} onChange={e => setWindowOnly(e.target.checked)} />
                Only 50–59 days on market
              </label>
              <button className="btn btn-gold" onClick={importAll}>⬇️ Import All Verified</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map(lead => (
              <div key={lead.id} className="card" style={{ borderLeft: `3px solid ${SEARCH_TYPES.find(t => t.label === lead.source)?.color || 'var(--navy)'}` }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lead.property_address}, {lead.city}, {lead.state}</span>
                      <span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Foreclosure / Short Sale' ? 'red' : 'amber'}`}>{lead.source}</span>
                      {lead.price_cut_window && <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>⏳ Price-cut window</span>}
                      {!lead.source_verified && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }} title="Not confirmed by the listing feed. Open the listing and check it before adding.">⚠️ Check link</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {lead.asking_price != null && <span>💰 ${lead.asking_price.toLocaleString()}</span>}
                      <span>📅 {lead.days_on_market != null ? `${lead.days_on_market} days on market` : 'Days on market not shown'}</span>
                      {lead.price_drops > 0 && <span>📉 {lead.price_drops} price drop{lead.price_drops > 1 ? 's' : ''}</span>}
                      {lead.listing_agent_name && <span>👤 {lead.listing_agent_name}{lead.listing_agent_brokerage ? `, ${lead.listing_agent_brokerage}` : ''}</span>}
                      {lead.listing_agent_email && <span>✉️ {lead.listing_agent_email}</span>}
                      {lead.listing_agent_phone && <span>📞 {lead.listing_agent_phone}</span>}
                      <a href={lead.listing_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', fontWeight: 600 }}>🔗 {lead.source_site || 'Listing'}</a>
                    </div>
                    {lead.keywords?.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Keywords: {lead.keywords.join(', ')}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{lead.seller_summary}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: lead.urgency_score >= 7 ? '#FEE2E2' : lead.urgency_score >= 5 ? '#FEF3C7' : '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13,
                      color: lead.urgency_score >= 7 ? '#DC2626' : lead.urgency_score >= 5 ? '#D97706' : '#059669'
                    }}>{lead.urgency_score}</div>
                    <button className="btn btn-primary btn-sm" onClick={() => importOne(lead)}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {done && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          No real listings found that match. Try different states or search types.
        </div>
      )}
    </div>
  );
}
