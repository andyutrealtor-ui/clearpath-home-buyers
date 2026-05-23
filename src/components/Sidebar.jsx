import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'search', label: 'Lead Search', icon: '⌕' },
  { id: 'leads', label: 'Leads', icon: '◉' },
  { id: 'followups', label: 'Follow-Ups', icon: '◷' },
  { id: 'arv', label: 'ARV Tool', icon: '◈' },
  { id: 'loi', label: 'Send Offer', icon: '✉' },
  { id: 'buyers', label: 'Cash Buyers', icon: '◎' },
  { id: 'team', label: 'Team', icon: '◌' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ page, setPage, leads, currentUser, onLogout }) {
  const followupsDue = leads.filter(l => {
    if (!l.follow_up_date) return false;
    return new Date(l.follow_up_date).toDateString() === new Date().toDateString();
  }).length;

  const newLeads = leads.filter(l => l.status === 'New').length;

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minHeight: '100vh', background: '#0A2342',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 50, borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--gold)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            flexShrink: 0, boxShadow: '0 2px 8px rgba(232,160,32,0.3)'
          }}>🏠</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#FFFFFF', lineHeight: 1.3 }}>Clear Path</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#E8A020', lineHeight: 1.3 }}>Properties LLC</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: 44 }}>
          Close more deals
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = page === item.id;
          const badge = item.id === 'followups' ? followupsDue : item.id === 'leads' ? newLeads : 0;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: isActive ? 'rgba(232,160,32,0.12)' : 'transparent',
              color: isActive ? '#E8A020' : 'rgba(255,255,255,0.55)',
              fontFamily: 'Inter', fontSize: 13, fontWeight: isActive ? 600 : 400,
              marginBottom: 1, transition: 'all 0.12s', textAlign: 'left',
              borderLeft: isActive ? '2px solid #E8A020' : '2px solid transparent'
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: item.id === 'followups' ? '#EF4444' : '#E8A020',
                  color: item.id === 'followups' ? 'white' : '#0A2342',
                  borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 700,
                  lineHeight: '18px', minWidth: 18, textAlign: 'center'
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'rgba(232,160,32,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#E8A020', flexShrink: 0
          }}>
            {(currentUser?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{currentUser?.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 11, padding: '6px 10px',
          cursor: 'pointer', fontFamily: 'Inter', textAlign: 'center', transition: 'all 0.12s'
        }}>Sign Out</button>
      </div>
    </aside>
  );
}
