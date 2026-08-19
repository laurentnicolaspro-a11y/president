const BIN_ID = '69d40cc2aaba882197ce4da9';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MAX_SCORES = 20;

// Plafond cohérent avec le moteur : base max 6000 × multiplicateur max 3.
const SCORE_MAX = 18000;
const DIFFICULTES = [
  'Facile','Normal','Difficile','Réaliste',
  'Easy','Hard','Realistic','Fácil','Difícil','Realista','Leicht','Schwer','Realistisch'
];

// Limitation de débit en mémoire, par instance (voir la note dans api/chat.js).
const seau = new Map();
const MAX_SOUMISSIONS_PAR_HEURE = 10;

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || 'inconnu';
}

function tropDeSoumissions(ip) {
  const maintenant = Date.now();
  let hist = (seau.get(ip) || []).filter(t => maintenant - t < 3600000);
  if (hist.length >= MAX_SOUMISSIONS_PAR_HEURE) { seau.set(ip, hist); return true; }
  hist.push(maintenant);
  seau.set(ip, hist);
  if (seau.size > 5000) {
    for (const [k, v] of seau) if (!v.length || maintenant - v[v.length - 1] > 3600000) seau.delete(k);
  }
  return false;
}

function nettoyer(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f<>]/g, '')  // controles et chevrons
    .trim()
    .slice(0, max);
}

// Rejette les soumissions manifestement forgées. Note : sans session côté serveur, un
// score reste falsifiable par un joueur déterminé — ceci écarte le tout-venant et
// garantit surtout qu'aucune valeur aberrante ne peut casser l'affichage du classement.
function scoreInvalide({ name, score, diff, turns }) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0 || n > SCORE_MAX) return 'Score hors limites.';
  const t = Number(turns);
  if (!Number.isFinite(t) || t < 0 || t > 40) return 'Nombre de tours invalide.';
  if (diff && !DIFFICULTES.includes(String(diff))) return 'Difficulté inconnue.';
  if (!nettoyer(name, 30)) return 'Pseudo manquant.';
  return null;
}

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
    const { name, score, diff, turns, note } = req.body || {};
    if (!name || score === undefined) return res.status(400).json({ error: 'Données manquantes' });

    if (tropDeSoumissions(clientIp(req))) {
      res.setHeader('Retry-After', '600');
      return res.status(429).json({ error: 'Trop de soumissions.' });
    }

    const invalide = scoreInvalide({ name, score, diff, turns });
    if (invalide) return res.status(400).json({ error: invalide });

    try {
      // Récupérer les scores actuels
      const getResp = await fetch(JSONBIN_URL + '/latest', { headers });
      const getData = await getResp.json();
      const scores = getData.record?.scores || [];

      // Ajouter le nouveau score
      scores.push({
        name: nettoyer(name, 30),
        score: Math.round(Number(score)),
        diff: nettoyer(diff, 20),
        turns: Math.round(Number(turns || 0)),
        note: nettoyer(note, 40),
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
