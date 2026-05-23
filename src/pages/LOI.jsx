import React, { useState } from 'react';

const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const expires = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function LOI({ leads, settings }) {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [form, setForm] = useState({
    offer_price: '', earnest_money: '1500', close_days: '30',
    inspection_days: '14', seller_name: '', seller_email: '',
    seller_phone: '', property_address: '', city: '', state: '',
    zip: '', property_type: 'Single Family Residential',
    assignment: true, notes: '',
  });
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fillFromLead = (id) => {
    setSelectedLeadId(id);
    const lead = leads.find(l => String(l.id) === String(id));
    if (!lead) return;
    setForm(p => ({
      ...p,
      seller_name: lead.owner_name !== 'Unknown' ? lead.owner_name : '',
      seller_phone: lead.phone || '',
      seller_email: lead.email || lead.skip_trace_email || '',
      property_address: lead.property_address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip: lead.zip || '',
      offer_price: lead.offer_made ? String(lead.offer_made) : lead.mao ? String(Math.round(lead.mao)) : '',
    }));
  };

  const buyerName = settings?.name || 'Andy Johnson';
  const buyerPhone = settings?.phone || '';
  const buyerEmail = settings?.email || '';

  const generateLOI = () => `LETTER OF INTENT
As-Is Cash Purchase Offer

Date: ${today}
Offer Valid Until: ${expires}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TO:     ${form.seller_name || '[Seller / Seller\'s Agent]'}
FROM:   ${buyerName}, Clear Path Properties LLC
RE:     Letter of Intent to Purchase Real Property

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${form.seller_name || 'Seller / Seller\'s Representative'},

Thank you for taking the time to speak with us. Clear Path Properties LLC is pleased to present this Letter of Intent to purchase the property described below. We specialize in straightforward, as-is cash closings — no repairs required, no agent commissions charged to the seller, and no financing contingencies. Our goal is to make this as simple and stress-free as possible for you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPERTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Address:          ${form.property_address || '[Property Address]'}
City, State ZIP:  ${form.city || '[City]'}, ${form.state || '[State]'} ${form.zip || '[ZIP]'}
Property Type:    ${form.property_type}
Condition:        As-Is — no repairs required from Seller

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFFER TERMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Purchase Price:       $${form.offer_price ? Number(form.offer_price).toLocaleString() : '___________'} (All Cash)
Earnest Money:        $${Number(form.earnest_money).toLocaleString()} — non-refundable after inspection period,
                      submitted upon execution of Purchase Agreement
Inspection Period:    ${form.inspection_days} business days from execution of Purchase Agreement
Closing Date:         On or before ${form.close_days} days from effective date of agreement
Title Company:        Seller's choice of title company
Closing Costs:        Each party responsible for their own closing costs
Commission:           No real estate commission charged to Seller${form.assignment ? `
Assignment:           Buyer reserves the right to assign this contract to a third party` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONDITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Clear and marketable title free of undisclosed liens or encumbrances
• Satisfactory results of buyer's inspection during the inspection period
• Seller to provide property access within 5 business days of execution
• Property delivered in same condition as of the date of this Letter of Intent
• No new liens or encumbrances to be placed on property prior to closing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THIS MEANS FOR YOU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ No repairs or cleaning required — sell completely as-is, in any condition
✓ No agent commissions — you keep more of the sale price
✓ No financing contingencies — cash offer, no bank approval needed
✓ Fast closing — close in as little as ${form.close_days} days or on your timeline
✓ Simple process — no showings, no open houses, no waiting on the market

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Review this LOI and contact us with any questions or counter-proposals
2. If terms are acceptable, we deliver a formal Purchase Agreement within 48 hours
3. Once the Purchase Agreement is signed, earnest money is submitted
4. Inspection scheduled within 5 business days of execution
5. We close on or before the agreed closing date — cash at the table

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLOSURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Letter of Intent is NON-BINDING and is intended solely to outline general terms under which the parties would proceed to a formal Purchase and Sale Agreement. Neither party shall be legally obligated unless a formal Purchase and Sale Agreement is fully executed by both parties.

This offer is valid for 5 business days from ${today} and expires ${expires}.
${form.notes ? `\nADDITIONAL NOTES:\n${form.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUYER                                    SELLER

_____________________________            _____________________________
${buyerName}                             ${form.seller_name || '[Seller Name]'}
Clear Path Properties LLC
dba Clear Path Home Buyers

_____________________________            _____________________________
Signature                                Signature

_____________________________            _____________________________
Date                                     Date
${buyerPhone ? `\n📞 ${buyerPhone}` : ''}${buyerEmail ? `\n✉️  ${buyerEmail}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a non-binding Letter of Intent only. Consult a licensed real estate 
attorney before signing any binding agreement.
Clear Path Properties LLC  |  clearpath-home-buyers.vercel.app`;

  const handleSendEmail = () => {
    const subject = `Cash Offer — ${form.property_address}, ${form.city}, ${form.state} | Clear Path Properties LLC`;
    window.open(`mailto:${form.seller_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(generateLOI())}`);
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLOI());
    alert('✅ LOI copied to clipboard — paste into a text or email');
  };

  const activeLeads = leads.filter(l => l.status !== 'Dead');

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>LOI Generator</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>As-Is Cash Purchase — Letter of Intent</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>

        {/* Left — Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Pull from lead */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>📋 Pull from Lead</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select a Lead</label>
                <select className="form-select" value={selectedLeadId} onChange={e => fillFromLead(e.target.value)}>
                  <option value="">— Choose a lead —</option>
                  {activeLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.property_address}, {l.city} {l.state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Offer Terms */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>💰 Offer Terms</h2></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Offer Price ($) *</label>
                <input className="form-input" type="number" value={form.offer_price} onChange={e => update('offer_price', e.target.value)} placeholder="35000" />
              </div>
              <div className="form-group">
                <label className="form-label">Earnest Money ($)</label>
                <input className="form-input" type="number" value={form.earnest_money} onChange={e => update('earnest_money', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Close In (days)</label>
                <input className="form-input" type="number" value={form.close_days} onChange={e => update('close_days', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Inspection Period (business days)</label>
                <input className="form-input" type="number" value={form.inspection_days} onChange={e => update('inspection_days', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Property Type</label>
                <select className="form-select" value={form.property_type} onChange={e => update('property_type', e.target.value)}>
                  {['Single Family Residential','Multi-Family','Condo','Townhouse','Land'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.assignment} onChange={e => update('assignment', e.target.checked)} />
                  Include Assignment Clause
                </label>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>👤 Seller Info</h2></div>
            <div className="card-body" style={{ display: 'grid', gap: 12 }}>
              {[['seller_name','Seller Name'],['seller_email','Seller Email'],['seller_phone','Seller Phone']].map(([f,l]) => (
                <div key={f} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={form[f]} onChange={e => update(f, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Property */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>🏠 Property</h2></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.property_address} onChange={e => update('property_address', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={e => update('state', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP</label>
                <input className="form-input" value={form.zip} onChange={e => update('zip', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>📝 Additional Notes</h2></div>
            <div className="card-body">
              <textarea className="form-textarea" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any special terms or notes..." />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setPreview(!preview)}>
              {preview ? '🙈 Hide' : '👁️ Preview'}
            </button>
            <button className="btn btn-primary" onClick={handleCopy}>📋 Copy LOI</button>
            <button className="btn btn-gold" onClick={handleSendEmail} disabled={!form.offer_price} style={{ flex: 1, justifyContent: 'center' }}>
              📧 Send Offer Email
            </button>
          </div>

          {sent && (
            <div style={{ padding: 12, background: '#D1FAE5', borderRadius: 8, fontSize: 13, color: '#059669', fontWeight: 500 }}>
              ✅ Email client opened — review and hit send!
            </div>
          )}
          {!form.seller_email && form.offer_price && (
            <div style={{ padding: 10, background: '#FEF3C7', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
              💡 No seller email — use Copy LOI and paste into a text or email manually
            </div>
          )}
        </div>

        {/* Right — Preview */}
        <div>
          {preview && form.offer_price ? (
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <div className="card-header">
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>LOI Preview</h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clear Path Properties LLC</span>
              </div>
              <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: 20 }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'DM Sans', fontSize: 12, lineHeight: 1.8, color: 'var(--text-primary)' }}>
                  {generateLOI()}
                </pre>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={handleCopy}>📋 Copy</button>
                <button className="btn btn-gold btn-sm" onClick={handleSendEmail}>📧 Send</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Your LOI will appear here</div>
              <div style={{ fontSize: 13, marginBottom: 24 }}>Fill in the offer terms and click Preview</div>
              <div style={{ padding: 16, background: 'var(--gray-100)', borderRadius: 10, textAlign: 'left', fontSize: 13, maxWidth: 280, margin: '0 auto' }}>
                <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--navy)' }}>Quick steps:</div>
                <div style={{ marginBottom: 6 }}>1. Select a lead to auto-fill</div>
                <div style={{ marginBottom: 6 }}>2. Set your offer price</div>
                <div style={{ marginBottom: 6 }}>3. Add seller email if you have it</div>
                <div style={{ marginBottom: 6 }}>4. Click Preview LOI</div>
                <div>5. Send or copy</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
