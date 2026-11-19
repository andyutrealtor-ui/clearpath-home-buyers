// Shared deal math for the ARV → MAO → LOI workflow. Pure functions, no UI.

export const money = (n) => (Number.isFinite(n) ? '$' + Math.round(n).toLocaleString() : '—');

export const emptyComp = () => ({ address: '', sqft: '', bdba: '', price: '', date: '', condition: 'similar' });

// Comp condition compared with the subject AFTER repairs.
// A comp in worse shape sold for less than the repaired subject would → adjust it up.
const CONDITION_ADJ = { inferior: 0.10, similar: 0, superior: -0.10 };

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function arvFromComps(comps = [], subjectSqft) {
  const rows = comps.map((c) => {
    const sqft = Number(c.sqft);
    const price = Number(c.price);
    if (!(sqft > 0) || !(price > 0)) return null;
    const ppsf = price / sqft;
    const adj = CONDITION_ADJ[c.condition] ?? 0;
    const base = subjectSqft > 0 ? ppsf * subjectSqft : price;
    return { ppsf, adjusted: base * (1 + adj) };
  });
  const values = rows.filter(Boolean).map((r) => r.adjusted);
  if (!values.length) return { rows, count: 0, low: null, mid: null, high: null, avgPpsf: null };
  const mid = median(values);
  return {
    rows,
    count: values.length,
    low: Math.min(...values),
    mid,
    high: Math.max(...values),
    avgPpsf: subjectSqft > 0 ? values.reduce((a, b) => a + b, 0) / values.length / subjectSqft : null,
  };
}

export function compWarnings(comps = [], subjectSqft, today = new Date()) {
  const w = [];
  const valid = comps.filter((c) => Number(c.sqft) > 0 && Number(c.price) > 0);
  if (!(subjectSqft > 0)) w.push("Enter the subject property's sqft — comps are scaled to it.");
  if (valid.length > 0 && valid.length < 3) w.push(`Only ${valid.length} comp${valid.length > 1 ? 's' : ''}. Use at least 3 for a reliable ARV.`);
  valid.forEach((c, i) => {
    const name = c.address || `Comp ${comps.indexOf(c) + 1}`;
    if (!c.date) w.push(`${name}: add the sold date.`);
    else {
      const days = (today - new Date(c.date)) / 86400000;
      if (days > 183) w.push(`${name}: sold ${Math.round(days / 30)} months ago — older than 6 months.`);
      if (days < 0) w.push(`${name}: sold date is in the future.`);
    }
    if (subjectSqft > 0) {
      const diff = Math.abs(Number(c.sqft) - subjectSqft) / subjectSqft;
      if (diff > 0.2) w.push(`${name}: ${Math.round(diff * 100)}% different in size from the subject — less reliable.`);
    }
  });
  const r = arvFromComps(comps, subjectSqft);
  if (r.count >= 2 && r.mid && (r.high - r.low) / r.mid > 0.25) {
    w.push('Comps are more than 25% apart — check for an outlier or a mismatched condition.');
  }
  return w;
}

// Rough rehab budget by scope, per sqft. Editable defaults.
export const REPAIR_LEVELS = [
  { id: 'cosmetic', label: 'Cosmetic', perSqft: 15, desc: 'Paint, flooring, fixtures' },
  { id: 'moderate', label: 'Moderate', perSqft: 30, desc: '+ kitchen/baths, some systems' },
  { id: 'heavy', label: 'Heavy', perSqft: 50, desc: 'Roof, HVAC, structural, full gut' },
];

export function repairEstimate(levelId, sqft) {
  const l = REPAIR_LEVELS.find((x) => x.id === levelId);
  return l && sqft > 0 ? Math.round(l.perSqft * sqft) : null;
}

// MAO = ARV × rule% − repairs − wholesale fee (Clear Path's standard: 70% and $10,000).
export function calcMAO({ arv, repairs = 0, fee = 10000, pct = 70 }) {
  const a = Number(arv);
  if (!(a > 0)) return null;
  return a * (Number(pct) / 100) - (Number(repairs) || 0) - (Number(fee) || 0);
}
