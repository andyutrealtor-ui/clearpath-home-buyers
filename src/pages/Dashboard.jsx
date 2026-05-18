import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { statusColors, sourceColors } from '../data/leads';

export default function Dashboard({ leads, setPage, setSelectedLead }) {
  const active = leads.filter(l => l.status !== 'Dead');
  const newToday = leads.filter(l => new Date(l.date_added).toDateString() === new Date().toDateString());
  const underContract = leads.filter(l => l.status === 'Under Contract');
  const negotiating = leads.filter(l => l.status === 'Negotiating');
  const totalEquity = leads.reduce((sum, l) => sum + (l.arv && l.asking_price ? (l.arv - l.asking_price) : 0), 0);

  const today = new Date().toDateString();
  const followupsDue = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date).toDateString() === today);

  const topLeads = [...active].sort((a, b) => b.urgency_score - a.urgency_score).slice(0, 5);

  const stageData = [
    { stage: 'New', count: leads.filter(l => l.status === 'New').length },
    { stage: 'Called', count: leads.filter(l => l.status === 'Called').length },
    { stage: 'Follow-up', count: leads.filter(l => l.status === 'Follow-up').length },
    { stage: 'Negotiating', count: leads.filter(l => l.status === 'Negotiating').length },
    { stage: 'Contract', count: leads.filter(l => l.status === 'Under Contract').length },
  ];

  const stateData = ['TX', 'UT', 'CO', 'AZ'].map(s => ({
    state: s, count: leads.filter(l => l.state === s).length
  }));

  const urgencyData = [
    { name: 'Hot <30d', value: leads.filter(l => l.days_to_auction && l.days_to_auction < 30).length, color: '#EF4444' },
    { name: 'Warm 30-60d', value: leads.filter(l => l.days_to_auction && l.days_to_auction >= 30 && l.days_to_auction <= 60).length, color: '#F59E0B' },
    { name: 'Cool 60d+', value: leads.filter(l => !l.days_to_auction || l.days_to_auction > 60).length, color: '#10B981' },
  ].filter(d => d.value > 0);

  const openLead = (lead) => { setSelectedLead(lead); setPage('leads'); };

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>Command Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active Leads', value: active.length, sub: 'total pipeline' },
          { label: 'New Today', value: newToday.length, sub: 'added today' },
          { label: 'Follow-Ups Due', value: followupsDue.length, sub: 'need callback', alert: followupsDue.length > 0 },
          { label: 'Negotiating', value: negotiating.length, sub: 'active deals' },
          { label: 'Under Contract', value: underContract.length, sub: 'ready to assign', highlight: true },
          { label: 'Est. Equity', value: totalEquity > 0 ? `$${(totalEquity/1000).toFixed(0)}k` : '—', sub: 'in pipeline' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={s.highlight ? { borderColor: 'var(--gold)', borderWidth: 2 } : {}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.alert ? 'var(--amber)' : s.highlight ? 'var(--gold)' : 'var(--navy)', fontSize: typeof s.value === 'string' ? 22 : 28 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Today's Call Queue */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>🔥 Today's Call Queue</h2>
            <button className="btn btn-sm btn-outline" onClick={() => setPage('leads')}>View All</button>
          </div>
          <div>
            {topLeads.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No active leads yet</div>
            ) : topLeads.map(lead => (
              <div key={lead.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderBottom: '1px solid var(--gray-100)', cursor: 'pointer'
              }} onClick={() => openLead(lead)}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: lead.urgency_score >= 7 ? '#FEE2E2' : lead.urgency_score >= 5 ? '#FEF3C7' : '#D1FAE5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: lead.urgency_score >= 7 ? 'var(--red)' : lead.urgency_score >= 5 ? 'var(--amber)' : 'var(--green)',
                  flexShrink: 0
                }}>{lead.urgency_score}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }} className="truncate">{lead.property_address}, {lead.city}, {lead.state}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {lead.phone} · {lead.source} · {lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : 'No price'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Abandoned' ? 'purple' : 'gray'}`}>
                    {lead.source}
                  </span>
                  <a href={`tel:${lead.phone}`} className="btn btn-sm btn-gold" onClick={e => e.stopPropagation()}>
                    📞 Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Pipeline */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Pipeline</h2></div>
          <div className="card-body">
            {stageData.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.stage}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    height: 6, width: Math.max(s.count * 14, 4), background: 'var(--navy)',
                    borderRadius: 3, transition: 'width 0.3s'
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'right' }}>{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by State */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>By State</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stateData} barSize={28}>
                <XAxis dataKey="state" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <YAxis hide />
                <Tooltip cursor={false} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--navy)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: 15, fontWeight: 700 }}>Urgency</h2></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {urgencyData.length > 0 ? (
              <>
                <PieChart width={120} height={120}>
                  <Pie data={urgencyData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {urgencyData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {urgencyData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20, fontSize: 13 }}>
                No urgency data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-ups due today */}
      {followupsDue.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>⏰ Follow-Ups Due Today</h2>
          </div>
          <div>
            {followupsDue.map(lead => (
              <div key={lead.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderBottom: '1px solid var(--gray-100)', cursor: 'pointer'
              }} onClick={() => openLead(lead)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{lead.property_address}, {lead.city}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.follow_up_note || 'No note'}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>Due Today</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
