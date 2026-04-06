import { kv } from '@vercel/kv';

const MAX_SCORES = 20;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — récupérer le classement
  if (req.method === 'GET') {
    try {
      const scores = await kv.get('leaderboard') || [];
      return res.status(200).json({ scores });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — soumettre un score
  if (req.method === 'POST') {
    const { name, score, diff, turns, note } = req.body;
    if (!name || !score) return res.status(400).json({ error: 'Données manquantes' });

    try {
      const scores = await kv.get('leaderboard') || [];

      scores.push({
        name: String(name).slice(0, 30),
        score: Math.round(Number(score)),
        diff: String(diff).slice(0, 20),
        turns: Number(turns),
        note: String(note).slice(0, 40),
        date: new Date().toISOString().slice(0, 10)
      });

      // Trier par score décroissant et garder les MAX_SCORES meilleurs
      scores.sort((a, b) => b.score - a.score);
      const top = scores.slice(0, MAX_SCORES);

      await kv.set('leaderboard', top);
      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
