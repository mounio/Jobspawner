# JobSpawner — Frontend

Interface utilisateur complète pour la plateforme JobSpawner.  
Stack : **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4**

---

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'URL de l'API backend
cp .env.local.example .env.local
# Éditer .env.local si le backend tourne sur un autre port

# 3. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

> ⚠️ Le backend ASP.NET Core doit tourner sur `https://localhost:7248`

---

## 📁 Structure du projet

```
app/
  page.tsx              → Accueil (offres récentes + trending + recherche hero)
  layout.tsx            → Layout global (Navbar + Providers + Footer)
  globals.css           → Design system (couleurs, animations, classes utilitaires)
  login/page.tsx        → Connexion JWT
  register/page.tsx     → Inscription
  jobs/page.tsx         → Liste + filtres avancés + pagination
  jobs/[id]/page.tsx    → Détail offre + candidature modale
  dashboard/page.tsx    → 🔒 Tableau de bord
  profile/page.tsx      → 🔒 Édition profil
  preferences/page.tsx  → 🔒 Préférences de recherche
  applications/page.tsx → 🔒 Historique candidatures
  admin/page.tsx        → 🔒 Panneau scraping

components/
  Navbar.tsx            → Navigation responsive (desktop + mobile)
  JobCard.tsx           → Carte d'offre avec badges source/tech/remote
  Skeleton.tsx          → Skeleton loading + Pagination

context/
  AuthContext.tsx       → Auth global (JWT localStorage + user state)
  ToastContext.tsx      → Système de notifications toast

lib/
  api.ts                → Client HTTP natif (fetch) avec intercepteur JWT
  types.ts              → Interfaces TypeScript (mirror exact des DTOs backend)
  utils.ts              → Helpers (formatDate, formatSalary, parseTechStack…)
```

---

## 🔐 Authentification

Le JWT est stocké dans `localStorage` sous la clé `jwt_token`.  
Il est automatiquement injecté dans chaque requête via `lib/api.ts`.  
Un retour `401` de l'API déconnecte l'utilisateur et redirige vers `/login`.

---

## 🌐 API Backend

URL configurée dans `.env.local` :
```
NEXT_PUBLIC_API_URL=https://localhost:7248
```

Swagger disponible sur : `https://localhost:7248/swagger`

---

## 🎨 Design

- **Thème** : Dark navy / tech (inspiré VS Code + terminaux CLI)
- **Police** : Outfit (titres) + JetBrains Mono (code/badges)
- **Couleurs** : Cyan `#00c8ff` · Purple `#8b5cf6` · Green `#10b981`
- **Responsive** : Mobile, tablette, desktop
