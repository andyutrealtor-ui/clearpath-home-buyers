import React, { useState } from 'react';

const SEARCH_TYPES = [
  { id: 'preforeclosure', label: 'Pre-Foreclosure', icon: '🏚️', color: '#EF4444', bg: '#FEE2E2', desc: 'NOD filings, lis pendens, auction notices' },
  { id: 'abandoned', label: 'Abandoned Homes', icon: '🪟', color: '#8B5CF6', bg: '#EDE9FE', desc: 'Tax delinquent, vacant, code violations' },
  { id: 'stale', label: 'Stale Listings', icon: '📅', color: '#F59E0B', bg: '#FEF3C7', desc: '90+ days on market, price reductions' },
];

const STATES = ['UT', 'TX', 'CO', 'AZ'];

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

  const buildPrompt = (type, state, typeName) => {
    const stateName = state === 'TX' ? 'Texas' : state === 'UT' ? 'Utah' : state === 'CO' ? 'Colorado' : 'Arizona';
    const q = type === 'preforeclosure' ? `foreclosure listings ${stateName} 2025`
      : type === 'abandoned' ? `tax delinquent vacant properties ${stateName} 2025`
      : `homes 90 days market price reduced ${stateName} 2025`;
    return `Search: "${q}". Find 2 real properties. Return ONLY JSON, no other text: {"leads":[{"property_address":"123 Main St","city":"Houston","state":"${state}","zip":"77001","owner_name":"Unknown","phone":"","asking_price":150000,"source":"${typeName}","days_to_auction":null,"urgency_score":6,"seller_summary":"One sentence.","lender":"","filing_date":""}]}`;
  };

  const runSearch = async () => {
    if (!apiKey) { alert('Add your Anthropic API key in Settings first.'); return; }
    if (!selectedTypes.length) { alert('Select at least one search type.'); return; }
    if (!selectedStates.length) { alert('Select at least one state.'); return; }

    setRunning(true); setResults([]); setLog([]); setDone(false);
    const allResults = [];

    for (const state of selectedStates) {
      for (const type of selectedTypes) {
        const typeName = SEARCH_TYPES.find(t => t.id === type)?.label;
        addLog(`🔍 Searching ${typeName} in ${state}...`);
        try {
          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, prompt: buildPrompt(type, state, typeName) })
          });
          const json = await res.json();
          console.log("RAW API RESPONSE:", JSON.stringify(json).substring(0, 800));
          if (json.error) { addLog("❌ API error: " + (json.error?.message || json.error)); continue; }

          const rawText = json.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
          console.log("TEXT CONTENT:", rawText.substring(0, 400));
          if (!rawText) { addLog("⚠️ Empty text — stop_reason: " + json.stop_reason); }

          const parsed = parseLeads(rawText);
          if (parsed && parsed.leads && parsed.leads.length > 0) {
            const newLeads = parsed.leads.map(l => ({
              ...l,
              id: Date.now() + Math.random(),
              status: 'New',
              date_added: new Date().toISOString(),
              last_contacted: '', follow_up_date: '', follow_up_note: '', call_notes: '',
              skip_trace_phone: '', skip_trace_email: '', skip_trace_confidence: '',
              arv: null, repair_estimate: null, offer_made: null, mao: null,
              equity_percent: null, auction_date: '', loan_amount: null, email: '',
            }));
            allResults.push(...newLeads);
            addLog(`✅ Found ${newLeads.length} leads in ${state}`);
          } else {
            addLog(`⚠️ No leads returned for ${typeName} in ${state}`);
          }
        } catch (e) {
          addLog(`❌ Error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    setResults(allResults);
    setDone(true);
    setRunning(false);
    addLog(`🎯 Done — found ${allResults.length} total leads`);
  };

  const importAll = () => {
    const existing = new Set(leads.map(l => l.property_address + l.city));
    const newOnes = results.filter(r => !existing.has(r.property_address + r.city));
    setLeads(prev => [...prev, ...newOnes]);
    alert(`✅ Imported ${newOnes.length} new leads!`);
    setResults([]); setLog([]); setDone(false);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Found {results.length} Leads</h2>
            <button className="btn btn-gold" onClick={importAll}>⬇️ Import All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(lead => (
              <div key={lead.id} className="card" style={{ borderLeft: `3px solid ${SEARCH_TYPES.find(t => t.label === lead.source)?.color || 'var(--navy)'}` }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lead.property_address}, {lead.city}, {lead.state}</span>
                      <span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Abandoned Homes' ? 'purple' : 'amber'}`}>{lead.source}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {lead.phone && <span style={{ marginRight: 12 }}>📞 {lead.phone}</span>}
                      {lead.asking_price && <span style={{ marginRight: 12 }}>💰 ${lead.asking_price.toLocaleString()}</span>}
                      {lead.days_to_auction && <span style={{ color: '#EF4444' }}>⏰ {lead.days_to_auction}d to auction</span>}
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
          No leads found. Try different states or search types.
        </div>
      )}
    </div>
  );
}
