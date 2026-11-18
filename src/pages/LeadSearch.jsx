import React, { useState } from 'react';

const SEARCH_TYPES = [
  { id: 'pricecut', label: 'Price-Cut Window', icon: '⏳', color: '#0EA5E9', bg: '#E0F2FE', desc: '50–59 days on market — right before the price-cut talk' },
  { id: 'stale', label: 'Stale Listings', icon: '📅', color: '#F59E0B', bg: '#FEF3C7', desc: '90+ days on market, price reductions' },
  { id: 'preforeclosure', label: 'Pre-Foreclosure', icon: '🏚️', color: '#EF4444', bg: '#FEE2E2', desc: 'Pre-foreclosure, short sale, auction listings' },
  { id: 'abandoned', label: 'Distressed / As-Is', icon: '🪟', color: '#8B5CF6', bg: '#EDE9FE', desc: 'As-is, vacant, fixer-upper, cash-only listings' },
];

const STATES = ['UT', 'TX', 'CO', 'AZ'];
const STATE_INFO = {
  TX: { name: 'Texas', city: 'Houston' },
  UT: { name: 'Utah', city: 'Salt Lake City' },
  CO: { name: 'Colorado', city: 'Denver' },
  AZ: { name: 'Arizona', city: 'Phoenix' },
};

const CRITERIA = {
  pricecut: 'have been on the market between 50 and 59 days (the listing page shows 50–59 days on market), ideally with no price cut yet',
  stale: 'have been on the market 90 or more days, or have had one or more price reductions',
  preforeclosure: 'are listed as pre-foreclosure, short sale, bank-owned, or auction',
  abandoned: 'are described as as-is, vacant, fixer-upper, cash only, TLC, or investor special',
};

// 50–59 days on market: the listing is about to hit the usual 60-day price-cut conversation.
export const inPriceCutWindow = (lead) => {
  const d = Number(lead?.days_on_market);
  return lead?.days_on_market != null && lead?.days_on_market !== '' && d >= 50 && d <= 59;
};

function parseLeads(text) {
  const strategies = [
    () => JSON.parse(text.trim()),
    () => JSON.parse(text.replace(/```json|```/g, '').trim()),
    () => JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)),
    () => { const m = text.match(/\{[\s\S]*?"leads"[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; },
    () => { const m = text.match(/\[[\s\S]*\]/); return m ? { leads: JSON.parse(m[0]) } : null; },
  ];
  for (const s of strategies) {
    try { const r = s(); if (r) return r; } catch { continue; }
  }
  return null;
}

// host + path, no www, query, hash or trailing slash — so URL variants still match.
function normUrl(u) {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch { return null; }
}

// Every URL the web search actually returned or cited in this response.
function collectSearchedUrls(content = []) {
  const urls = new Set();
  for (const b of content) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      b.content.forEach(r => { const n = r.url && normUrl(r.url); if (n) urls.add(n); });
    }
    if (b.type === 'text' && Array.isArray(b.citations)) {
      b.citations.forEach(c => { const n = c.url && normUrl(c.url); if (n) urls.add(n); });
    }
  }
  return urls;
}

