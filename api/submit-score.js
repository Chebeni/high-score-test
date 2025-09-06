// api/submit-score.js
export default async function handler(req, res) {
  // ---- CORS for browser + preflight ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ---- read & validate JSON body ----
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Body must be JSON' }); }
  }

  const name = (body.name ?? '').toString().trim();
  const s = Number(body.score); // allow 0

  if (!name || !Number.isFinite(s) || name.length > 30) {
    return res.status(400).json({ error: 'Invalid data', detail: { name, score: body.score } });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/highscores`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ player_name: name, score: s })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: 'Supabase insert failed', detail: txt });
    }

    const row = await r.json();
    return res.status(200).json({ success: true, row });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save score', detail: String(err) });
  }
}
