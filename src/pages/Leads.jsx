import React, { useState } from 'react';
import LeadDetail from '../components/LeadDetail';
import { sourceColors, statusColors } from '../data/leads';

const statusOptions = ['All', 'New', 'Called', 'Follow-up', 'Negotiating', 'Under Contract', 'Dead'];
const stateOptions = ['All', 'TX', 'UT', 'CO', 'AZ'];
const sourceOptions = ['All', 'Pre-Foreclosure', 'Abandoned', 'Stale Listing', 'Cold Call'];

export default function Leads({ leads, setLeads, selectedLead, setSelectedLead }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({
    owner_name: '', property_address: '', city: '', state: 'TX', zip: '', phone: '', email: '',
    source: 'Cold Call', asking_price: '', arv: '', repair_estimate: '', status: 'New', urgency_score: 5,
    days_to_auction: '', follow_up_date: '', follow_up_note: '', call_notes: '', seller_summary: '',
    lender: '', loan_amount: '', offer_made: '', mao: '', equity_percent: '', filing_date: '',
    auction_date: '', skip_trace_phone: '', skip_trace_email: '', skip_trace_confidence: ''
  });

  const filtered = leads.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (stateFilter !== 'All' && l.state !== stateFilter) return false;
    if (sourceFilter !== 'All' && l.source !== sourceFilter) return false;
    if (search && !`${l.property_address} ${l.city} ${l.phone} ${l.owner_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.urgency_score - a.urgency_score);

  const updateLead = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const deleteLead = (id) => {
    const confirmed = window.confirm('Remove this lead from your pipeline?');
    if (confirmed) {
      setLeads(prev => {
        const updated = prev.filter(l => String(l.id) !== String(id));
        return updated;
      });
      setSelectedLead(null);
    }
  };

  const addLead = () => {
    const lead = { ...newLead, id: Date.now(), date_added: new Date().toISOString(), last_contacted: '',
      asking_price: +newLead.asking_price || null, arv: +newLead.arv || null,
      repair_estimate: +newLead.repair_estimate || null, days_to_auction: +newLead.days_to_auction || null,
      urgency_score: +newLead.urgency_score || 5
    };
    setLeads(prev => [...prev, lead]);
    setShowAdd(false);
    setNewLead({ owner_name: '', property_address: '', city: '', state: 'TX', zip: '', phone: '', email: '',
      source: 'Cold Call', asking_price: '', arv: '', repair_estimate: '', status: 'New', urgency_score: 5,
      days_to_auction: '', follow_up_date: '', follow_up_note: '', call_notes: '', seller_summary: '',
      lender: '', loan_amount: '', offer_made: '', mao: '', equity_percent: '', filing_date: '',
      auction_date: '', skip_trace_phone: '', skip_trace_email: '', skip_trace_confidence: '' });
  };

  const urgencyClass = (score) => score >= 7 ? 'hot' : score >= 5 ? 'warm' : 'cool';

  const exportCSV = () => {
    const headers = ['First Name','Last Name','Property Address','City','State','Zip','Phone','Email','Asking Price','ARV','Source','Status','Notes'];
    const rows = filtered.map(l => {
      const nameParts = (l.owner_name || 'Unknown').split(' ');
      return [
        nameParts[0] || 'Unknown',
        nameParts.slice(1).join(' ') || '',
        l.property_address || '',
        l.city || '',
        l.state || '',
        l.zip || '',
        l.phone || '',
        l.email || '',
        l.asking_price || '',
        l.arv || '',
        l.source || '',
        l.status || '',
        l.seller_summary || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearpath-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Leads <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length})</span></h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={exportCSV}>⬇️ Export CSV</button>
          <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
        {[
          { label: 'Status', val: statusFilter, set: setStatusFilter, opts: statusOptions },
          { label: 'State', val: stateFilter, set: setStateFilter, opts: stateOptions },
          { label: 'Source', val: sourceFilter, set: setSourceFilter, opts: sourceOptions },
        ].map(f => (
          <select key={f.label} className="form-select" style={{ width: 'auto' }} value={f.val} onChange={e => f.set(e.target.value)}>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Address</th>
                <th>State</th>
                <th>Phone</th>
                <th>Asking</th>
                <th>ARV</th>
                <th>Source</th>
                <th>Status</th>
                <th>Follow-Up</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                  <td>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: lead.urgency_score >= 7 ? '#FEE2E2' : lead.urgency_score >= 5 ? '#FEF3C7' : '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12,
                      color: lead.urgency_score >= 7 ? '#DC2626' : lead.urgency_score >= 5 ? '#D97706' : '#059669'
                    }}>{lead.urgency_score}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.property_address}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.city}</div>
                  </td>
                  <td><span className={`badge badge-${lead.state === 'TX' ? 'amber' : lead.state === 'UT' ? 'blue' : lead.state === 'CO' ? 'green' : 'red'}`}>{lead.state}</span></td>
                  <td><a href={`tel:${lead.phone}`} style={{ color: 'var(--navy)', fontSize: 13 }} onClick={e => e.stopPropagation()}>{lead.phone}</a></td>
                  <td>{lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : '—'}</td>
                  <td>{lead.arv ? `$${lead.arv.toLocaleString()}` : '—'}</td>
                  <td><span className={`badge badge-${lead.source === 'Pre-Foreclosure' ? 'red' : lead.source === 'Abandoned' ? 'purple' : lead.source === 'Stale Listing' ? 'amber' : 'gray'}`}>{lead.source}</span></td>
                  <td>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: lead.status === 'Under Contract' ? '#D1FAE5' : lead.status === 'Dead' ? '#F3F4F6' : lead.status === 'Negotiating' ? '#FEE2E2' : lead.status === 'New' ? '#DBEAFE' : '#FEF3C7',
                      color: lead.status === 'Under Contract' ? '#059669' : lead.status === 'Dead' ? '#6B7280' : lead.status === 'Negotiating' ? '#DC2626' : lead.status === 'New' ? '#2563EB' : '#D97706'
                    }}>{lead.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: lead.follow_up_date ? 'var(--amber)' : 'var(--text-muted)' }}>
                    {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteLead(lead.id); }}>✕</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No leads match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={updateLead} onDelete={deleteLead} />
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal fade-in">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add New Lead</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Owner Name', field: 'owner_name', type: 'text' },
                  { label: 'Phone', field: 'phone', type: 'text' },
                  { label: 'Property Address', field: 'property_address', type: 'text' },
                  { label: 'City', field: 'city', type: 'text' },
                  { label: 'ZIP', field: 'zip', type: 'text' },
                  { label: 'Asking Price', field: 'asking_price', type: 'number' },
                  { label: 'ARV', field: 'arv', type: 'number' },
                  { label: 'Repairs', field: 'repair_estimate', type: 'number' },
                ].map(f => (
                  <div key={f.field} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type={f.type} value={newLead[f.field]} onChange={e => setNewLead(p => ({ ...p, [f.field]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={newLead.state} onChange={e => setNewLead(p => ({ ...p, state: e.target.value }))}>
                    {['TX','UT','CO','AZ'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}>
                    {['Pre-Foreclosure','Abandoned','Stale Listing','Cold Call'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={addLead}>Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
