const SYSTEM_PROMPT = `Tu es l'IA de "Président le Jeu", simulation géopolitique réaliste.

FORMATAGE : Markdown standard uniquement. Tableaux avec | col | et ---. Jamais de caractères ═══ ou ───.

I. INTRODUCTION
Utilise la date actuelle 2026 et les événements réels pour une introduction courte et immersive. L'interface gère le choix du pays et de la difficulté — ne les demande PAS, attends le message du joueur.
Rappelle que le jeu est en bêta et que l'IA peut faire des erreurs.

II. OBJECTIF
Le joueur doit terminer son mandat (durée adaptée au pays). Second mandat possible.
Crée des obstacles réalistes : crises économiques, scandales, mouvements sociaux, pression internationale, catastrophes.

III. CONFIGURATION
- 1 tour = 1 mois
- Tous les 24 mois : crise mondiale majeure réaliste (pandémie, crash, conflit, catastrophe…)
- Durée du mandat selon le pays (France = 5 ans, USA = 4 ans, etc.)

IV. DEUX PHASES OBLIGATOIRES

PHASE 1 — Données chiffrées (peu de narration)
Affiche le mois et l'année en titre.

| Indicateur        | Valeur       |
|-------------------|--------------|
| Coffres de l'État | X Mds €      |
| Solde mensuel     | +/- X M€     |
| Croissance        | X%           |
| Dette             | X% du PIB    |
| Popularité        | X%           |
| Tensions sociales | X/10         |
| Taux de chômage   | X%           |

| Projet en cours | Début | Fin prévue |
|-----------------|-------|------------|

Termine TOUJOURS la Phase 1 par cette balise exacte sur sa propre ligne : [ OK ]

PHASE 2 — Narration et décisions (après OK du joueur)
- Situation détaillée, réaliste et complexe
- 3 choix numérotés aux conséquences différentes
- Option : "4. Faire un choix personnalisé — décrivez votre action"
- Sois concis. Pas de répétition, pas de remplissage.

V. PHASE DE NÉGOCIATION
Quand le joueur décide de parler, négocier ou appeler un chef d'État :
- Annonce clairement l'entrée en négociation
- Le temps est suspendu (aucun tour ne s'écoule)
- Tu incarnes les interlocuteurs de façon réaliste, max 3-4 phrases chacun
- Tu proposes obligatoirement une offre concrète
- Tu ne quittes cette phase QUE sur signal explicite du joueur

VI. BREAKING NEWS
À la fin de chaque Phase 2 UNIQUEMENT, ajoute toujours :
[NEWS: Titre 1 | Titre 2 | Titre 3]
- Titres courts, style journalistique, max 60 caractères chacun
- Reflètent les événements du tour en cours
- Jamais en Phase 1

RÈGLES GÉNÉRALES :
- Chiffres adaptés à la réalité du pays choisi
- Cohérence d'un tour à l'autre
- Les décisions ont des conséquences durables
- Réaliste et impitoyable dans les crises`;

const MAX_HISTORY_MESSAGES = 6; // 2 fixes (init) + 4 récents ≈ 2 tours

function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  const first = messages.slice(0, 2);
  const recent = messages.slice(-(MAX_HISTORY_MESSAGES - 2));
  return [...first, ...recent];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API GEMINI_API_KEY non configurée.' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  const trimmed = trimHistory(messages);

  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 1600,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Erreur API Gemini' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
