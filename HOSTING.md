# Deploying HairTrack

HairTrack is a **client-side React SPA** backed entirely by Firebase
(Authentication, Firestore, Storage). No server runtime is required, so it
can be hosted on any static host.

Build output directory: **`dist/`**
Build command: **`bun run build`** (or `npm run build`)

> All routing is client-side via TanStack Router. Every host below is configured
> to rewrite unknown URLs to `/index.html` so deep links work on refresh.

---

## 1. Vercel

Already configured via [`vercel.json`](./vercel.json).

```bash
npm i -g vercel
vercel            # first deploy (link project)
vercel --prod     # production deploy
```

Or push to GitHub and import the repo at https://vercel.com/new.

## 2. Netlify

Already configured via [`netlify.toml`](./netlify.toml).

```bash
npm i -g netlify-cli
netlify deploy --build           # preview
netlify deploy --build --prod    # production
```

Or drag-and-drop the `dist/` folder at https://app.netlify.com/drop.

## 3. Firebase Hosting

Already configured via [`firebase.json`](./firebase.json) +
[`.firebaserc`](./.firebaserc) (project `essashave`).

```bash
npm i -g firebase-tools
firebase login
bun run build
firebase deploy --only hosting
```

---

## Environment / Firebase config

Firebase config is currently inlined in `src/lib/firebase.ts` (project
`essashave`). Anon/publishable Firebase keys are safe to ship in client
bundles — security is enforced by Firestore/Storage **Security Rules** and
Firebase Authentication. Make sure your rules are tightened before going
public.

## Required Firebase setup

1. **Authentication** → enable Email/Password.
2. **Firestore Database** → create a database (Native mode).
3. **Storage** → enable.
4. Add your hosting domain(s) (e.g. `your-app.vercel.app`,
   `your-app.netlify.app`, `essashave.web.app`) to
   **Authentication → Settings → Authorized domains**.
