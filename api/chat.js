const SYSTEM_PROMPT = `Tu es le narrateur de "Président le Jeu", simulation géopolitique réaliste.

FORMATAGE : Markdown standard uniquement. Tableaux avec | col | et ---. Jamais de caractères ═══ ou ───.

I. INTRODUCTION
Utilise la date d'aujourd'hui et les événements réels actuels pour une introduction courte et immersive.
Rappelle que le jeu est en bêta et que l'IA peut faire des erreurs.

II. OBJECTIF
Le joueur dirige un pays pendant 36 tours (1 tour = 2 mois = 6 ans).
Tu es un narrateur réaliste — le joueur doit sentir la pression mais avoir une vraie chance de s'en sortir.

ÉQUILIBRE :
- Une crise majeure tous les 4-5 tours — entre les crises, des défis gérables
- Les situations restent toujours récupérables avec de bonnes décisions
- Les crises se résolvent si le joueur joue bien

CONTINUITÉ NARRATIVE :
- Chaque situation dure 2 à 4 tours avant de se résoudre
- Si une situation était en cours → CONTINUE et fais-la évoluer selon le choix
- Quand une situation est résolue → démarre une nouvelle situation différente

III. CONFIGURATION
- 1 tour = 2 mois (36 tours = 6 ans)
- Tous les 12 tours : crise mondiale majeure (pandémie, crash, conflit...)
- La DIFFICULTÉ change l'intensité des crises : Facile → légères | Normal → équilibré | Difficile → sévères | Réaliste → fatales

IV. FORMAT D'UN TOUR — UN SEUL MESSAGE

1. ## Mois Année

2. Le tableau projets EN PREMIER (toujours, même vide au tour 1) :

| Projet en cours | Début | Fin prévue | Impact attendu |
|-----------------|-------|------------|----------------|

RÈGLES du tableau projets :
- À partir du tour 2 : inscrire CHAQUE décision du joueur ayant un impact sur les indicateurs
- La colonne "Impact attendu" est OBLIGATOIRE avec ce format exact :
  NomIndicateur ⬆⬆ · AutreIndicateur ⬇
  ⬆⬆ = très bénéfique · ⬆ = bénéfique · ⬇ = négatif · ⬇⬇ = très négatif
  Indicateurs : Coffres · Solde · Croissance · Dette · Popularité · Tensions · Chômage
  Exemple : Coffres ⬆⬆ · Solde ⬆ · Tensions ⬇
- Si aucun impact → laisser la cellule vide
- Tour 1 : tableau vide obligatoirement

3. Le tableau indicateurs (TOUR 1 UNIQUEMENT) :
⚠️ TOUR 1 SEULEMENT : génère ce tableau avec les valeurs initiales réalistes du pays.
À partir du tour 2 : NE GÉNÈRE PLUS jamais ce tableau.

| Indicateur        | Valeur       |
|-------------------|--------------|
| Coffres de l'État | X Mds €      |
| Solde mensuel     | +/- X M€     |
| Croissance        | X%           |
| Dette             | X% du PIB    |
| Popularité        | X%           |
| Tensions sociales | X/10         |
| Taux de chômage   | X%           |

4. Narration (3-5 phrases) :
- Conséquence du choix précédent (2-3 phrases)
- ⚡ NOUVELLE SITUATION : urgence qui découle logiquement de la situation

5. Les 4 choix :
1. [choix]
2. [choix]
3. [choix]
4. Faire un choix personnalisé — décrivez votre action

6. [NEWS: Titre1 | Titre2 | Titre3]

⚠️ VARIÉTÉ : Rotation obligatoire des domaines sur 8 tours : économie → social → diplomatie → sécurité → environnement → politique → santé → technologie.

V. NÉGOCIATION
Quand le joueur veut négocier :
[NÉGOCIATION: Nom complet, Titre/Rôle]
Suivi de ta première réplique courte (2-3 phrases) en tant que cet interlocuteur.

VI. FIN DE PARTIE ANTICIPÉE
Si le joueur est renversé : raconte la chute dramatiquement puis [GAME OVER] sur une ligne seule.

RÈGLES :
- PAYS ET PERSONNAGES RÉELS UNIQUEMENT
- TOUJOURS compléter tes réponses`;

const MAX_HISTORY_MESSAGES = 10;
const MAX_RETRIES = 2;
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

