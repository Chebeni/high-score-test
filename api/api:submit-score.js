export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { name, score } = req.body;
  
  // Basic validation
  if (!name || !score || name.length > 30) {
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
      },
      body: JSON.stringify({
        player_name: name,
        score: parseInt(score)
      })
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
}