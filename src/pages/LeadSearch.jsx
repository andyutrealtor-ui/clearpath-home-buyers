import React, { useState } from 'react';

const SEARCH_TYPES = [
  { id: 'preforeclosure', label: 'Pre-Foreclosure', icon: '🏚️', color: '#EF4444', bg: '#FEE2E2', desc: 'NOD filings, lis pendens, auction notices' },
  { id: 'abandoned', label: 'Abandoned Homes', icon: '🪟', color: '#8B5CF6', bg: '#EDE9FE', desc: 'Tax delinquent, vacant, code violations' },
  { id: 'stale', label: 'Stale Listings', icon: '📅', color: '#F59E0B', bg: '#FEF3C7', desc: '90+ days on market, price reductions' },
];

const STATES = ['UT', 'TX', 'CO', 'AZ'];

export default function LeadSearch({ leads, setLeads, settings }) {
  const [selectedTypes, setSelectedTypes] = useState(['preforeclosure', 'abandoned', 'stale']);
  const [selectedStates, setSelectedStates] = useState(settings?.activeStates || ['TX', 'UT', 'CO', 'AZ']);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);

  const apiKey = settings?.apiKey;

  const toggleType = (id) => setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleState = (s) => setSelectedStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const addLog = (msg) => setLog(p => [...p, { msg, time: new Date().toLocaleTimeString() }]);

  const runSearch = async () => {
    if (!apiKey) { alert('Please add your Anthropic API key in Settings first.'); return; }
    if (selectedTypes.length === 0) { alert('Select at least one search type.'); return; }
    if (selectedStates.length === 0) { alert('Select at least one state.'); return; }

    setRunning(true);
    setResults([]);
    setLog([]);
    setDone(false);

    const allResults = [];

    for (const state of selectedStates) {
      for (const type of selectedTypes) {
        const typeName = SEARCH_TYPES.find(t => t.id === type)?.label;
        addLog(`🔍 Searching ${typeName} leads in ${state}...`);

        const prompt = type === 'preforeclosure'
          ? `Search the web for pre-foreclosure properties in ${state}. Look for Notice of Default filings, lis pendens, foreclosure auction notices, and distressed homeowners in ${state === 'TX' ? 'Texas' : state === 'UT' ? 'Utah' : state === 'CO' ? 'Colorado' : 'Arizona'}. Find real property addresses with owners who are facing foreclosure. Search sites like foreclosure.com, realtytrac.com, auction.com, and county recorder public notices.`
          : type === 'abandoned'
          ? `Search the web for abandoned, vacant, or tax delinquent properties in ${state === 'TX' ? 'Texas' : state === 'UT' ? 'Utah' : state === 'CO' ? 'Colorado' : 'Arizona'}. Look for properties with unpaid taxes, code violations, vacant property registries, and neglected homes. Search county tax assessor sites and public records.`
          : `Search the web for homes that have been listed on the market for 90 days or more in ${state === 'TX' ? 'Texas' : state === 'UT' ? 'Utah' : state === 'CO' ? 'Colorado' : 'Arizona'}. Look on Zillow, Redfin, and Realtor.com for stale listings with price reductions. Find motivated sellers who haven't been able to sell.`;

        try {
          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey,
              prompt: `${prompt}

Return results as JSON only, no markdown, no extra text:
{
  "leads": [
    {
      "property_address": "123 Main St",
      "city": "Houston",
      "state": "${state}",
      "zip": "77001",
      "owner_name": "John Smith or Unknown",
      "phone": "if found or empty string",
      "asking_price": 150000 or null,
      "source": "${typeName}",
      "days_to_auction": 45 or null,
      "urgency_score": 7,
      "seller_summary": "2-3 sentence summary of situation",
      "lender": "bank name or empty",
      "filing_date": "date or empty"
    }
  ]
}

Find 3-5 real leads. Base them on actual public data you find. If you cannot find specific leads return an empty leads array.`
            })
          });

          const json = await res.json();
          const text = json.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
          const clean = text.replace(/```json|```/g, '').trim();

          try {
            const parsed = JSON.parse(clean);
            const newLeads = (parsed.leads || []).map(l => ({
              ...l,
              id: Date.now() + Math.random(),
              status: 'New',
              date_added: new Date().toISOString(),
              last_contacted: '',
              follow_up_date: '',
              follow_up_note: '',
              call_notes: '',
              skip_trace_phone: '',
              skip_trace_email: '',
              skip_trace_confidence: '',
              arv: null,
              repair_estimate: null,
              offer_made: null,
              mao: null,
              equity_percent: null,
              auction_date: '',
              loan_amount: null,
              email: '',
            }));
            allResults.push(...newLeads);
            addLog(`✅ Found ${newLeads.length} ${typeName} leads in ${state}`);
          } catch {
            addLog(`⚠️ Could not parse results for ${typeName} in ${state}`);
          }
        } catch (e) {
          addLog(`❌ Error searching ${typeName} in ${state}: ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 500));
      }
    }

    setResults(allResults);
    setDone(true);
    setRunning(false);
    addLog(`🎯 Search complete — found ${allResults.length} total leads`);
  };

  const importAll = () => {
    const existing = new Set(leads.map(l => l.property_address + l.city));
    const newOnes = results.filter(r => !existing.has(r.property_address + r.city));
    setLeads(prev => [...prev, ...newOnes]);
    alert(`✅ Imported ${newOnes.length} new leads into your pipeline!`);
    setResults([]);
    setLog([]);
    setDone(false);
  };

  const importOne = (lead) => {
    setLeads(prev => [...prev, lead]);
    setResults(prev => prev.filter(r => r.id !== lead.id));
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lead Search Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>AI searches the web for motivated sellers across your markets</p>
      </div>

      {!apiKey && (
        <div style={{ padding: 16, background: '#FEF3C7', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400E', border: '1px solid #FDE68A' }}>
          ⚠️ <strong>API key required.</strong> Go to Settings and paste your Anthropic API key to enable automated search.
        </div>
      )}

      {/* Search Type Toggles */}
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

      {/* State Toggles */}
      <div style={{ marginBottom: 24 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>States to Search</div>
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

      {/* Run Button */}
      <button className="btn btn-gold btn-lg" onClick={runSearch} disabled={running || !apiKey} style={{ marginBottom: 24, width: '100%', justifyContent: 'center', fontSize: 15 }}>
        {running ? '🔍 Searching the web for leads...' : '🚀 Run Lead Search'}
      </button>

      {/* Live Log */}
      {log.length > 0 && (
        <div style={{ background: 'var(--navy)', borderRadius: 10, padding: 16, marginBottom: 20, fontFamily: 'monospace', fontSize: 12 }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.msg.startsWith('✅') ? '#10B981' : l.msg.startsWith('❌') ? '#EF4444' : l.msg.startsWith('🎯') ? '#E8A020' : 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>{l.time}</span>{l.msg}
            </div>
          ))}
          {running && <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>⏳ Running...</div>}
        </div>
      )}

      {/* Results */}
      {done && results.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Found {results.length} Leads</h2>
            <button className="btn btn-gold" onClick={importAll}>⬇️ Import All to Pipeline</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(lead => (
              <div key={lead.id} className="card" style={{ borderLeft: `3px solid ${SEARCH_TYPES.find(t => t.label === lead.source)?.color || 'var(--navy)'}` }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lead.property_address}, {lead.city}, {lead.state}</span>
                      <span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Abandoned Homes' ? 'purple' : 'amber'}`}>{lead.source}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {lead.owner_name !== 'Unknown' && <span style={{ marginRight: 12 }}>👤 {lead.owner_name}</span>}
                      {lead.phone && <span style={{ marginRight: 12 }}>📞 {lead.phone}</span>}
                      {lead.asking_price && <span style={{ marginRight: 12 }}>💰 ${lead.asking_price.toLocaleString()}</span>}
                      {lead.days_to_auction && <span style={{ color: '#EF4444', marginRight: 12 }}>⏰ {lead.days_to_auction} days to auction</span>}
                    </div>
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
          No leads found this run. Try different states or search types.
        </div>
      )}
    </div>
  );
}
