export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/highscores?order=score.desc&limit=10`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
      }
    }
  );
  
  const scores = await response.json();
  res.status(200).json(scores);
}