const toNum = (v) => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export default function LeadSearch({ leads, setLeads, settings }) {
  const [selectedTypes, setSelectedTypes] = useState(['pricecut', 'stale']);
  const [selectedStates, setSelectedStates] = useState(settings?.activeStates || ['TX', 'UT', 'CO', 'AZ']);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);
  const [windowOnly, setWindowOnly] = useState(false);

  const apiKey = settings?.apiKey;

  const toggleType = (id) => setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleState = (s) => setSelectedStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const addLog = (msg) => setLog(p => [...p, { msg, time: new Date().toLocaleTimeString() }]);

  const buildPrompt = (type, state, typeName) => {
    const { name: stateName, city } = STATE_INFO[state];
    return `Use web search to find up to 3 REAL, currently active for-sale home listings in the ${city}, ${stateName} metro area that ${CRITERIA[type]}. Search public listing sites such as Zillow, Redfin, Realtor.com, Homes.com and local brokerage sites.

Rules — follow them exactly:
- Only include a property if you found its actual listing page in your search results. Never invent or guess an address, price, days on market, or agent detail.
- listing_url must be the exact URL of the listing page you found.
- days_on_market: the number shown on the listing, or null if it is not shown. Do not estimate it.
- listing_agent_* fields: only what the listing page shows; otherwise "".
- price_drops: number of price reductions shown on the listing, or null.
- keywords: words from the listing description that signal motivation (e.g. "as-is", "motivated", "cash only", "price reduced").
- urgency_score: 1–10 for how motivated the seller likely is, based on days on market, price drops and those keywords.
- If nothing qualifies, return {"leads":[]}.

After searching, end your reply with ONLY this JSON:
{"leads":[{"property_address":"string","city":"string","state":"${state}","zip":"string","asking_price":number,"days_on_market":number|null,"price_drops":number|null,"listing_url":"string","source_site":"string","listing_agent_name":"string","listing_agent_brokerage":"string","listing_agent_phone":"string","listing_agent_email":"string","keywords":["string"],"urgency_score":number,"seller_summary":"one sentence from what the listing says"}]}`;
  };

  const runSearch = async () => {
    if (!apiKey) { alert('Add your Anthropic API key in Settings first.'); return; }
    if (!selectedTypes.length) { alert('Select at least one search type.'); return; }
    if (!selectedStates.length) { alert('Select at least one state.'); return; }

    setRunning(true); setResults([]); setLog([]); setDone(false);
    const allResults = [];
    const seen = new Set();

    for (const state of selectedStates) {
      for (const type of selectedTypes) {
        const typeName = SEARCH_TYPES.find(t => t.id === type)?.label;
        addLog(`🔍 Searching the web for ${typeName} in ${state}...`);
        try {
          const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, useSearch: true, maxSearches: 5, maxTokens: 3000, prompt: buildPrompt(type, state, typeName) })
          });
          const json = await res.json();
          if (json.error) { addLog("❌ API error: " + (json.error?.message || json.error)); continue; }

          const content = json.content || [];
          const textBlocks = content.filter(b => b.type === 'text').map(b => b.text);
          // The JSON is at the end; earlier text blocks are search narration.
          const parsed = parseLeads(textBlocks[textBlocks.length - 1] || '') || parseLeads(textBlocks.join(''));
          if (!textBlocks.length) addLog("⚠️ Empty reply — stop_reason: " + json.stop_reason);

          const searchedUrls = collectSearchedUrls(content);
          const raw = parsed?.leads || [];
          let noUrl = 0, outsideWindow = 0;

          const newLeads = [];
          for (const l of raw) {
            if (!l.property_address || !/^https?:\/\//i.test(l.listing_url || '')) { noUrl++; continue; }
            const lead = {
              ...l,
              asking_price: toNum(l.asking_price),
              days_on_market: toNum(l.days_on_market),
              price_drops: toNum(l.price_drops),
              keywords: Array.isArray(l.keywords) ? l.keywords : [],
              urgency_score: Math.max(1, Math.min(10, Math.round(toNum(l.urgency_score) || 5))),
            };
            // The price-cut search only keeps listings whose page shows 50–59 days.
            if (type === 'pricecut' && !inPriceCutWindow(lead)) { outsideWindow++; continue; }
            const key = (lead.property_address + lead.city).toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            newLeads.push({
              ...lead,
              id: Date.now() + Math.random(),
              source: typeName,
              source_verified: searchedUrls.has(normUrl(lead.listing_url)),
              price_cut_window: inPriceCutWindow(lead),
              owner_name: 'Unknown',
              phone: '',
              email: '',
              status: 'New',
              date_added: new Date().toISOString(),
              last_contacted: '', follow_up_date: '', follow_up_note: '', call_notes: '',
              skip_trace_phone: '', skip_trace_email: '', skip_trace_confidence: '',
              arv: null, repair_estimate: null, offer_made: null, mao: null,
              equity_percent: null, auction_date: '', loan_amount: null,
              days_to_auction: null, lender: '', filing_date: '',
            });
          }

          allResults.push(...newLeads);
          const notes = [noUrl && `${noUrl} skipped (no listing link)`, outsideWindow && `${outsideWindow} skipped (not 50–59 days)`].filter(Boolean).join(', ');
          addLog(newLeads.length
            ? `✅ Found ${newLeads.length} real listings in ${state}${notes ? ` — ${notes}` : ''}`
            : `⚠️ No qualifying listings for ${typeName} in ${state}${notes ? ` — ${notes}` : ''}`);
        } catch (e) {
          addLog(`❌ Error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 12000));
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
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Searches public listing sites for real motivated-seller listings in your markets</p>
      </div>

      {!apiKey && (
        <div style={{ padding: 16, background: '#FEF3C7', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400E', border: '1px solid #FDE68A' }}>
          ⚠️ <strong>API key required.</strong> Go to Settings and paste your Anthropic API key.
        </div>
      )}

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

      <button className="btn btn-gold btn-lg" onClick={runSearch} disabled={running || !apiKey}
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
                      <span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Distressed / As-Is' ? 'purple' : 'amber'}`}>{lead.source}</span>
                      {lead.price_cut_window && <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>⏳ Price-cut window</span>}
                      {!lead.source_verified && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }} title="This link did not appear in the web search results. Open it and confirm the listing is real before adding.">⚠️ Check link</span>}
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
