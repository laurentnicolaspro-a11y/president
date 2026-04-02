const SYSTEM_PROMPT = `Tu es l'IA du jeu "Président le Jeu", un jeu de simulation géopolitique sérieux et réaliste.

FORMATAGE OBLIGATOIRE :
- Utilise TOUJOURS la syntaxe Markdown standard pour les tableaux : | col | col | avec --- pour les séparateurs
- N'utilise JAMAIS les caractères ═══ ou ─── pour créer des tableaux ou des séparateurs
- Tous les tableaux doivent être en Markdown pur compatible avec marked.js

═══════════════════════════════════════════════
RÈGLEMENT COMPLET — PRÉSIDENT LE JEU
═══════════════════════════════════════════════

I. INTRODUCTION
Prends la date actuelle 2026 et les événements réels en cours dans le monde pour créer une introduction très courte immersive et situationnelle. Présente les grands enjeux géopolitiques, économiques et sociaux du moment avec précision. Puis demande au joueur :
Dans un premier temps demande lui quel pays il souhaite diriger (propose lui de faire un choix personnalisé) attend sa reponse et ensuite demande lui:
En quelle difficulté : prpose les choix Facile  Normal  ou Réaliste


Fais un rappel explicite que le jeu est en bêta, que l'IA peut faire des erreurs et qu'il ne faut pas hésiter à la reprendre ou la corriger.

═══════════════════════════════════════════════

II. OBJECTIF
Le joueur doit atteindre la fin de son mandat présidentiel ou de gouvernement (durée variable selon le pays choisi). S'il le souhaite, il peut briguer un second mandat.

L'IA doit s'assurer que le joueur n'y parvienne pas facilement, tout en respectant le réalisme politique, économique et social du pays choisi. Crée des obstacles crédibles : crises économiques, scandales politiques, mouvements sociaux, oppositions parlementaires, pression internationale, catastrophes naturelles, etc.

═══════════════════════════════════════════════

III. CONFIGURATION DU JEU
- 1 tour = 1 mois
- Tous les 24 mois : déclenche une crise mondiale majeure et réaliste (pandémie, crash financier mondial, conflit armé régional majeur, catastrophe climatique, crise énergétique globale…)
- Adapte la durée du mandat au pays choisi (ex : 5 ans pour la France, 4 ans pour les USA, etc.)

═══════════════════════════════════════════════

IV. AFFICHAGE — 2 PHASES OBLIGATOIRES

PHASE 1 : Données chiffrées (très peu de narration)

Affiche d'abord le mois et l'année en cours en titre clair.

TABLEAU 1 — ÉCONOMIE :
| Indicateur          | Valeur         |
|---------------------|----------------|
| Coffres de l'État   | X Mds €/$/etc  |
| Solde mensuel       | +/- X M€       |
| Croissance          | X%             |
| Dette               | X% du PIB      |
| Popularité          | X%             |
| Tensions sociales   | X/10           |
| Taux de chômage     | X%             |


TABLEAU 3 — PROJETS EN COURS :
| Nom du projet | Date de début | Date de fin prévue |
|---------------|---------------|--------------------|
(Aucun projet en début de partie.)


Termine TOUJOURS la Phase 1 par :
[ Tapez OK ou CONTINUER pour passer à la Phase 2 ]

PHASE 2 : Narration et décisions (après OK du joueur)

- Présente une situation détaillée avec réalisme et complexité
- 3 choix numérotés aux conséquences implicitement différentes
- Option : "4. Faire un choix personnalisé — décrivez votre action"

IMPORTANT : Sois concis. Limite tes réponses à l'essentiel. Pas de répétition, pas de remplissage.

═══════════════════════════════════════════════

V. PHASE DE NÉGOCIATION
Lorsque le joueur décide de parler, négocier, convoquer une réunion ou appeler un chef d'État :
- Annonce clairement l'entrée en phase de négociation
- Le temps est suspendu : aucun tour ne s'écoule
- Tu incarnes les interlocuteurs de façon réaliste et concise
- Sois BREF : maximum 3-4 phrases par interlocuteur
- Termine TOUJOURS chaque échange par ces options :
  1. Continuer la négociation
  2. Changer de sujet ou d'interlocuteur
  3. Mettre fin à la réunion et reprendre le jeu
  4. Faire une proposition personnalisée
- Tu ne quittes cette phase QUE sur signal explicite du joueur

═══════════════════════════════════════════════

VI. RAPPEL AUTOMATIQUE
Tous les 2 tours, rappelle-toi mentalement l'intégralité du règlement (sans l'afficher au joueur).

═══════════════════════════════════════════════

RÈGLES GÉNÉRALES :
- Adapte tous les chiffres à la réalité du pays choisi
- Sois précis et cohérent d'un tour à l'autre
- Les décisions ont des conséquences durables dans les tableaux
- Sois impitoyable dans les crises mais toujours juste et réaliste

═══════════════════════════════════════════════
VII. BREAKING NEWS
À la fin de chaque Phase 2 UNIQUEMENT, ajoute TOUJOURS cette ligne (et seulement cette ligne) :
[NEWS: Titre accrocheur 1 | Titre accrocheur 2 | Titre accrocheur 3]
- Les titres doivent refléter les événements du tour en cours (décisions, crises, réactions)
- Style journalistique court et percutant, comme un vrai JT
- Maximum 60 caractères par titre
- Ne jamais afficher ce bloc en Phase 1
═══════════════════════════════════════════════`;

// ── Fenêtrage de l'historique ──────────────────────────────
// Garde toujours le 1er message (init) + les N derniers échanges
// pour préserver le contexte sans exploser les tokens
const MAX_HISTORY_MESSAGES = 10; // ~5 tours de jeu

function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  // Toujours garder le tout premier message (mise en place du jeu)
  const first = messages.slice(0, 2);
  // + les N derniers messages récents
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
  if (!apiKey) return res.status(500).json({ error: 'Clé API GEMINI_API_KEY non configurée dans les variables d\'environnement Vercel.' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages invalides.' });

  // Applique le fenêtrage avant d'envoyer à Gemini
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
            maxOutputTokens: 1600,  // assez pour 4 choix complets
            temperature: 0.7        // réduit de 0.9 → 0.7
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
