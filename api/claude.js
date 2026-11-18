export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, apiKey, useSearch, maxTokens, maxSearches } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  try {
    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: Math.min(Number(maxTokens) || 1000, 8000),
      messages: [{ role: 'user', content: prompt }],
    };

    if (useSearch) {
      const tool = { type: 'web_search_20250305', name: 'web_search' };
      if (maxSearches) tool.max_uses = Math.min(Number(maxSearches), 10);
      body.tools = [tool];
    }

    // Web search runs on Anthropic's side and can pause a long turn
    // (stop_reason "pause_turn"). Resend to let it finish, a few times at most.
    let data;
    const allContent = [];
    for (let i = 0; i < 4; i++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      data = await response.json();
      if (data.type === 'error' || !Array.isArray(data.content)) break;
      allContent.push(...data.content);
      if (data.stop_reason !== 'pause_turn') break;
      body.messages = [...body.messages, { role: 'assistant', content: data.content }];
    }

    if (allContent.length) data = { ...data, content: allContent };
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
