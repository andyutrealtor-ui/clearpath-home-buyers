import React, { useState } from 'react';

// ---- FOLLOW-UPS ----
export function FollowUps({ leads, setLeads }) {
  const today = new Date();
  const withFollowups = leads
    .filter(l => l.follow_up_date)
    .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));

  const getTag = (dateStr) => {
    const d = new Date(dateStr);
    const todayStr = today.toDateString();
    const dStr = d.toDateString();
    if (dStr === todayStr) return { label: 'Today', color: 'var(--amber)', bg: '#FEF3C7' };
    if (d < today) return { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2' };
    return { label: new Date(dateStr).toLocaleDateString(), color: 'var(--green)', bg: '#D1FAE5' };
  };

  const markDone = (id) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, follow_up_date: '', follow_up_note: '' } : l));
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Follow-Ups</h1>
      {withFollowups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          No follow-ups scheduled
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {withFollowups.map(lead => {
            const tag = getTag(lead.follow_up_date);
            return (
              <div key={lead.id} className="card" style={{ borderLeft: `3px solid ${tag.color}` }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: tag.bg, color: tag.color, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{tag.label}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{lead.property_address}, {lead.city}, {lead.state}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lead.follow_up_note || 'No note'}</div>
                    {lead.call_notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>Last note: {lead.call_notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a href={`tel:${lead.phone}`} className="btn btn-gold btn-sm">📞 {lead.phone}</a>
                    <button className="btn btn-outline btn-sm" onClick={() => markDone(lead.id)}>✓ Done</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- BUYERS CRM ----
export function Buyers({ buyers, setBuyers }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', website: '', states: [], property_types: [], min_price: '', max_price: '', condition: 'As-Is', close_days: '14', funding: 'Cash', deal_types: [], tag: 'Active', notes: '' });

  const toggleState = (s) => setForm(p => ({ ...p, states: p.states.includes(s) ? p.states.filter(x => x !== s) : [...p.states, s] }));

  const addBuyer = () => {
    setBuyers(prev => [...prev, { ...form, id: Date.now(), min_price: +form.min_price || 0, max_price: +form.max_price || 0, close_days: +form.close_days || 14, total_deals_closed: 0, last_contacted: '', last_deal_sent: '', last_deal_closed: '' }]);
    setShowAdd(false);
    setForm({ name: '', company: '', phone: '', email: '', website: '', states: [], property_types: [], min_price: '', max_price: '', condition: 'As-Is', close_days: '14', funding: 'Cash', deal_types: [], tag: 'Active', notes: '' });
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Cash Buyers <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({buyers.length})</span></h1>
        <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Buyer</button>
      </div>

      {buyers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <div>No buyers yet. Add your first cash buyer.</div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Company</th><th>Phone</th><th>States</th><th>Price Range</th><th>Tag</th><th>Deals Closed</th></tr>
            </thead>
            <tbody>
              {buyers.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{b.company || '—'}</td>
                  <td><a href={`tel:${b.phone}`} style={{ color: 'var(--navy)' }}>{b.phone}</a></td>
                  <td>{b.states?.map(s => <span key={s} className="badge badge-navy" style={{ marginRight: 3, fontSize: 10 }}>{s}</span>)}</td>
                  <td style={{ fontSize: 12 }}>${(b.min_price/1000).toFixed(0)}k — ${(b.max_price/1000).toFixed(0)}k</td>
                  <td><span className={`badge badge-${b.tag === 'Hot Buyer' ? 'red' : b.tag === 'VIP' ? 'amber' : b.tag === 'Active' ? 'green' : 'gray'}`}>{b.tag}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.total_deals_closed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal fade-in" style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Cash Buyer</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Contact Info */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--gold)' }}>Contact Information</div>
                </div>
                {[['name','Full Name *'],['company','Company Name'],['phone','Phone Number'],['email','Email Address'],['website','Website (optional)']].map(([f,l]) => (
                  <div key={f} className="form-group" style={f === 'website' ? { gridColumn: '1 / -1' } : {}}>
                    <label className="form-label">{l}</label>
                    <input className="form-input" value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={f === 'phone' ? '(555) 000-0000' : f === 'email' ? 'buyer@email.com' : ''} />
                  </div>
                ))}

                {/* Buyer Classification */}
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--gold)' }}>Buyer Classification</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Buyer Tag</label>
                  <select className="form-select" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
                    {['Hot Buyer','Active','VIP','Inactive'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Funding Type</label>
                  <select className="form-select" value={form.funding} onChange={e => setForm(p => ({ ...p, funding: e.target.value }))}>
                    {['Cash','Hard Money','Private Money','Conventional','Mix'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Buy Criteria */}
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--gold)' }}>Buy Criteria</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Min Price ($)</label>
                  <input className="form-input" type="number" value={form.min_price} onChange={e => setForm(p => ({ ...p, min_price: e.target.value }))} placeholder="50000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Price ($)</label>
                  <input className="form-input" type="number" value={form.max_price} onChange={e => setForm(p => ({ ...p, max_price: e.target.value }))} placeholder="300000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Avg Close Timeline (days)</label>
                  <input className="form-input" type="number" value={form.close_days} onChange={e => setForm(p => ({ ...p, close_days: e.target.value }))} placeholder="14" />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Condition</label>
                  <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                    {['As-Is','Distressed','Light Rehab','Full Rehab','Any'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Active States */}
                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Active States</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['TX','UT','CO','AZ','NV','NM','ID','WY'].map(s => (
                      <button key={s} type="button" onClick={() => toggleState(s)} style={{
                        padding: '6px 16px', borderRadius: 6, border: '1.5px solid',
                        borderColor: form.states.includes(s) ? 'var(--navy)' : 'var(--gray-200)',
                        background: form.states.includes(s) ? 'var(--navy)' : 'transparent',
                        color: form.states.includes(s) ? 'var(--white)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13
                      }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Property Types */}
                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Property Types They Buy</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Single Family','Multi-Family','Condo','Townhouse','Land','Commercial'].map(t => (
                      <button key={t} type="button" onClick={() => setForm(p => ({ ...p, property_types: p.property_types.includes(t) ? p.property_types.filter(x => x !== t) : [...p.property_types, t] }))} style={{
                        padding: '6px 14px', borderRadius: 6, border: '1.5px solid', fontSize: 12,
                        borderColor: form.property_types.includes(t) ? 'var(--gold)' : 'var(--gray-200)',
                        background: form.property_types.includes(t) ? 'var(--gold)' : 'transparent',
                        color: form.property_types.includes(t) ? 'var(--navy)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: form.property_types.includes(t) ? 600 : 400
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Deal Types */}
                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Deal Types They Want</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Fix & Flip','Buy & Hold','Wholesale','New Construction','Rental'].map(t => (
                      <button key={t} type="button" onClick={() => setForm(p => ({ ...p, deal_types: p.deal_types.includes(t) ? p.deal_types.filter(x => x !== t) : [...p.deal_types, t] }))} style={{
                        padding: '6px 14px', borderRadius: 6, border: '1.5px solid', fontSize: 12,
                        borderColor: form.deal_types.includes(t) ? '#10B981' : 'var(--gray-200)',
                        background: form.deal_types.includes(t) ? '#D1FAE5' : 'transparent',
                        color: form.deal_types.includes(t) ? '#059669' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: form.deal_types.includes(t) ? 600 : 400
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid var(--gold)' }}>Notes</div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Additional Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="How did you meet? What are they looking for? Any special requirements?" style={{ minHeight: 100 }} />
                </div>

              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={addBuyer}>Add Buyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- SETTINGS ----
export function Settings({ settings, setSettings }) {
  const update = (k, v) => setSettings(p => ({ ...p, [k]: v }));
  const toggleState = (s) => setSettings(p => ({ ...p, activeStates: p.activeStates.includes(s) ? p.activeStates.filter(x => x !== s) : [...p.activeStates, s] }));

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Your Profile</h2></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            {[['name','Your Name'],['phone','Your Phone'],['email','Your Email']].map(([f,l]) => (
              <div key={f} className="form-group">
                <label className="form-label">{l}</label>
                <input className="form-input" value={settings[f] || ''} onChange={e => update(f, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>🤖 AI Settings</h2></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Anthropic API Key</label>
              <input className="form-input" type="password" placeholder="sk-ant-..." value={settings.apiKey || ''} onChange={e => update('apiKey', e.target.value)} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Required for automated lead search, call scripts, and ARV tool. Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--navy)' }}>console.anthropic.com</a>
              </div>
            </div>
            {settings.apiKey && (
              <div style={{ padding: 10, background: '#D1FAE5', borderRadius: 8, fontSize: 12, color: '#059669', fontWeight: 500 }}>
                ✅ API key saved — AI features are active
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Daily Preferences</h2></div>
          <div className="card-body" style={{ display: 'grid', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Daily Lead Cap</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min={1} max={20} value={settings.leadCap || 5} onChange={e => update('leadCap', +e.target.value)} style={{ flex: 1, accentColor: 'var(--navy)' }} />
                <span style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, minWidth: 30 }}>{settings.leadCap || 5}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Recommended: 5–10 leads/day for full-time professionals</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Call Start Time</label>
                <input className="form-input" type="time" value={settings.callStart || '07:00'} onChange={e => update('callStart', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Call End Time</label>
                <input className="form-input" type="time" value={settings.callEnd || '20:00'} onChange={e => update('callEnd', e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All times in MST</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Active States</h2></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10 }}>
              {['TX','UT','CO','AZ'].map(s => (
                <button key={s} onClick={() => toggleState(s)} style={{
                  padding: '10px 20px', borderRadius: 8, border: '2px solid',
                  borderColor: settings.activeStates?.includes(s) ? 'var(--navy)' : 'var(--gray-200)',
                  background: settings.activeStates?.includes(s) ? 'var(--navy)' : 'transparent',
                  color: settings.activeStates?.includes(s) ? 'var(--white)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: 15
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
