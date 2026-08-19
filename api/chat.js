const SYSTEM_PROMPT = `Tu es le narrateur de "Président le Jeu", simulation géopolitique réaliste.

RÔLE : tu racontes et tu proposes des choix. Tu ne calcules AUCUN chiffre.
Le moteur du jeu gère seul les indicateurs (coffres, solde, croissance, dette, popularité, tensions, chômage).
N'affiche JAMAIS de tableau d'indicateurs : il est généré par le jeu, avant ton message.

FORMATAGE : Markdown standard uniquement. Jamais de caractères ═══ ou ───.

FORMAT D'UN TOUR — UN SEUL MESSAGE, DANS CET ORDRE :

1. ## Mois Année

2. Le tableau des projets structurels en cours, et rien d'autre :
| Projet en cours | Début | Fin prévue | Impact attendu |
|---|---|---|---|
N'y inscris QUE les chantiers de 3 tours ou plus. Jamais de décision immédiate, de crise ou
de négociation. Au tour 1 le tableau est vide.
La colonne « Impact attendu » suit un format STRICT, car le moteur l'applique réellement :
📈 ou 📉 suivi d'un seul indicateur parmi coffres, solde, croissance, dette, popularite,
tensions, chomage. Exemples : "📈 croissance", "📉 tensions". On peut en mettre deux séparés
par " · ". Aucun autre texte dans cette colonne.
Un projet listé produit un effet à chaque tour tant qu'il figure dans le tableau : recopie
les projets toujours en cours, et RETIRE une ligne dès que le chantier est terminé ou abandonné.
Cet effet DÉCROÎT avec le temps : fort au lancement, il s'essouffle sur une dizaine de tours.
Un chantier qui traîne n'apporte donc plus grand-chose — mieux vaut le mener à son terme,
le retirer du tableau, et en lancer un nouveau. Tu peux le refléter dans la narration.

3. Narration : 2 phrases MAXIMUM au total.
   - 1 phrase : la conséquence concrète du choix précédent
   - 1 phrase : ⚡ la nouvelle situation
   Jamais plus de 2 phrases. Aucune explication supplémentaire.

4. Quatre choix, une phrase chacun, sans justification :
1. [choix]
2. [choix]
3. [choix]
4. Faire un choix personnalisé — décrivez votre action

5. [NEWS: Titre1 | Titre2 | Titre3]

6. [THEME: mot-clé]
   parmi : economie, social, diplomatie, securite, environnement, politique, sante, technologie

7. [IMPACT: niveau | indicateurs]
   Tu évalues le choix que le joueur vient de faire, du point de vue de l'intérêt du pays.
   niveau : TresMauvais, Mauvais, Neutre, Bien, TresBien
   indicateurs : 2 à 4 parmi coffres, solde, croissance, dette, popularite, tensions, chomage
   Exemple : [IMPACT: Bien | popularite, tensions, coffres]
   Ligne OBLIGATOIRE à chaque tour, sauf au tout premier tour de la partie.
   Ne mets que les indicateurs réellement touchés par la décision — le moteur applique
   l'amplitude lui-même, tu n'as aucun chiffre à donner.

8. [BILAN: phrase courte]
   Une seule phrase, à la troisième personne, résumant ce que le joueur vient de décider
   politiquement. Elle nourrit le dossier de son mandat et pourra lui être resservie plus tard.
   Exemple : [BILAN: A cédé aux syndicats sur les salaires du secteur public]
   Ligne OBLIGATOIRE à chaque tour, sauf au tout premier.

ARCS NARRATIFS :
- Une situation dure 2 à 4 tours avant de se résoudre.
- Si une situation est en cours, fais-la ÉVOLUER selon le choix du joueur.
- Ne lance une nouvelle situation qu'une fois la précédente résolue.

RYTHME — tu connais le numéro du tour, sers-t'en :
- Une crise sérieuse tous les 4 à 5 tours ; entre les crises, des défis gérables.
- Aux tours 12, 24 et 36 : crise mondiale majeure (pandémie, crash, conflit, catastrophe).
- Fais tourner les domaines, jamais le même deux tours de suite.

COHÉRENCE AVEC L'ÉTAT FOURNI À CHAQUE TOUR :
→ Tensions < 6 : pas de grève, d'émeute ni de manifestation majeure
→ Tensions > 7 : situation sociale explosive obligatoire
→ Popularité > 65 : pas de motion de censure ni de contestation majeure
→ Popularité < 30 : crise politique, opposition offensive
→ Coffres > 150 Mds : pas de crise budgétaire, pas de FMI
→ Coffres < 20 Mds : pression budgétaire urgente
→ Chômage < 5 : pas de crise de l'emploi ni de fermetures massives

DIFFICULTÉ — elle change l'intensité des crises, jamais les chiffres :
Facile : crises légères, erreurs pardonnables
Normal : conséquences réalistes
Difficile : crises sévères, erreurs coûteuses mais récupérables
Réaliste : chaque erreur peut être fatale

ÉQUILIBRE : le joueur doit sentir la pression mais garder une vraie chance de s'en sortir.
Les situations restent toujours récupérables par de bonnes décisions.

NÉGOCIATION :
Quand le joueur veut négocier : [NÉGOCIATION: Nom complet, Titre/Rôle]
suivi de ta première réplique courte (2-3 phrases).

FIN DE PARTIE ANTICIPÉE :
Si le joueur est renversé : raconte sa chute dramatiquement puis [GAME OVER] sur une ligne seule.

RÈGLES GÉNÉRALES :
- Pays et personnages réels uniquement, cohérents avec le pays dirigé.
- Termine toujours ta réponse.`;

