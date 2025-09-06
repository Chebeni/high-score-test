export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/highscores?select=player_name,score&order=score.desc&limit=10`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    const rows = await r.json();
    const lines = rows
      .map((row, i) => `${i + 1}. ${row.player_name} — ${row.score}`)
      .join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(lines || 'No scores yet');
  } catch {
    return res.status(500).json({ error: 'Fetch failed' });
  }
}
