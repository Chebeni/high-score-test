export default async function handler(req, res) {
  // CORS for browser + preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---- read JSON body ----
  const { name, score } = req.body || {};
  if (!name || !Number.isFinite(+score)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/highscores`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ player_name: name, score: parseInt(score, 10) })
    });

    if (!response.ok) {
      const txt = await response.text();
      return res.status(response.status).json({ error: txt || 'Supabase insert failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save score' });
  }
}
