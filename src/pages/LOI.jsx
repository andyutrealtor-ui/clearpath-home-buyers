import React, { useState } from 'react';

const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function LOI({ leads, settings }) {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [form, setForm] = useState({
    offer_price: '',
    earnest_money: '500',
    close_days: '14',
    inspection_days: '7',
    seller_name: '',
    seller_email: '',
    seller_phone: '',
    property_address: '',
    city: '',
    state: '',
    zip: '',
    as_is: true,
    assignment: true,
    notes: '',
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
      seller_email: lead.email || '',
      property_address: lead.property_address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip: lead.zip || '',
      offer_price: lead.offer_made ? String(lead.offer_made) : lead.mao ? String(Math.round(lead.mao)) : '',
    }));
  };

  const generateLOI = () => {
    const buyerName = settings?.name || 'Andy Johnson';
    const buyerPhone = settings?.phone || '';
    const buyerEmail = settings?.email || '';

    return `LETTER OF INTENT TO PURCHASE REAL ESTATE
As-Is Cash Offer

Date: ${today}

SELLER: ${form.seller_name || '[Seller Name]'}
BUYER: ${buyerName} / Clear Path Home Buyers

PROPERTY: ${form.property_address}, ${form.city}, ${form.state} ${form.zip}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${form.seller_name || 'Property Owner'},

Clear Path Home Buyers is pleased to present this Letter of Intent to purchase the above-referenced property under the following terms:

PURCHASE PRICE: $${Number(form.offer_price).toLocaleString()}

TERMS:
• All-cash purchase — no financing contingency
• Property purchased strictly AS-IS, WHERE-IS
• No repairs, updates, or cleaning required from seller
• Seller pays NO commissions or real estate fees
• Earnest Money Deposit: $${Number(form.earnest_money).toLocaleString()} upon execution of purchase agreement
• Inspection Period: ${form.inspection_days} days from contract execution
• Closing Timeline: ${form.close_days} business days from end of inspection period
${form.assignment ? '• Buyer reserves the right to assign this contract to a third party' : ''}

WHAT THIS MEANS FOR YOU:
✓ Fast, hassle-free closing
✓ No showings, no open houses, no waiting
✓ Walk away with cash in hand
✓ We handle all closing costs

${form.notes ? `ADDITIONAL NOTES:\n${form.notes}\n` : ''}
This Letter of Intent is non-binding and is intended to outline the general terms for a formal Purchase and Sale Agreement. This offer is valid for 5 business days from the date above.

We look forward to working with you and making this a smooth, simple transaction.

Respectfully,

${buyerName}
Clear Path Home Buyers
${buyerPhone ? `📞 ${buyerPhone}` : ''}
${buyerEmail ? `✉️ ${buyerEmail}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELLER ACKNOWLEDGMENT (optional)

I/We have reviewed this Letter of Intent and agree to move forward with a formal Purchase Agreement.

Seller Signature: _________________________ Date: ___________

Printed Name: _________________________`;
  };

  const handleSendEmail = () => {
    const loi = generateLOI();
    const subject = `Cash Offer — ${form.property_address}, ${form.city}, ${form.state}`;
    const body = encodeURIComponent(loi);
    const to = form.seller_email || '';
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`);
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLOI());
    alert('LOI copied to clipboard — paste into a text or email');
  };

  const activeLeads = leads.filter(l => l.status !== 'Dead');

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>LOI Generator</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
          As-Is Cash Offer — Letter of Intent
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Left — Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pull from lead */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>📋 Pull from Lead</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select a Lead</label>
                <select className="form-select" value={selectedLeadId} onChange={e => fillFromLead(e.target.value)}>
                  <option value="">— Choose a lead —</option>
                  {activeLeads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.property_address}, {l.city} {l.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Offer terms */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>💰 Offer Terms</h2></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Offer Price ($)', field: 'offer_price', type: 'number', span: 2 },
                { label: 'Earnest Money ($)', field: 'earnest_money', type: 'number' },
                { label: 'Close in (days)', field: 'close_days', type: 'number' },
                { label: 'Inspection Period (days)', field: 'inspection_days', type: 'number' },
              ].map(f => (
                <div key={f.field} className="form-group" style={f.span ? { gridColumn: `span ${f.span}` } : {}}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type} value={form[f.field]} onChange={e => update(f.field, e.target.value)} />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.as_is} onChange={e => update('as_is', e.target.checked)} />
                  As-Is Purchase
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.assignment} onChange={e => update('assignment', e.target.checked)} />
                  Assignment Clause
                </label>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>👤 Seller Info</h2></div>
            <div className="card-body" style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Seller Name', field: 'seller_name' },
                { label: 'Seller Email', field: 'seller_email' },
                { label: 'Seller Phone', field: 'seller_phone' },
              ].map(f => (
                <div key={f.field} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" value={form[f.field]} onChange={e => update(f.field, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Property */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>🏠 Property</h2></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Address', field: 'property_address', span: 2 },
                { label: 'City', field: 'city' },
                { label: 'State', field: 'state' },
                { label: 'ZIP', field: 'zip' },
              ].map(f => (
                <div key={f.field} className="form-group" style={f.span ? { gridColumn: `span ${f.span}` } : {}}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" value={form[f.field]} onChange={e => update(f.field, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: 14, fontWeight: 700 }}>📝 Additional Notes</h2></div>
            <div className="card-body">
              <textarea className="form-textarea" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any special terms or notes to include..." />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setPreview(!preview)}>
              {preview ? '🙈 Hide Preview' : '👁️ Preview LOI'}
            </button>
            <button className="btn btn-primary" onClick={handleCopy}>
              📋 Copy LOI
            </button>
            <button className="btn btn-gold btn-lg" onClick={handleSendEmail} disabled={!form.offer_price}>
              📧 Send Offer Email
            </button>
          </div>

          {sent && (
            <div style={{ padding: 12, background: '#D1FAE5', borderRadius: 8, fontSize: 13, color: '#059669', fontWeight: 500 }}>
              ✅ Email client opened with your LOI. Review and hit send!
            </div>
          )}

          {!form.seller_email && form.offer_price && (
            <div style={{ padding: 12, background: '#FEF3C7', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
              💡 No seller email — use "Copy LOI" to paste into a text message or your email manually.
            </div>
          )}
        </div>

        {/* Right — Preview */}
        <div>
          {preview && (
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <div className="card-header">
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>LOI Preview</h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clear Path Home Buyers</span>
              </div>
              <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <pre style={{
                  whiteSpace: 'pre-wrap', fontFamily: 'DM Sans', fontSize: 12,
                  lineHeight: 1.8, color: 'var(--text-primary)'
                }}>
                  {form.offer_price ? generateLOI() : 'Enter an offer price to preview your LOI'}
                </pre>
              </div>
            </div>
          )}

          {!preview && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Your LOI will appear here</div>
              <div style={{ fontSize: 13 }}>Fill in the offer terms and click Preview LOI</div>
              <div style={{ marginTop: 24, padding: 16, background: 'var(--gray-100)', borderRadius: 10, textAlign: 'left', fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Quick steps:</div>
                <div>1. Select a lead to auto-fill the form</div>
                <div>2. Set your offer price</div>
                <div>3. Add seller email if you have it</div>
                <div>4. Click Send Offer Email or Copy LOI</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
