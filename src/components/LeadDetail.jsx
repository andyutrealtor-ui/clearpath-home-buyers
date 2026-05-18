import React, { useState } from 'react';

const statusOptions = ['New', 'Called', 'Follow-up', 'Negotiating', 'Under Contract', 'Dead'];

function calcMAO(arv, repairs = 0, fee = 10000) {
  if (!arv) return null;
  return (arv * 0.70) - repairs - fee;
}

export default function LeadDetail({ lead, onClose, onUpdate }) {
  const [data, setData] = useState({ ...lead });
  const [tab, setTab] = useState('info');
  const [script, setScript] = useState('');
  const [loadingScript, setLoadingScript] = useState(false);
  const [blastMsg, setBlastMsg] = useState('');

  const update = (field, val) => setData(d => ({ ...d, [field]: val }));
  const save = () => { onUpdate(data); onClose(); };

  const mao = calcMAO(data.arv, data.repair_estimate, 10000);

  const generateScript = async () => {
    setLoadingScript(true);
    setTab('script');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Generate a cold call script for a real estate wholesaler named Andy who works for Clear Path Home Buyers. 

Property: ${data.property_address}, ${data.city}, ${data.state} ${data.zip}
Owner name: ${data.owner_name !== 'Unknown' ? data.owner_name : 'the homeowner'}
Lead type: ${data.source}
Asking price: ${data.asking_price ? '$' + data.asking_price.toLocaleString() : 'unknown'}
Estimated equity: ${data.equity_percent ? data.equity_percent + '%' : 'unknown'}
Days to auction: ${data.days_to_auction || 'N/A'}
Lender: ${data.lender || 'unknown'}

Write a natural, conversational script. Include:
1. Opener — starts with "Hi [Name], my name is Andy with Clear Path Home Buyers..."
2. Reason for calling (keep it helpful, not pushy)
3. Pain acknowledgment
4. Value proposition — we can close fast, cash, as-is
5. Soft offer transition
6. Two objection handlers: "not interested" and "I'm working with an agent"
7. Closing / callback ask

Keep it warm, direct, and under 400 words. Format with clear section labels.`
          }]
        })
      });
      const json = await res.json();
      setScript(json.content?.[0]?.text || 'Could not generate script.');
    } catch (e) {
      setScript('Error generating script. Check your connection.');
    }
    setLoadingScript(false);
  };

  const generateBlast = () => {
    const msg = `🏠 DEAL ALERT — Clear Path Home Buyers

📍 ${data.property_address}, ${data.city}, ${data.state} ${data.zip}
💰 Assignment Price: $${data.asking_price?.toLocaleString() || 'TBD'}
📊 ARV: $${data.arv?.toLocaleString() || 'TBD'}
🔨 Est. Repairs: $${data.repair_estimate?.toLocaleString() || 'TBD'}
📈 Est. Buyer Profit: $${data.arv && data.asking_price && data.repair_estimate ? ((data.arv - data.asking_price - data.repair_estimate)).toLocaleString() : 'TBD'}

⚡ This deal will not last — respond by ${new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString()}

Contact Andy directly:
📞 Call/Text to claim this deal
Clear Path Home Buyers`;
    setBlastMsg(msg);
    setTab('blast');
  };

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'mao', label: 'MAO Calc' },
    { id: 'script', label: 'Call Script' },
    { id: 'followup', label: 'Follow-Up' },
    ...(data.status === 'Under Contract' ? [{ id: 'blast', label: '🚀 Blast' }] : []),
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{data.property_address}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.city}, {data.state} {data.zip}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="form-select" style={{ width: 'auto', fontSize: 12 }}
              value={data.status} onChange={e => update('status', e.target.value)}>
              {statusOptions.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 24px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontFamily: 'DM Sans', fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--navy)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--navy)' : '2px solid transparent',
              marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

          {tab === 'info' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Owner Name</label>
                  <input className="form-input" value={data.owner_name} onChange={e => update('owner_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={data.phone} onChange={e => update('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={data.source} onChange={e => update('source', e.target.value)}>
                    {['Pre-Foreclosure','Abandoned','Stale Listing','Cold Call'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Asking Price</label>
                  <input className="form-input" type="number" value={data.asking_price || ''} onChange={e => update('asking_price', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">ARV</label>
                  <input className="form-input" type="number" value={data.arv || ''} onChange={e => update('arv', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Repair Estimate</label>
                  <input className="form-input" type="number" value={data.repair_estimate || ''} onChange={e => update('repair_estimate', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Offer Made</label>
                  <input className="form-input" type="number" value={data.offer_made || ''} onChange={e => update('offer_made', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Days to Auction</label>
                  <input className="form-input" type="number" value={data.days_to_auction || ''} onChange={e => update('days_to_auction', +e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Seller Summary</label>
                <textarea className="form-textarea" value={data.seller_summary} onChange={e => update('seller_summary', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Call Notes</label>
                <textarea className="form-textarea" value={data.call_notes} onChange={e => update('call_notes', e.target.value)} placeholder="Log what happened on this call..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`tel:${data.phone}`} className="btn btn-gold">📞 Call {data.phone}</a>
                <button className="btn btn-primary" onClick={generateScript}>📝 Generate Script</button>
              </div>
            </div>
          )}

          {tab === 'mao' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'ARV', field: 'arv' },
                  { label: 'Repair Costs', field: 'repair_estimate' },
                ].map(f => (
                  <div key={f.field} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type="number" value={data[f.field] || ''} onChange={e => update(f.field, +e.target.value)} placeholder="$0" />
                  </div>
                ))}
              </div>
              {data.arv ? (
                <div style={{ background: 'var(--gray-100)', borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>MAO Breakdown</h3>
                  {[
                    { label: 'ARV', value: data.arv, color: 'var(--navy)' },
                    { label: '× 70% Rule', value: data.arv * 0.70, color: 'var(--text-secondary)' },
                    { label: '− Repairs', value: -(data.repair_estimate || 0), color: '#EF4444' },
                    { label: '− Wholesale Fee', value: -10000, color: '#EF4444' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--gray-200)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: row.color }}>
                        ${Math.abs(row.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Max Allowable Offer</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: mao > 0 ? 'var(--green)' : 'var(--red)' }}>
                      ${mao?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--white)', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Suggested offer range</div>
                    <div style={{ fontWeight: 600 }}>
                      ${(mao * 0.95)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${mao?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  {data.asking_price && mao && (
                    <div style={{ marginTop: 8, padding: 12, background: data.asking_price > mao ? '#FEE2E2' : '#D1FAE5', borderRadius: 8, fontSize: 13 }}>
                      Seller asking <strong>${data.asking_price.toLocaleString()}</strong> — {data.asking_price > mao ? `$${(data.asking_price - mao).toLocaleString()} ABOVE your MAO. Negotiate down.` : `BELOW your MAO by $${(mao - data.asking_price).toLocaleString()}. ✅ Deal works.`}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Enter ARV above to calculate</div>
              )}
            </div>
          )}

          {tab === 'script' && (
            <div>
              {!script && !loadingScript && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Generate a personalized call script using this lead's data</p>
                  <button className="btn btn-primary" onClick={generateScript}>✨ Generate Script</button>
                </div>
              )}
              {loadingScript && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <div>Writing your script...</div>
                </div>
              )}
              {script && (
                <div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--gray-100)', borderRadius: 10, padding: 20 }}>
                    {script}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(script)}>📋 Copy</button>
                    <button className="btn btn-ghost btn-sm" onClick={generateScript}>↻ Regenerate</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'followup' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Follow-Up Date</label>
                <input className="form-input" type="date" value={data.follow_up_date} onChange={e => update('follow_up_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-Up Note</label>
                <textarea className="form-textarea" value={data.follow_up_note} onChange={e => update('follow_up_note', e.target.value)} placeholder="What to say / what to follow up on..." />
              </div>
            </div>
          )}

          {tab === 'blast' && (
            <div>
              {!blastMsg ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 14 }}>
                    Generate a deal blast message to send to your cash buyers
                  </p>
                  <button className="btn btn-gold" onClick={generateBlast}>🚀 Generate Deal Blast</button>
                </div>
              ) : (
                <div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, background: 'var(--gray-100)', borderRadius: 10, padding: 20 }}>
                    {blastMsg}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button className="btn btn-gold" onClick={() => navigator.clipboard.writeText(blastMsg)}>📋 Copy to Clipboard</button>
                    <button className="btn btn-ghost btn-sm" onClick={generateBlast}>↻ Regenerate</button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                    Paste into your group text, email, or direct message to buyers
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
