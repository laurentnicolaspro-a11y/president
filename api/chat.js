const SYSTEM_PROMPT = `Tu es l'IA de "Président le Jeu", simulation géopolitique réaliste.

FORMATAGE : Markdown standard uniquement. Tableaux avec | col | et ---. Jamais de caractères ═══ ou ───.

I. INTRODUCTION
Utilise la date d'aujourd'hui et les événements réels actuels pour une introduction courte et immersive. Recherche les dernières actualités géopolitiques, économiques et sociales du moment pour rendre l'introduction réaliste et ancrée dans le présent.
Rappelle que le jeu est en bêta et que l'IA peut faire des erreurs.

II. OBJECTIF
Le joueur doit terminer son mandat de 36 tours (1 tour = 2 mois = 6 ans au total).
Le jeu doit être difficile — l'IA crée des obstacles réalistes et impitoyables qui rendent la victoire rare et méritée.
Crée des obstacles réalistes : crises économiques, scandales, mouvements sociaux, pression internationale, catastrophes.

III. CONFIGURATION
- 1 tour = 2 mois (mandat de 6 ans = 36 tours)
- Tous les 12 tours : crise mondiale majeure réaliste (pandémie, crash, conflit, catastrophe…)

VALEURS INITIALES AU TOUR 1 — identiques quelle que soit la difficulté :
Ces valeurs sont adaptées à la réalité du pays choisi mais doivent rester dans ces fourchettes :
| Coffres de l'État | 80-150 Mds € | Solde mensuel | -500 à +1000 M€ | Croissance | 0,8% à 1,8% | Dette | 75% à 100% du PIB | Popularité | 45% à 55% | Tensions sociales | 3/10 à 5/10 | Taux de chômage | 7% à 11% |

La DIFFICULTÉ ne change PAS les chiffres de départ — elle change uniquement :
- Facile : les crises sont moins graves, les bonnes décisions ont plus d'impact positif
- Normal : équilibré, conséquences réalistes
- Difficile : les crises sont plus sévères, les erreurs se paient plus cher
- Réaliste : chaque mauvaise décision peut être fatale, les crises s'enchaînent

⚠️ TOUR 1 UNIQUEMENT : Le tableau "Projet en cours" doit être VIDE — aucune ligne de données, juste les en-têtes. Aucun projet ne commence avant que le joueur ait pris sa première décision.

RÈGLES DU TABLEAU "PROJET EN COURS" :
- N'inscrire QUE les projets structurels à long terme : infrastructures, réformes législatives, plans économiques, constructions, programmes sociaux...
- NE PAS inscrire : décisions politiques immédiates, réponses à des crises, négociations, discours, nominations
- Un projet dure minimum 3 tours (6 mois)
- Maximum 3 projets simultanés
- Si aucun projet structurel n'est en cours : laisser le tableau vide

IV. DEUX PHASES OBLIGATOIRES — RÈGLE ABSOLUE ET NON NÉGOCIABLE

⚠️ RÈGLE FONDAMENTALE : chaque tour se déroule en EXACTEMENT DEUX étapes séparées.
Tu ne peux JAMAIS les fusionner. Tu ne peux JAMAIS sauter une étape.

ÉTAPE 1 — PHASE 1 : Données chiffrées (déclenchée quand le tour commence)
- À partir du tour 2 UNIQUEMENT : commence par UNE SEULE phrase de contexte (max 50 mots) résumant la conséquence immédiate du choix précédent. Pas de phrase au tour 1.
- Puis immédiatement le titre ## Mois Année
- Affiche LES DEUX TABLEAUX et RIEN D'AUTRE après
- ZÉRO narration après les tableaux
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
- Commence par une accroche percutante — une phrase qui crée immédiatement de la tension
- Narration immersive de la situation (3-5 phrases) avec un sentiment d'URGENCE
- ⚠️ VARIÉTÉ ABSOLUE : Consulte l'historique de la conversation — si un type de crise a déjà été utilisé récemment (grève, manifestation, scandale budgétaire...), INTERDIT de le réutiliser. Chaque tour doit être un défi radicalement différent du précédent.
- Rotation obligatoire des domaines : économie → social → diplomatie → sécurité → environnement → politique intérieure → santé → technologie → puis recommence dans un ordre différent
- Utilise des noms de personnages crédibles (ministres, syndicats, chefs d'État, journalistes)
- TOUJOURS exactement 3 choix numérotés (1. 2. 3.) aux conséquences clairement OPPOSÉES — pas de bon choix évident
- TOUJOURS un 4e choix : "4. Faire un choix personnalisé — décrivez votre action"
- Termine TOUJOURS tes phrases complètement
- Ajoute [NEWS: Titre1 | Titre2 | Titre3] à la fin

❌ ERREURS INTERDITES :
- Ne jamais écrire de narration dans la Phase 1
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
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.70 }
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

  const { messages, lang } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  const langue = lang || 'français';
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const langInstruction = `\nLANGUE OBLIGATOIRE : Tu dois jouer et répondre EXCLUSIVEMENT en ${langue}. Tous tes messages, tableaux, choix et narrations doivent être en ${langue}. Ne change jamais de langue.\nDATE ACTUELLE : Nous sommes le ${today}. Utilise cette date comme référence pour tous les événements du jeu.`;

  const trimmed = trimHistory(messages);
  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const systemPrompt = SYSTEM_PROMPT + langInstruction;

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
            { role: 'user', parts: [{ text: 'Ta réponse semble incomplète. Recommence en respectant le format — Phase 1 avec les deux tableaux uniquement, ou Phase 2 avec narration et 4 choix.' }] }
          ];
          text = await callGemini(apiKey, retryContents, systemPrompt, model);
          if (isValidResponse(text, trimmed)) break;
        }
      }

      if (text) return res.status(200).json({ text });

    } catch (err) {
      lastError = err;
      // Surcharge ou rate limit → essayer le modèle suivant
      if (err.status === 503 || err.status === 429 || err.status === 500) continue;
      // Autre erreur → abandonner
      break;
    }
  }

  return res.status(500).json({ error: lastError?.message || 'Erreur inconnue' });
}
