export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read data sent from Construct
  let body = req.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  if (body && body.c2dictionary && body.data) {
    body = body.data;
  }

  // Clean player name
  const name = ((body?.name ?? '') + '')
    .trim()
    .toLowerCase()
    .slice(0, 14);

  // Race time in milliseconds
  const score = Math.trunc(Number(body?.score));

  if (!name || !Number.isFinite(score) || score <= 0) {
    return res.status(400).json({
      error: 'Invalid data',
      detail: { name, score }
    });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    // --------------------------------------------------
    // 1. Check whether this player already has a score
    // --------------------------------------------------

    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/race_highscores?player_name=eq.${encodeURIComponent(name)}&select=id,player_name,score&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY
        }
      }
    );

    if (!checkResponse.ok) {
      const txt = await checkResponse.text();

      return res.status(checkResponse.status).json({
        error: 'Failed to check existing score',
        detail: txt
      });
    }

    const existingRows = await checkResponse.json();

    // --------------------------------------------------
    // 2. Player already exists
    // --------------------------------------------------

    if (existingRows.length > 0) {
      const existing = existingRows[0];

      // New score is NOT faster.
      // Keep the old/better score.
      if (score >= existing.score) {
        return res.status(200).json({
          success: true,
          improved: false,
          score: existing.score,
          message: 'Existing best score kept'
        });
      }

      // New score IS faster.
      // Update their existing row.
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/race_highscores?id=eq.${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify({
            score: score
          })
        }
      );

      if (!updateResponse.ok) {
        const txt = await updateResponse.text();

        return res.status(updateResponse.status).json({
          error: 'Failed to update best score',
          detail: txt
        });
      }

      const updatedRow = await updateResponse.json();

      return res.status(200).json({
        success: true,
        improved: true,
        row: updatedRow
      });
    }

    // --------------------------------------------------
    // 3. New player — insert first score
    // --------------------------------------------------

    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/race_highscores`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          player_name: name,
          score: score
        })
      }
    );

    if (!insertResponse.ok) {
      const txt = await insertResponse.text();

      return res.status(insertResponse.status).json({
        error: 'Failed to insert score',
        detail: txt
      });
    }

    const newRow = await insertResponse.json();

    return res.status(200).json({
      success: true,
      improved: true,
      row: newRow
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to save score',
      message: String(err)
    });
  }
}
