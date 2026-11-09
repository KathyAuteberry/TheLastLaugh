# Deploying

The site is static: `npm run build` writes about 0.5 MB to `dist/`. Pages use `#` addresses, so the host needs no routing rules. It is hosted on Cloudflare Pages (free), uploaded straight from this machine; no GitHub repo is needed.

## One-time setup

1. Have a Cloudflare account (free).
2. Sign in from this machine (opens a browser; you sign in yourself):

   ```bash
   npx wrangler login
   ```

3. The first `npm run deploy` creates the Pages project `the-last-laugh` and asks which branch is production: answer `master` (the name `npm run deploy` uploads to; it's only Cloudflare's label for the live site and has nothing to do with jj bookmarks).

## Deploy

```bash
npm run deploy
```

This validates the data, type-checks, builds, runs the unit tests, then uploads `dist/`. The site is at `https://the-last-laugh.pages.dev`.

To try a build without touching the main address:

```bash
npm run deploy:preview
```

It goes to `https://preview.the-last-laugh.pages.dev` (each upload also gets its own address, printed at the end).

Optional before deploying: `npm run e2e` (browser smoke tests, about 5 s).

## Undo and settings (Cloudflare dashboard)

- **Roll back:** Workers & Pages → the-last-laugh → Deployments → pick an earlier one → Rollback.
- **Keep it private:** Workers & Pages → the-last-laugh → Settings → enable Cloudflare Access, then add the emails allowed in (free for up to 50 users). Preview addresses can be protected the same way.
- **Custom domain:** Workers & Pages → the-last-laugh → Custom domains.

## Notes

- Wrangler is pinned in `package.json` (`4.151.2`). npm skipped its `workerd` install step (npm's install-script approval); that part only runs Workers locally and is not used for uploading.
- What gets published is exactly `dist/`: the built app and its data. Nothing from `docs/` or the source sheets is uploaded; the source list inside the app only names their file paths (e.g. `docs/source/ikuya-mitty-v6.3.xlsx`), as part of the credits.
