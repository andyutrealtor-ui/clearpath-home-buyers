export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, apiKey } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'API key required' });

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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    // Debug: log what we got back
    console.log('API response type:', data.type);
    console.log('Stop reason:', data.stop_reason);
    console.log('Content blocks:', data.content?.map(b => b.type));
    const textBlocks = data.content?.filter(b => b.type === 'text') || [];
    console.log('Text content:', textBlocks.map(b => b.text?.substring(0, 200)));

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
