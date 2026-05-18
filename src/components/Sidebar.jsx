import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'search', label: 'Lead Search', icon: '🔍' },
  { id: 'leads', label: 'Leads', icon: '◎' },
  { id: 'followups', label: 'Follow-Ups', icon: '◷' },
  { id: 'arv', label: 'ARV Tool', icon: '◈' },
  { id: 'buyers', label: 'Cash Buyers', icon: '◉' },
  { id: 'settings', label: 'Settings', icon: '◌' },
];

export default function Sidebar({ page, setPage, leads }) {
  const followupsDue = leads.filter(l => {
    if (!l.follow_up_date) return false;
    const today = new Date().toDateString();
    return new Date(l.follow_up_date).toDateString() === today;
  }).length;

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 50, overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--gold)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>🏠</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--white)', lineHeight: 1.2 }}>Clear Path</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--gold)', lineHeight: 1.2 }}>Home Buyers</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Your clear path to closing deals
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: page === item.id ? 'rgba(232,160,32,0.15)' : 'transparent',
            color: page === item.id ? 'var(--gold)' : 'rgba(255,255,255,0.6)',
            fontFamily: 'DM Sans', fontSize: 14, fontWeight: page === item.id ? 500 : 400,
            marginBottom: 2, transition: 'all 0.15s', textAlign: 'left',
            borderLeft: page === item.id ? '2px solid var(--gold)' : '2px solid transparent'
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.id === 'followups' && followupsDue > 0 && (
              <span style={{
                background: 'var(--gold)', color: 'var(--navy)', borderRadius: 10,
                padding: '1px 7px', fontSize: 11, fontWeight: 700
              }}>{followupsDue}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Andy Johnson</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>UT · TX · CO · AZ</div>
      </div>
    </aside>
  );
}
