# Président le Jeu 🌍
Simulation géopolitique propulsée par **Google Gemini 3.1 Flash-Lite**
(repli automatique sur 3.5 Flash-Lite puis 2.5 Flash-Lite).

Les indicateurs (coffres, solde, croissance, dette, popularité, tensions, chômage) sont calculés
par le moteur du jeu dans `public/index.html`, pas par le modèle. Le modèle ne fournit que la
narration, les choix, et un marqueur `[IMPACT: niveau | indicateurs]` par tour.

---

## Structure
```
president-le-jeu/
├── api/chat.js          ← Backend sécurisé (proxy Gemini)
├── public/index.html    ← Frontend du jeu
├── vercel.json          ← Configuration Vercel
├── package.json
└── README.md
```

---

## Déploiement sur Vercel

### 1. Créer un compte Vercel
→ [vercel.com](https://vercel.com) (gratuit)

### 2. Mettre le projet sur GitHub
Crée un dépôt GitHub, pousse ce dossier dedans.

### 3. Importer sur Vercel
- Dashboard Vercel → **"Add New Project"**
- Importe ton dépôt GitHub
- Clique **Deploy** (Vercel détecte tout automatiquement)

### 4. ⚠️ Ajouter la clé API Gemini (OBLIGATOIRE)
1. Dans ton projet Vercel → **Settings → Environment Variables**
2. Ajoute :
   - **Name :** `GEMINI_API_KEY`
   - **Value :** ta clé API Google (commence par `AIza...`)
   - **Environment :** coche Production + Preview + Development
3. Clique **Save**
4. Va dans **Deployments** → **Redeploy**

> 💡 Clé gratuite sur [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 5. C'est en ligne !
Ton jeu est accessible sur `president-le-jeu.vercel.app` (ou ton domaine custom).
Tout le monde peut jouer gratuitement — jusqu'à **1 500 requêtes/jour** offertes par Google.

---

## Boucle de jeu

- Le texte de Gemini est **streamé** : la narration s'affiche au fil de l'eau, le tableau
  d'indicateurs arrive à la fin (le moteur a besoin du marqueur `[IMPACT:]`, placé en dernier).
  En cas d'échec du flux, repli automatique et transparent sur le mode classique.
- Sous chaque tableau, un bloc explique **pourquoi** les chiffres ont bougé : décision,
  projets en cours, crise mondiale.
- Les projets du tableau produisent un effet réel, fort au lancement puis décroissant
  jusqu'à s'éteindre en 10 tours (max 3 actifs). Format strict de la colonne impact :
  📈/📉 + un indicateur. L'usure est indispensable : sans elle, laisser les mêmes lignes
  dans le tableau offrait un bonus permanent de +21 points de popularité par mandat.
- Crises mondiales imposées par le moteur aux tours 12 et 24, sévérité selon la difficulté.
- La négociation coûte un tour mais son issue pèse 1,6× une décision ordinaire,
  avec 3 tours de recharge.
- Marqueur `[BILAN:]` : les 8 dernières décisions politiques sont renvoyées au modèle
  pour qu'il se souvienne de la ligne du joueur.
- L'introduction est statique : plus d'appel API avant de pouvoir choisir son pays.

---

## Protections

- `/api/chat` : 15 requêtes/minute et 200/heure par IP, historique plafonné à 120 messages
  et 60 000 caractères.
- `/api/scores` : 10 soumissions/heure par IP, score borné à 18 000, difficulté et nombre
  de tours validés, chevrons retirés des pseudos.

Les compteurs vivent en mémoire, donc par instance Vercel : ça arrête une boucle bête, pas
un attaquant motivé. Pour un vrai verrou il faudrait un stockage partagé (Upstash, Supabase).

---

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui |

---

## Dev local
```bash
npm install -g vercel
vercel dev
```
Crée un fichier `.env.local` :
```
GEMINI_API_KEY=AIza...ta-clé-ici
```
