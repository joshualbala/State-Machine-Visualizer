# Deploying to Vercel

This is a static Vite/React SPA — `npm run build` produces `dist/`, and that's the entire
deployment artifact (no server, no environment variables, no database). `vercel.json` at the repo
root pins the framework/build command explicitly so detection is unambiguous.

## Option A — Vercel dashboard (recommended, no CLI needed)

1. Push this repo to GitHub (if it isn't already).
2. Go to [vercel.com/new](https://vercel.com/new) and sign in.
3. Import the GitHub repo. Vercel will read `vercel.json` and pick up:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. First deploy takes ~1 minute.
5. Every push to your default branch redeploys production automatically; every PR gets its own
   preview URL.

No environment variables or additional configuration are needed.

## Option B — Vercel CLI

```bash
npm install -g vercel   # one-time
vercel login            # opens a browser to authenticate
vercel                  # from the repo root: links the project, deploys a preview
vercel --prod           # promotes to your production domain
```

The first `vercel` run asks a few setup questions (scope/team, project name, link to existing
project or not) — accept the defaults unless you have a reason not to. `.vercel/` (the local
project link Vercel CLI creates) is already git-ignored.

## Custom domain

Project → Settings → Domains in the Vercel dashboard. Not required — every deploy gets a
`*.vercel.app` URL automatically.

## Verifying a deploy locally first

```bash
npm run build
npm run preview   # serves dist/ at http://localhost:4173
```

Useful as a sanity check that the production build (minified, no dev-server conveniences) still
works before pushing.
