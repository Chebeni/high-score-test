export default async function handler(req, res) {
  // CORS (and preflight for browsers)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- Normalise body (handles Construct Dictionary + plain JSON) ---
  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
  } catch (_) {}
  if (body && body.c2dictionary && body.data) body = body.data;

  let name = ((body?.name ?? '') + '').trim();
  let score = Number(body?.score);

  if (!name || !Number.isFinite(score)) {
    return res.status(400).json({ error: 'Invalid data', detail: { name, score } });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/highscores`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        player_name: name,
        score: Math.trunc(score),
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: 'Supabase insert failed', detail: txt });
    }

    const row = await r.json();
    return res.status(200).json({ success: true, row });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save score', message: String(err) });
  }
}
