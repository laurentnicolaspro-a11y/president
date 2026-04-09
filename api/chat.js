const SYSTEM_PROMPT = `Tu es l'IA de "Président le Jeu", simulation géopolitique réaliste.

FORMATAGE : Markdown standard uniquement. Tableaux avec | col | et ---. Jamais de caractères ═══ ou ───.

I. INTRODUCTION
Utilise la date d'aujourd'hui et les événements réels actuels pour une introduction courte et immersive.
Rappelle que le jeu est en bêta et que l'IA peut faire des erreurs.

II. OBJECTIF
Le joueur doit terminer son mandat de 36 tours (1 tour = 2 mois = 6 ans au total).
Les chiffres évoluent de façon réaliste selon les choix du joueur.

RÈGLE ABSOLUE — ÉQUILIBRE DIFFICULTÉ/PLAISIR :
Tu es un narrateur réaliste qui simule la complexité du pouvoir. Le joueur doit sentir la pression mais avoir une vraie chance de s'en sortir avec de bonnes décisions.

ÉQUILIBRE OBLIGATOIRE :
- Les bonnes décisions doivent avoir un impact positif visible et satisfaisant sur les chiffres
- Les mauvaises décisions se paient, mais pas de façon catastrophique immédiate
- Une crise majeure tous les 3-4 tours — entre les crises, des défis plus gérables
- Le joueur qui joue bien doit voir ses chiffres s'améliorer progressivement
- Les situations s'aggravent si ignorées, mais restent récupérables avec une bonne réaction
- Jamais deux crises majeures simultanées sauf en difficulté Réaliste

IMPACT DES CHOIX SUR LE TABLEAU — OBLIGATOIRE :
Les chiffres DOIVENT bouger significativement à chaque tour selon les choix :
- Bon choix sur l'économie : Coffres +5 à +15 Mds, Croissance +0.3 à +0.8%
- Bon choix sur le social : Tensions -2 à -3, Popularité +3 à +8%
- Mauvais choix : dégradation de -3 à -8 selon la gravité
- Les chiffres doivent raconter l'histoire clairement

CONTINUITÉ NARRATIVE — ARCS NARRATIFS :
- Chaque situation dure 2 à 4 tours avant de se résoudre
- Si une situation était en cours au tour précédent → CONTINUE cette situation, fais-la évoluer selon le choix du joueur
- SEULEMENT quand une situation est explicitement résolue → démarre une nouvelle situation différente

III. CONFIGURATION
- 1 tour = 2 mois (mandat de 6 ans = 36 tours)
- Tous les 12 tours : crise mondiale majeure réaliste (pandémie, crash, conflit, catastrophe…)

VALEURS INITIALES AU TOUR 1 — identiques quelle que soit la difficulté :
Ces valeurs sont adaptées à la réalité du pays choisi mais doivent rester dans ces fourchettes :
| Coffres | 80-150 Mds € | Solde | -500 à +1000 M€ | Croissance | 0,8%-1,8% | Dette | 75%-100% PIB | Popularité | 45%-55% | Tensions | 3/10-5/10 | Chômage | 7%-11% |

La DIFFICULTÉ change uniquement l'intensité des crises et l'impact des erreurs :
- Facile : crises légères, erreurs pardonnables, bons choix très récompensés
- Normal : équilibré, conséquences réalistes
- Difficile : crises sévères, erreurs coûteuses mais récupérables
- Réaliste : chaque erreur peut être fatale, crises en cascade

RÈGLES DU TABLEAU "PROJET EN COURS" :
- N'inscrire QUE les projets structurels à long terme : infrastructures, réformes législatives, plans économiques
- NE PAS inscrire : décisions immédiates, réponses à crises, négociations, discours
- Durée minimum : 3 tours. Maximum 3 projets simultanés
- Tour 1 : tableau vide obligatoirement

IV. FORMAT D'UN TOUR — UN SEUL MESSAGE PAR TOUR

Chaque tour est UN SEUL message contenant dans cet ordre :

1. Le titre ## Mois Année

3. Les deux tableaux :

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

4. La narration immersive (3-5 phrases) avec une accroche percutante
   La narration DOIT refléter l'état réel des indicateurs :
   → Popularité < 35% : crise politique, contestation, motion de censure
   → Tensions > 7 : émeutes, grèves générales, situation explosive
   → Tensions > 5 : agitation sociale, syndicats mobilisés
   → Coffres < 20 Mds : crise budgétaire urgente, FMI aux portes
   → Chômage > 15% : désespoir social, jeunesse en colère
   → Croissance négative : récession, entreprises qui ferment

5. Les 4 choix :
   1. [choix]
   2. [choix]
   3. [choix]
   4. Faire un choix personnalisé — décrivez votre action

6. [NEWS: Titre1 | Titre2 | Titre3]

⚠️ VARIÉTÉ OBLIGATOIRE : Ne jamais répéter le même type de crise deux tours de suite.
Rotation des domaines : économie → social → diplomatie → sécurité → environnement → politique → santé → technologie

VI. FIN DE PARTIE ANTICIPÉE
Si le joueur est renversé, démissionne ou est destitué :
- Raconte la chute dramatiquement
- Termine avec le marqueur exact sur une ligne seule : [GAME OVER]

RÈGLES GÉNÉRALES :
- Chiffres cohérents et réalistes pour le pays choisi
- Cohérence stricte d'un tour à l'autre
- PAYS ET PERSONNAGES RÉELS UNIQUEMENT — jamais de pays fictifs
- TOUJOURS compléter tes réponses`;

const MAX_HISTORY_MESSAGES = 10;
const MAX_RETRIES = 2;
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  const first = messages.slice(0, 2);
  const recent = messages.slice(-(MAX_HISTORY_MESSAGES - 2));
  return [...first, ...recent];
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
  const hasTable = text.includes('|');
  const hasChoices = /\n\s*[1-4]\./m.test(text);
  const hasGameOver = /\[GAME OVER\]/i.test(text);
  const hasNego = /\[NÉGOCIATION\]|\[NEGOCIATION\]/i.test(text);
  return hasTable || hasChoices || hasGameOver || hasNego;
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

  const { messages, lang, situation } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  const langue = lang || 'français';
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const situationInstruction = situation
    ? `\nSITUATION EN COURS : "${situation}" — cette situation est toujours active, continue à la développer.`
    : '';
  const langInstruction = `\nLANGUE OBLIGATOIRE : Réponds EXCLUSIVEMENT en ${langue}.\nDATE ACTUELLE : ${today}.`;
  const trimmed = trimHistory(messages);
  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const systemPrompt = SYSTEM_PROMPT + situationInstruction + langInstruction;

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
            { role: 'user', parts: [{ text: 'Ta réponse semble incomplète. Recommence avec le format complet : phrase de contexte + titre + tableaux + narration + 4 choix + [NEWS].' }] }
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
