import React, { useState } from 'react';
import { calcMAO, money } from '../dealMath';

const SCRIPT_TYPES = [
  { id: 'agent', label: 'Listing agent', desc: 'Call the agent about their listing and float a cash offer' },
  { id: 'agent_followup', label: 'Agent follow-up', desc: 'No answer to the LOI yet, or the price dropped' },
  { id: 'seller_callback', label: 'Seller who called you', desc: 'Inbound call from a homeowner' },
];

export default function CallScripts({ deal = {}, settings }) {
  const [type, setType] = useState('agent');
  const [contactName, setContactName] = useState('');
  const [extra, setExtra] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mao = calcMAO({ arv: deal.arv, repairs: deal.repairs, fee: deal.fee ?? 10000, pct: deal.pct ?? 70 });
  const name = settings?.name?.split(' ')[0] || 'the caller';

  const generate = async () => {
    if (!settings?.apiKey) { setError('Add your Anthropic API key in Settings to generate scripts.'); return; }
    setLoading(true); setError(''); setScript('');
    const t = SCRIPT_TYPES.find(s => s.id === type);
    const prompt = `Write a phone call script for ${name}, a cash buyer with Clear Path Properties LLC (real estate wholesaler/investor).
Call type: ${t.label} — ${t.desc}.
Who they're calling: ${contactName || (type.startsWith('agent') ? 'the listing agent' : 'the homeowner')}.
Property: ${deal.address || '[address]'}${deal.city ? `, ${deal.city} ${deal.state || ''}` : ''}${deal.beds ? `, ${deal.beds}bd` : ''}${deal.baths ? `/${deal.baths}ba` : ''}${deal.sqft ? `, ${deal.sqft} sqft` : ''}.
List/asking price: ${deal.asking ? money(Number(deal.asking)) : 'unknown'}.
Our max offer (MAO): ${mao ? money(mao) : 'not calculated'}${deal.offer ? `; planned offer ${money(Number(deal.offer))}` : ''}.
Our terms: all cash, as-is, no financing contingency, can close in about 14 days.
${extra ? `Extra context: ${extra}\n` : ''}
Rules: be honest and professional — never misrepresent who we are or pressure anyone. For agent calls, respect the agent's duty to their seller and ask how their seller prefers offers submitted. Never reveal the MAO number; open below it.
Include: opener; 2–3 discovery questions (seller's motivation, timeline, condition, other offers, price flexibility); how to present the cash offer; handlers for "price is firm", "we have other offers" and "send it in writing"; close with a clear next step (send LOI, schedule walkthrough).
Under 400 words, clear section labels, natural spoken language.`;
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: settings.apiKey, useSearch: false, maxTokens: 1200, prompt }),
      });
      const json = await res.json();
      if (json.type === 'error' || json.error) throw new Error(json.error?.message || json.error);
      setScript(json.content?.filter(b => b.type === 'text').map(b => b.text).join('') || 'No script returned.');
    } catch (e) {
      setError(`Couldn't generate the script: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Call Scripts</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Uses the current deal{deal.address ? ` (${deal.address})` : ''} and your MAO. Never reads the MAO out loud — it opens below it.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {SCRIPT_TYPES.map(s => (
              <button key={s.id} onClick={() => setType(s.id)} style={{
                padding: '10px 14px', borderRadius: 10, border: '2px solid', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans',
                borderColor: type === s.id ? 'var(--navy)' : 'var(--gray-200)',
                background: type === s.id ? 'var(--navy)' : 'var(--white)',
                color: type === s.id ? 'var(--white)' : 'var(--text-primary)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{s.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Their name</label>
              <input className="form-input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Rene Romero" />
            </div>
            <div className="form-group">
              <label className="form-label">Anything else to mention (optional)</label>
              <input className="form-input" value={extra} onChange={e => setExtra(e.target.value)} placeholder="290 days on market, price cut 23% in September" />
            </div>
          </div>
          <button className="btn btn-gold" onClick={generate} disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? '✍️ Writing script…' : '📞 Generate script'}
          </button>
          {error && <div style={{ padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>❌ {error}</div>}
        </div>
      </div>

      {script && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700 }}>Script</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(script)}>📋 Copy</button>
          </div>
          <div className="card-body">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{script}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