const MAX_HISTORY_MESSAGES = 10;
// Les Gemini 3 ont remplacé thinkingBudget par thinkingLevel : envoyer l'ancien champ
// ferait échouer la requête en 400. La config est donc choisie par génération, et en cas
// de 400 on réessaie une fois sans réglage de réflexion (voir callGemini).
const MODELS = [
  { id: 'gemini-3.1-flash-lite', gen: 3 },
  { id: 'gemini-3.5-flash-lite', gen: 3 },
  { id: 'gemini-2.5-flash-lite', gen: 2 }
];

const BASE_GEN_CONFIG = { maxOutputTokens: 2500, temperature: 0.80 };

function genConfig(model, sansReflexion) {
  if (sansReflexion) return { ...BASE_GEN_CONFIG };
  return model.gen >= 3
    ? { ...BASE_GEN_CONFIG, thinkingConfig: { thinkingLevel: 'low' } }
    : { ...BASE_GEN_CONFIG, thinkingConfig: { thinkingBudget: 0 } };
}

// ===== Garde-fous d'entrée =====
const MAX_MESSAGES = 120;
const MAX_TOTAL_CHARS = 60000;
const MAX_MESSAGE_CHARS = 4000;

function payloadInvalide(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Messages invalides.';
  if (messages.length > MAX_MESSAGES) return 'Historique trop long.';
  let total = 0;
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') return 'Message malformé.';
    if (m.content.length > MAX_MESSAGE_CHARS) return 'Message trop long.';
    total += m.content.length;
    if (total > MAX_TOTAL_CHARS) return 'Historique trop volumineux.';
  }
  return null;
}

// ===== Limitation de débit =====
// En mémoire, donc par instance : Vercel peut en faire tourner plusieurs et les recycle à
// froid. Ce n'est pas un rempart absolu, mais ça suffit à empêcher qu'une simple boucle
// vide le quota Gemini gratuit. Un vrai verrou demanderait un stockage partagé (Upstash,
// Supabase) — pas justifié tant que le trafic reste faible.
const FENETRE_MS = 60000;
const MAX_PAR_MINUTE = 15;
const MAX_PAR_HEURE = 200;
const seau = new Map();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || 'inconnu';
}

function tropDeRequetes(ip) {
  const maintenant = Date.now();
  let hist = seau.get(ip) || [];
  hist = hist.filter(t => maintenant - t < 3600000);
  const derniereMinute = hist.filter(t => maintenant - t < FENETRE_MS).length;
  if (derniereMinute >= MAX_PAR_MINUTE || hist.length >= MAX_PAR_HEURE) {
    seau.set(ip, hist);
    return true;
  }
  hist.push(maintenant);
  seau.set(ip, hist);
  if (seau.size > 5000) {
    for (const [k, v] of seau) if (!v.length || maintenant - v[v.length - 1] > 3600000) seau.delete(k);
  }
  return false;
}

