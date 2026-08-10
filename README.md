# Tournoi commémoratif

Plateforme de gestion complète pour un mini-tournoi de football commémoratif : candidatures → validation →
check-in → tirage → matchs → vainqueur, avec logistique, budget et communication. Voir `docs/` (aucun dossier
docs séparé pour l'instant — tout est ici) pour le détail.

Stack : Next.js 16 (App Router) · TypeScript strict · Tailwind CSS + shadcn/ui · Supabase (Postgres + Auth) ·
Zod · React Hook Form · Vitest · déploiement Vercel.

## Installation locale

```bash
npm install
cp .env.example .env.local
# renseigner .env.local (voir section suivante)
npm run dev
```

L'app tourne sur http://localhost:3000.

## Variables d'environnement

À définir dans `.env.local` (jamais committé) :

| Variable | Où la trouver | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Client navigateur + serveur |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem | Client navigateur + serveur (protégée par RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | idem — **secrète** | Scripts locaux uniquement (`create-admin`, `seed`) |

En production (Vercel), ajoute ces mêmes variables dans Project Settings → Environment Variables.

## Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Dans le SQL Editor, exécute le contenu de `supabase/migrations/20260811120000_init_schema.sql`
   (ou utilise la CLI Supabase, voir plus bas) — crée les tables, les policies RLS et les fonctions RPC
   utilisées par le flux d'inscription public.
3. Récupère l'URL du projet et la clé `anon` dans Project Settings → API, mets-les dans `.env.local`.
4. Récupère la clé `service_role` (même page) pour les scripts locaux — **ne jamais l'exposer côté client**.

## Migrations

Le schéma est versionné dans `supabase/migrations/`. Pour reconstruire la base sur un nouveau projet Supabase :

```bash
npx supabase login
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```

Ou, plus simplement pour un premier déploiement, colle le contenu du fichier de migration directement dans le
SQL Editor de Supabase.

## Créer le premier administrateur

```bash
npm run create-admin -- --email=jean-raymond@example.com --password=motdepasse-solide --name="Jean-Raymond" --role=super_admin
```

Rôles disponibles : `super_admin`, `tournament_manager`, `read_only`. Connexion ensuite sur `/admin/login`.

## Données de démonstration

Pour tester l'app immédiatement sans attendre de vraies inscriptions :

```bash
npm run seed
```

Crée un tournoi **DEMO** (clairement labellisé) avec 8 équipes, un bracket complet, des quarts joués, une
demi-finale jouée, une demi-finale en cours et une finale à venir — plus deux candidatures en attente/refusée,
et des données de budget/logistique/communication d'exemple. Peut être relancé (crée un nouveau tournoi DEMO à
chaque fois) ; supprime les lignes `tournaments` dont le nom commence par `DEMO —` pour nettoyer.

## Développement

```bash
npm run dev         # serveur de dev (Turbopack)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Tests

```bash
npm run test         # Vitest — moteur de tournoi (bracket, byes, scoring, planning, budget)
npm run test:watch   # mode watch
```

Les tests couvrent la logique métier pure (`src/lib/tournament/`) : génération de bracket et répartition des
byes (4 à 8+ équipes, jamais deux byes dans le même match), détermination du vainqueur (score, tirs au but,
forfait), planning des créneaux (13h–17h et détection de dépassement), calculs budgétaires.

Pas de suite E2E automatisée pour l'instant (Playwright serait l'outil recommandé pour le parcours complet
inscription → validation → tirage → scores → vainqueur) — à ajouter si le projet continue d'évoluer après le
tournoi.

## Build

```bash
npm run build
npm run start
```

## Déploiement Vercel

1. Pousse le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importe le dépôt (Next.js détecté automatiquement).
3. Renseigne les 3 variables d'environnement (voir plus haut) dans Project Settings → Environment Variables.
4. Déploie — chaque push sur `main` redéploie automatiquement.

## Administration du tournoi

Une fois connecté sur `/admin` :

1. **Paramètres** — configure le tournoi (nom, date, lieu, créneau, règles). C'est la première chose à faire.
2. **Communication** — récupère le QR code pointant vers `/inscription`, à intégrer au flyer.
3. **Candidatures** — au fil des inscriptions, valide / demande des infos / refuse / mets en liste d'attente.
   Valider crée automatiquement l'équipe officielle + son roster.
4. **Équipes** — suivi des équipes validées et de leur parcours individuel.
5. **Budget / Logistique** — suivi des dépenses (terrain, chasubles...) et comparatif des options boissons.

## Procédure jour J

1. **Check-in** (`/admin/check-in`) — pointe les équipes présentes au fur et à mesure de leur arrivée.
2. **Tableau du tournoi** (`/admin/tournoi/tableau`) — sélectionne les équipes présentes, lance le tirage
   (aléatoire). Le planning des matchs est calculé automatiquement sur le créneau configuré ; une alerte
   apparaît si les horaires dépassent l'heure de fin.
3. **Matchs** (`/admin/tournoi/matchs`) — saisis les scores au fur et à mesure. Le vainqueur est calculé
   automatiquement (tirs au but si égalité), propagé au tour suivant, et le tournoi passe en "Terminé" après
   la finale. Un forfait peut être déclaré directement depuis la fiche du match.
4. La page publique `/tournoi` (et le tableau `/tournoi/tableau`) se met à jour en temps réel pour les
   spectateurs à chaque saisie de résultat (rechargement de page — pas de push temps réel dans cette version).

## Choses à configurer avec Jean-Raymond avant le jour J

- Confirmer le nombre min/max de joueurs par équipe (valeur actuelle par défaut : 5 à 12).
- Confirmer la durée réelle d'un match et le temps de transition entre deux matchs (valeur par défaut :
  20 min / 5 min — à ajuster dans Paramètres selon le nombre d'équipes final).
- Nombre de chasubles à commander (prix unitaire déjà connu : 900 FCFA).
- Choix définitif entre les deux options boissons (cannettes vs pression) — à trancher dans Logistique une
  fois les deux devis reçus (Mama / Sandy).
- Date limite d'inscription, si l'on souhaite en fixer une (actuellement non fixée par défaut).

## Notes d'architecture

- **RBAC** : trois rôles (`super_admin`, `tournament_manager`, `read_only`) portés par une table `profiles`
  liée à `auth.users`. Vérifié à la fois côté RLS (Postgres) et côté serveur (`requireSession()` dans chaque
  Server Action / page admin) — jamais uniquement côté client.
- **Candidatures publiques** : pas de compte pour les capitaines — accès via un lien privé à token opaque
  (`/mon-equipe/[access_token]`), plus sûr qu'une référence devinable. Les mutations publiques passent par des
  fonctions Postgres `SECURITY DEFINER` (`create_application`, `get_application_by_token`,
  `update_application_by_token`) qui valident elles-mêmes le token et le statut modifiable.
- **Moteur de tournoi** (`src/lib/tournament/`) : logique pure, sans dépendance à la base de données ni à
  Next.js — testée indépendamment (`*.test.ts`), partagée entre le Server Action de génération du bracket et
  le script de seed via `persist-bracket.ts`.
- **Un seul tournoi actif à la fois** dans l'UI (v1) — le schéma (table `tournaments`) permet néanmoins d'en
  créer plusieurs dans le temps sans changement de structure si besoin plus tard.
- **Types Supabase** (`src/types/database.ts`) écrits à la main en l'absence de projet Supabase live à
  introspecter — à régénérer avec `npx supabase gen types typescript` une fois le premier projet créé, pour
  rester synchronisé avec le schéma réel après d'éventuelles migrations futures.
