const BIN_ID = '69d40cc2aaba882197ce4da9';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MAX_SCORES = 20;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.JSONBIN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé JSONBIN_API_KEY non configurée.' });

  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': apiKey,
    'X-Bin-Versioning': 'false'
  };

  // GET — récupérer le classement
  if (req.method === 'GET') {
    try {
      const resp = await fetch(JSONBIN_URL + '/latest', { headers });
      const data = await resp.json();
      return res.status(200).json({ scores: data.record?.scores || [] });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — soumettre un score
  if (req.method === 'POST') {
    const { name, score, diff, turns, note } = req.body;
    if (!name || score === undefined) return res.status(400).json({ error: 'Données manquantes' });

    try {
      // Récupérer les scores actuels
      const getResp = await fetch(JSONBIN_URL + '/latest', { headers });
      const getData = await getResp.json();
      const scores = getData.record?.scores || [];

      // Ajouter le nouveau score
      scores.push({
        name: String(name).slice(0, 30),
        score: Math.round(Number(score)),
        diff: String(diff || '').slice(0, 20),
        turns: Number(turns || 0),
        note: String(note || '').slice(0, 40),
        date: new Date().toISOString().slice(0, 10)
      });

      // Trier et garder les MAX_SCORES meilleurs
      scores.sort((a, b) => b.score - a.score);
      const top = scores.slice(0, MAX_SCORES);

      // Sauvegarder
      await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ scores: top })
      });

      return res.status(200).json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