// Garde le message de configuration (pays + difficulté) et les N derniers messages,
// en préservant l'alternance user/model attendue par Gemini.
function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;

  const setupIdx = messages.findIndex(
    m => m.role === 'user' && /difficult/i.test(m.content || '')
  );
  const tailStart = messages.length - MAX_HISTORY_MESSAGES;
  const tail = messages.slice(tailStart);
  const kept = (setupIdx >= 0 && setupIdx < tailStart)
    ? [messages[setupIdx]].concat(tail)
    : tail.slice();

  // Gemini exige que le premier message du contexte soit un message user.
  while (kept.length && kept[0].role !== 'user') kept.shift();
  return kept.length ? kept : messages.slice(-2);
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
  const hasNego = /\[N[ÉE]GOCIATION\s*:/i.test(text);
  return hasChoices || hasGameOver || hasNego;
}

async function appelBrut(apiKey, contents, systemPrompt, model, sansReflexion) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: genConfig(model, sansReflexion)
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

async function callGemini(apiKey, contents, systemPrompt, model) {
  try {
    return await appelBrut(apiKey, contents, systemPrompt, model, false);
  } catch (err) {
    // 400 = paramètre refusé par ce modèle. On retente sans réglage de réflexion plutôt
    // que de faire tomber la partie sur un détail de configuration.
    if (err.status === 400) {
      return await appelBrut(apiKey, contents, systemPrompt, model, true);
    }
    throw err;
  }
}

// Diffuse la réponse au fil de l'eau. Renvoie le texte accumulé, ou null si rien n'a pu
// être écrit — dans ce cas l'appelant retombe sur le mode classique.
async function streamGemini(apiKey, contents, systemPrompt, model, res, sansReflexion) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: genConfig(model, sansReflexion)
      })
    }
  );
  if (!response.ok || !response.body) {
    const err = await response.json?.().catch(() => ({})) || {};
    throw { status: response.status, message: err.error?.message || 'Erreur API ' + response.status };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let tampon = '';
  let complet = '';
  let entetesEnvoyees = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    tampon += decoder.decode(value, { stream: true });
    const lignes = tampon.split('\n');
    tampon = lignes.pop() || '';
    for (const ligne of lignes) {
      if (!ligne.startsWith('data:')) continue;
      const brut = ligne.slice(5).trim();
      if (!brut || brut === '[DONE]') continue;
      let morceau = '';
      try {
        morceau = JSON.parse(brut).candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch { continue; }
      if (!morceau) continue;
      if (!entetesEnvoyees) {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no'
        });
        entetesEnvoyees = true;
      }
      complet += morceau;
      res.write(morceau);
    }
  }
  return entetesEnvoyees ? complet : null;
}

function toContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API GEMINI_API_KEY non configurée.' });

  if (tropDeRequetes(clientIp(req))) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Trop de requêtes. Patientez une minute.' });
  }

  const {
    messages, lang, situation, situationHistory, stateStr,
    negoMode, negoPrompt, forceNego,
    country, diff, turn, maxTurns, dossier, crisis, stream
  } = req.body || {};

  const probleme = payloadInvalide(messages);
  if (probleme) return res.status(400).json({ error: probleme });

  const langue = lang || 'français';
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (negoMode && negoPrompt) {
    const negoSystemPrompt = negoPrompt + `\nLANGUE : Réponds EXCLUSIVEMENT en ${langue}.`;
    const contents = toContents(trimHistory(messages));
    for (const model of MODELS) {
      try {
        const text = await callGemini(apiKey, contents, negoSystemPrompt, model);
        if (text) return res.status(200).json({ text });
      } catch (err) {
        if (err.status === 503 || err.status === 429 || err.status === 500) continue;
        break;
      }
    }
    return res.status(500).json({ error: 'Erreur négociation' });
  }

  // Contexte de partie transmis explicitement par le client — ne dépend plus de l'historique.
  const gameInstruction = country
    ? `\nCONTEXTE DE LA PARTIE : le joueur dirige ${country}. Difficulté : ${diff || 'Normal'}.`
    : '';
  const turnInstruction = turn
    ? `\nTOUR ACTUEL : ${turn} sur ${maxTurns || 36}. Un tour = 2 mois. Respecte le rythme des crises.`
    : '';
  const situationInstruction = situation
    ? `\nSITUATION EN COURS : "${situation}" — continue à la développer.`
    : '';
  const historyInstruction = situationHistory && situationHistory.length
    ? `\nTHÈMES DES DERNIERS TOURS : ${situationHistory.join(' | ')} — choisis un thème différent.`
    : '';
  const stateInstruction = stateStr
    ? `\nÉTAT ACTUEL (calculé par le moteur, fais-y référence sans le recopier) : ${stateStr}`
    : '';
  const dossierInstruction = dossier && dossier.length
    ? `\nDOSSIER DU MANDAT — ce que le joueur a déjà décidé, du plus ancien au plus récent :\n- ${dossier.join('\n- ')}\nSers-t'en : l'opposition, la presse et tes interlocuteurs doivent lui renvoyer ses propres décisions.`
    : '';
  // Le moteur a déjà appliqué le choc : le modèle doit le raconter, pas l'inventer.
  const crisisInstruction = crisis
    ? `\n⚠ CRISE MONDIALE MAJEURE CE TOUR. Le moteur vient d'appliquer un choc négatif réel sur les indicateurs. Ouvre ton message par cet évènement mondial, rends-le spectaculaire et cohérent avec l'état actuel, et fais porter les 4 choix sur la réponse à cette crise.`
    : '';
  const forceNegoInstruction = forceNego
    ? `\nINSTRUCTION ABSOLUE : Réponds UNIQUEMENT avec [NÉGOCIATION: Nom complet, Titre/Rôle] suivi de ta première réplique (2-3 phrases). Rien d'autre.`
    : '';
  const langInstruction = `\nLANGUE : Réponds EXCLUSIVEMENT en ${langue}.\nDATE RÉELLE DU JOUR : ${today}.`;

  const systemPrompt = SYSTEM_PROMPT + gameInstruction + turnInstruction + situationInstruction
    + historyInstruction + stateInstruction + dossierInstruction + crisisInstruction
    + forceNegoInstruction + langInstruction;

  const trimmed = trimHistory(messages);
  const contents = toContents(trimmed);

  let lastError = null;

  // Mode streamé : on tente le premier modèle. Si rien n'a pu être écrit, on retombe
  // silencieusement sur la boucle classique ci-dessous.
  if (stream) {
    for (const model of MODELS) {
      try {
        let texte;
        try {
          texte = await streamGemini(apiKey, contents, systemPrompt, model, res, false);
        } catch (err) {
          if (err.status === 400) texte = await streamGemini(apiKey, contents, systemPrompt, model, res, true);
          else throw err;
        }
        if (texte) { res.end(); return; }
      } catch (err) {
        lastError = err;
        if (res.headersSent) { res.end(); return; } // coupure en cours de route : le client relancera
        if (err.status === 503 || err.status === 429 || err.status === 500 || err.status === 404) continue;
        break;
      }
    }
  }

  for (const model of MODELS) {
    try {
      let text = await callGemini(apiKey, contents, systemPrompt, model);
      if (!isValidResponse(text, trimmed)) {
        // Une seule relance, puis on passe au modèle suivant.
        const retryContents = contents.concat([
          { role: 'model', parts: [{ text }] },
          { role: 'user', parts: [{ text: 'Ta réponse est incomplète. Recommence avec le format complet : tableau projets + narration 2 phrases + 4 choix + [NEWS] + [THEME] + [IMPACT].' }] }
        ]);
        const retry = await callGemini(apiKey, retryContents, systemPrompt, model);
        if (isValidResponse(retry, trimmed)) text = retry;
        else if (retry && retry.length > text.length) text = retry;
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
