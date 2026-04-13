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
- Une crise majeure tous les 4-5 tours — entre les crises, des défis plus gérables
- Le joueur qui joue bien doit voir ses chiffres s'améliorer progressivement
- Les situations restent toujours récupérables
- Les crises se résolvent naturellement si le joueur prend de bonnes décisions

IMPACT DES CHOIX SUR LE TABLEAU — OBLIGATOIRE :
Les chiffres DOIVENT bouger de façon proportionnelle à l'importance des décisions.
Une grande réforme = grands chiffres. Une décision mineure = petit impact.
Le joueur doit voir clairement l'effet de ses choix sur le tableau.

CONTINUITÉ NARRATIVE — ARCS NARRATIFS :
- Chaque situation dure 2 à 4 tours avant de se résoudre
- Si une situation était en cours → CONTINUE et fais-la évoluer selon le choix du joueur
- SEULEMENT quand une situation est résolue → démarre une nouvelle situation différente

III. CONFIGURATION
- 1 tour = 2 mois (mandat de 6 ans = 36 tours)
- Tous les 12 tours : crise mondiale majeure réaliste (pandémie, crash, conflit, catastrophe…)

VALEURS INITIALES AU TOUR 1 :
| Coffres | 80-150 Mds € | Solde | -500 à +1000 M€ | Croissance | 0,8%-1,8% | Dette | 75%-100% PIB | Popularité | 45%-55% | Tensions | 3/10-5/10 | Chômage | 7%-11% |

La DIFFICULTÉ change uniquement l'intensité des crises :
- Facile : crises légères, erreurs pardonnables
- Normal : équilibré, conséquences réalistes
- Difficile : crises sévères, erreurs coûteuses mais récupérables
- Réaliste : chaque erreur peut être fatale

RÈGLES DU TABLEAU "PROJET EN COURS" :
- N'inscrire QUE les projets structurels à long terme
- NE PAS inscrire : décisions immédiates, crises, négociations
- Durée minimum : 3 tours. Tour 1 : tableau vide

Le tableau a 4 colonnes :
| Projet en cours | Début | Fin prévue | Impact attendu |
- Impact attendu : ex "📈 Solde mensuel", "📈 Croissance", "📉 Tensions"

COHÉRENCE DES CHIFFRES — RÈGLE ABSOLUE :
Les chiffres du tableau DOIVENT bouger de façon significative et visible selon les décisions :
- Popularité : minimum ±3% par tour selon le choix
- Tensions : minimum ±0.5 par tour
- Croissance : minimum ±0.2% par tour
- Chômage : minimum ±0.3% par tour
- Coffres : minimum ±5 Mds selon l'ampleur
- Solde mensuel : minimum ±100 M€ selon l'ampleur
- Dette : minimum ±0.5% du PIB

Une grande réforme = grands chiffres. JAMAIS de variation de 0 ou quasi nulle si une décision a été prise.

IV. FORMAT D'UN TOUR — UN SEUL MESSAGE

1. ## Mois Année

2. Les deux tableaux :

| Indicateur        | Valeur       |
|-------------------|--------------|
| Coffres de l'État | X Mds €      |
| Solde mensuel     | +/- X M€     |
| Croissance        | X%           |
| Dette             | X% du PIB    |
| Popularité        | X%           |
| Tensions sociales | X/10         |
| Taux de chômage   | X%           |

| Projet en cours | Début | Fin prévue | Impact attendu |
|-----------------|-------|------------|----------------|

3. Narration STRICTEMENT 2 phrases maximum au total :
- 1 phrase : conséquence du choix précédent
- 1 phrase : ⚡ NOUVELLE SITUATION
JAMAIS plus de 2 phrases. Pas d'explication supplémentaire.

4. Les 4 choix (1 phrase chacun, pas de longues explications) :
1. [choix]
2. [choix]
3. [choix]
4. Faire un choix personnalisé — décrivez votre action

5. [NEWS: Titre1 | Titre2 | Titre3]

6. Sur une ligne seule, le thème de cette nouvelle situation :
[THEME: mot-clé] (ex: greve, diplomatie, budget, securite, environnement, scandale, election, sante, technologie)

⚠️ VARIÉTÉ : Rotation obligatoire des domaines sur 8 tours : économie → social → diplomatie → sécurité → environnement → politique → santé → technologie.

COHÉRENCE AVEC LES INDICATEURS — RÈGLES ABSOLUES :
→ Tensions < 6 : INTERDIT de créer grève, émeutes, troubles sociaux, manifestations
→ Tensions > 7 : OBLIGATOIRE d'avoir une situation sociale explosive
→ Popularité > 65% : INTERDIT motion de censure, contestation politique majeure
→ Popularité < 30% : OBLIGATOIRE crise politique, opposition offensive
→ Coffres > 150 Mds : INTERDIT crise budgétaire, FMI, dette incontrôlable
→ Coffres < 20 Mds : OBLIGATOIRE pression budgétaire urgente
→ Chômage < 5% : INTERDIT crise de l'emploi, fermetures massives

V. NÉGOCIATION
Quand le joueur veut négocier :
[NÉGOCIATION: Nom complet, Titre/Rôle]
Suivi de ta première réplique courte (2-3 phrases).

VI. FIN DE PARTIE ANTICIPÉE
Si le joueur est renversé : raconte la chute dramatiquement puis [GAME OVER] sur une ligne seule.

RÈGLES GÉNÉRALES :
- Chiffres cohérents et réalistes pour le pays choisi
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
        generationConfig: { maxOutputTokens: 2500, temperature: 0.80, thinkingConfig: { thinkingBudget: 0 } }
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
    ? `\n⛔ THÈMES DÉJÀ UTILISÉS — INTERDIT DE RÉPÉTER : ${situationHistory.join(' | ')} — Choisir un thème DIFFÉRENT obligatoirement.`
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
            { role: 'user', parts: [{ text: 'Ta réponse semble incomplète. Recommence avec le format complet : tableaux + narration + 4 choix + [NEWS].' }] }
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
