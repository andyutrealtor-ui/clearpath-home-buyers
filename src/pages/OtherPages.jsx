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
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', states: [], min_price: '', max_price: '', condition: 'As-Is', close_days: 14, tag: 'Active', notes: '' });

  const toggleState = (s) => setForm(p => ({ ...p, states: p.states.includes(s) ? p.states.filter(x => x !== s) : [...p.states, s] }));

  const addBuyer = () => {
    setBuyers(prev => [...prev, { ...form, id: Date.now(), min_price: +form.min_price || 0, max_price: +form.max_price || 0, total_deals_closed: 0, last_contacted: '', last_deal_sent: '', last_deal_closed: '' }]);
    setShowAdd(false);
    setForm({ name: '', company: '', phone: '', email: '', states: [], min_price: '', max_price: '', condition: 'As-Is', close_days: 14, tag: 'Active', notes: '' });
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
          <div className="modal fade-in">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Cash Buyer</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['name','Name'],['company','Company'],['phone','Phone'],['email','Email'],['min_price','Min Price'],['max_price','Max Price'],['close_days','Close Days']].map(([f,l]) => (
                  <div key={f} className="form-group">
                    <label className="form-label">{l}</label>
                    <input className="form-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Tag</label>
                  <select className="form-select" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
                    {['Hot Buyer','Active','VIP','Inactive'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Active States</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['TX','UT','CO','AZ'].map(s => (
                      <button key={s} type="button" onClick={() => toggleState(s)} style={{
                        padding: '6px 14px', borderRadius: 6, border: '1.5px solid',
                        borderColor: form.states.includes(s) ? 'var(--navy)' : 'var(--gray-200)',
                        background: form.states.includes(s) ? 'var(--navy)' : 'transparent',
                        color: form.states.includes(s) ? 'var(--white)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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