function trimHistory(messages) {
  if (messages.length <= 4) return messages;
  const countryChoice = messages.slice(1, 2);
  const lastAI = messages.filter(m => m.role === 'assistant').slice(-1);
  const recentPlayer = messages.filter(m => m.role === 'user').slice(-5);
  var combined = [...countryChoice, ...recentPlayer, ...lastAI];
  var seen = new Set();
  var result = [];
  messages.forEach(function(m) {
    var id = m.role + ':' + m.content.slice(0, 50);
    if (combined.includes(m) && !seen.has(id)) {
      seen.add(id);
      result.push(m);
    }
  });
  return result.length > 0 ? result : messages.slice(-6);
}

function isGameplayCall(messages) {
  if (!messages || messages.length < 2) return false;
  const lastMsg = messages[messages.length - 1]?.content || '';
  if (lastMsg.includes('introduction immersive')) return false;
  if (lastMsg.includes('bilan historique')) return false;
  if (lastMsg.includes('chute du joueur')) return false;
  return true;
}

function isValidResponse(text, messages) {
  if (!text || text.length < 80) return false;
  if (!isGameplayCall(messages)) return true;
  const hasChoices = /\n\s*[1-4]\./m.test(text);
  const hasGameOver = /\[GAME OVER\]/i.test(text);
  const hasNego = /\[NÉGOCIATION\]|\[NEGOCIATION\]/i.test(text);
  return hasChoices || hasGameOver || hasNego;
}

async function callGemini(apiKey, contents, systemPrompt, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 4000, temperature: 0.80 }
      })
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw { status: response.status, message: err.error?.message || 'Erreur API ' + response.status };
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API GEMINI_API_KEY non configurée.' });

  const { messages, lang, situation, situationHistory, stateStr, negoMode, negoPrompt, forceNego } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  const langue = lang || 'français';
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (negoMode && negoPrompt) {
    const negoSystemPrompt = negoPrompt + `\nLANGUE : Réponds EXCLUSIVEMENT en ${langue}.`;
    const trimmed = trimHistory(messages);
    const contents = trimmed.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    for (const model of MODELS) {
      try {
        const text = await callGemini(process.env.GEMINI_API_KEY, contents, negoSystemPrompt, model);
        if (text) return res.status(200).json({ text });
      } catch(err) {
        if (err.status === 503 || err.status === 429 || err.status === 500) continue;
        break;
      }
    }
    return res.status(500).json({ error: 'Erreur négociation' });
  }

  const situationInstruction = situation
    ? `\nSITUATION EN COURS : "${situation}" — continue à la développer.`
    : '';
  const historyInstruction = situationHistory && situationHistory.length
    ? `\nHISTORIQUE DES SITUATIONS (ne pas répéter) : ${situationHistory.join(' | ')}`
    : '';
  const stateInstruction = stateStr
    ? `\nÉTAT ACTUEL : ${stateStr} — la narration doit être cohérente avec ces chiffres.`
    : '';
  const forceNegoInstruction = forceNego
    ? `\nINSTRUCTION ABSOLUE : Réponds UNIQUEMENT avec [NÉGOCIATION: Nom complet, Titre/Rôle] suivi de ta première réplique (2-3 phrases). Rien d'autre.`
    : '';
  const langInstruction = `\nLANGUE : Réponds EXCLUSIVEMENT en ${langue}.\nDATE : ${today}.`;
  const systemPrompt = SYSTEM_PROMPT + situationInstruction + historyInstruction + stateInstruction + forceNegoInstruction + langInstruction;

  const trimmed = trimHistory(messages);
  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  let lastError = null;

  for (const model of MODELS) {
    try {
      let text = '';
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        text = await callGemini(apiKey, contents, systemPrompt, model);
        if (isValidResponse(text, trimmed)) break;
        if (attempt < MAX_RETRIES) {
          const retryContents = [
            ...contents,
            { role: 'model', parts: [{ text }] },
            { role: 'user', parts: [{ text: 'Ta réponse semble incomplète. Recommence avec le format complet.' }] }
          ];
          text = await callGemini(apiKey, retryContents, systemPrompt, model);
          if (isValidResponse(text, trimmed)) break;
        }
      }
      if (text) return res.status(200).json({ text });
    } catch (err) {
      lastError = err;
      if (err.status === 503 || err.status === 429 || err.status === 500) continue;
      break;
    }
  }

  return res.status(500).json({ error: lastError?.message || 'Erreur inconnue' });
}
