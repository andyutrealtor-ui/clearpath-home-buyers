// Proxies RentCast's sale-listings search so the API key stays on the server.
// Set RENTCAST_API_KEY in Vercel → Project → Settings → Environment Variables.
const STATES = new Set(['UT', 'TX', 'CO', 'AZ']);
const PROPERTY_TYPES = 'Single Family|Townhouse|Condo|Multi-Family|Manufactured';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Off unless RENTCAST_APP_ENABLED=true in Vercel. The free RentCast tier is 50
  // requests/month and the daily scheduled tasks already use most of it, so manual
  // searches from the app would push the account into paid overage.
  if (process.env.RENTCAST_APP_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Manual RentCast search is turned off to stay within the free 50 requests/month. New leads arrive in HubSpot from the daily task. To turn it on, set RENTCAST_APP_ENABLED=true in Vercel.' });
  }

  const key = process.env.RENTCAST_API_KEY;
  if (!key) return res.status(500).json({ error: 'RENTCAST_API_KEY is not set in Vercel environment variables.' });

  const { city, state, daysOld = '50:59', price = '*:400000', limit = 500 } = req.body || {};
  if (!STATES.has(state)) return res.status(400).json({ error: 'state must be one of UT, TX, CO, AZ' });
  if (!city || typeof city !== 'string') return res.status(400).json({ error: 'city required' });
  const RANGE = /^(\d+|\*):(\d+|\*)$|^\d+$/;
  if (!RANGE.test(String(daysOld))) return res.status(400).json({ error: 'bad daysOld range' });
  if (!RANGE.test(String(price))) return res.status(400).json({ error: 'bad price range' });

  const params = new URLSearchParams({
    city,
    state,
    status: 'Active',
    daysOld: String(daysOld),
    price: String(price),
    propertyType: PROPERTY_TYPES,
    limit: String(Math.min(Math.max(Number(limit) || 50, 1), 500)),
  });

  try {
    const r = await fetch(`https://api.rentcast.io/v1/listings/sale?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.message || data?.error || `RentCast error ${r.status}` });
    }
    return res.status(200).json({ listings: Array.isArray(data) ? data : [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
