export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address, city, state, zip, owner_name, apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  const prompt = `You are a real estate skip trace assistant. Generate realistic contact information for a property owner based on public records data.

Property: ${address}, ${city}, ${state} ${zip}
Owner: ${owner_name || 'Unknown'}

Generate realistic but fictional contact data as if pulled from public records. Return ONLY this JSON, no other text:
{
  "phone_primary": "555-xxx-xxxx format",
  "phone_secondary": "555-xxx-xxxx or empty string",
  "email": "realistic email or empty string",
  "confidence": "Low",
  "notes": "One sentence about data source/quality"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';

    // Parse JSON from response
    let result = null;
    const strategies = [
      () => JSON.parse(text.trim()),
      () => JSON.parse(text.replace(/```json|```/g, '').trim()),
      () => JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)),
    ];
    for (const s of strategies) {
      try { result = s(); break; } catch { continue; }
    }

    if (result) return res.status(200).json(result);
    return res.status(200).json({ phone_primary: '', phone_secondary: '', email: '', confidence: 'Low', notes: 'Could not retrieve data' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
