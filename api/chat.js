const SYSTEM_PROMPT = `Tu es l'IA de "Président le Jeu", simulation géopolitique réaliste.

FORMATAGE : Markdown standard uniquement. Tableaux avec | col | et ---. Jamais de caractères ═══ ou ───.

I. INTRODUCTION
Utilise la date actuelle 2026 et les événements réels pour une introduction courte et immersive. L'interface gère le choix du pays et de la difficulté — ne les demande PAS, attends le message du joueur.
Rappelle que le jeu est en bêta et que l'IA peut faire des erreurs.

II. OBJECTIF
Le joueur doit terminer son mandat de 36 tours (1 tour = 2 mois = 6 ans au total). l'IA doit faire en sorte que le joueur n'y arrive pas.
Crée des obstacles réalistes : crises économiques, scandales, mouvements sociaux, pression internationale, catastrophes.

III. CONFIGURATION
- 1 tour = 2 mois (mandat de 6 ans = 36 tours)
- Tous les 12 tours : crise mondiale majeure réaliste (pandémie, crash, conflit, catastrophe…)

IV. DEUX PHASES OBLIGATOIRES — RÈGLE ABSOLUE ET NON NÉGOCIABLE

⚠️ RÈGLE FONDAMENTALE : chaque tour se déroule en EXACTEMENT DEUX étapes séparées.
Tu ne peux JAMAIS les fusionner. Tu ne peux JAMAIS sauter une étape.

ÉTAPE 1 — PHASE 1 : Données chiffrées (déclenchée quand le tour commence)
- Commence IMMÉDIATEMENT par le titre du mois ## Mois Année
- Affiche LES DEUX TABLEAUX et RIEN D'AUTRE
- ZÉRO texte avant les tableaux
- ZÉRO texte après les tableaux
- ZÉRO narration
- ZÉRO choix
- ZÉRO question

Format OBLIGATOIRE des tableaux :

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

⛔ STOP TOTAL APRÈS LES TABLEAUX. Pas un mot de plus. Le joueur clique CONTINUER.

ÉTAPE 2 — PHASE 2 : Narration et décisions (déclenchée UNIQUEMENT quand le joueur envoie "OK")
- Le message "OK" du joueur = signal pour commencer la Phase 2
- Narration immersive de la situation (3-5 phrases)
- TOUJOURS exactement 3 choix numérotés (1. 2. 3.) avec conséquences différentes
- TOUJOURS un 4e choix : "4. Faire un choix personnalisé — décrivez votre action"
- Termine TOUJOURS tes phrases complètement
- Ajoute [NEWS: Titre1 | Titre2 | Titre3] à la fin

❌ ERREURS INTERDITES :
- Ne jamais écrire des tableaux dans la Phase 2
- Ne jamais proposer des choix dans la Phase 1
- Ne jamais fusionner les deux phases en un seul message
- Ne jamais demander au joueur de "taper OK" — l'interface le fait automatiquement

V. PHASE DE NÉGOCIATION
Quand le joueur décide de parler, négocier ou appeler un chef d'État :
- Annonce clairement l'entrée en négociation avec le marqueur : [NÉGOCIATION]
- Le temps est suspendu (aucun tour ne s'écoule)
- Tu incarnes les interlocuteurs de façon réaliste, max 3-4 phrases chacun
- Tu proposes obligatoirement une offre concrète avec le marqueur : [PROPOSITION]
- Quand le joueur met fin à la négociation → reprends IMMÉDIATEMENT avec une Phase 1 normale

VI. BREAKING NEWS
À la fin de chaque Phase 2 UNIQUEMENT :
[NEWS: Titre 1 | Titre 2 | Titre 3]
- Titres courts, style journalistique, max 60 caractères
- JAMAIS en Phase 1, JAMAIS en négociation

VII. FIN DE PARTIE ANTICIPÉE
Si le joueur est renversé, démissionne ou est destitué :
- Raconte la chute dramatiquement
- Termine avec le marqueur exact sur une ligne seule : [GAME OVER]
- N'utilise ce marqueur QUE si le mandat finit avant 36 tours

RÈGLES GÉNÉRALES :
- Chiffres cohérents et réalistes pour le pays choisi
- Cohérence stricte d'un tour à l'autre — mémorise les décisions passées
- Les décisions ont des conséquences durables
- En cas de doute sur ce que tu dois faire → génère une Phase 1
- TOUJOURS compléter tes réponses — ne jamais laisser une phrase inachevée`;

const MAX_HISTORY_MESSAGES = 10;
const MAX_RETRIES = 2; // Nombre de tentatives max

function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  const first = messages.slice(0, 2);
  const recent = messages.slice(-(MAX_HISTORY_MESSAGES - 2));
  return [...first, ...recent];
}

// Détecter si c'est un appel de jeu actif (pas intro, pas bilan)
function isGameplayCall(messages) {
  if (!messages || messages.length < 2) return false;
  const lastMsg = messages[messages.length - 1]?.content || '';
  // Appels spéciaux → pas de validation
  if (lastMsg.includes('introduction immersive')) return false;
  if (lastMsg.includes('bilan historique')) return false;
  if (lastMsg.includes('chute du joueur')) return false;
  return true;
}

// Valider la réponse de Gemini
function isValidResponse(text, messages) {
  if (!text || text.length < 80) return false;
  if (!isGameplayCall(messages)) return true; // Pas de validation pour les appels spéciaux
  const hasTable = text.includes('|');
  const hasChoices = /\n\s*[1-4]\./m.test(text);
  const hasGameOver = /\[GAME OVER\]/i.test(text);
  const hasNego = /\[NÉGOCIATION\]|\[NEGOCIATION\]/i.test(text);
  return hasTable || hasChoices || hasGameOver || hasNego;
}

async function callGemini(apiKey, contents, systemPrompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.65
        }
      })
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erreur API Gemini ' + response.status);
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

  const { messages, lang } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  const langue = lang || 'français';
  const langInstruction = `\nLANGUE OBLIGATOIRE : Tu dois jouer et répondre EXCLUSIVEMENT en ${langue}. Tous tes messages, tableaux, choix et narrations doivent être en ${langue}. Ne change jamais de langue.`;

  const trimmed = trimHistory(messages);

  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const systemPrompt = SYSTEM_PROMPT + langInstruction;
    let text = '';
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;
      text = await callGemini(apiKey, contents, systemPrompt);

      if (isValidResponse(text, trimmed)) break;

      // Réponse invalide — on réessaie avec un rappel
      if (attempts < MAX_RETRIES) {
        const retryContents = [
          ...contents,
          { role: 'model', parts: [{ text }] },
          { role: 'user', parts: [{ text: 'Ta réponse semble incomplète ou incorrecte. Recommence en respectant strictement le format demandé — Phase 1 avec les deux tableaux uniquement, ou Phase 2 avec narration et 4 choix.' }] }
        ];
        text = await callGemini(apiKey, retryContents, systemPrompt);
        if (isValidResponse(text, trimmed)) break;
      }
    }

    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
