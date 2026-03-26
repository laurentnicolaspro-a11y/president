# Président le Jeu 🌍
Simulation géopolitique propulsée par **Google Gemini 2.0 Flash** (gratuit).

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
