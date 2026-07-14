# 🚀 Brainy Bunch — Accounts, Cloud Save, Leaderboard & Ads Setup

This adds real **user accounts** (password + optional security phrase), **guest mode**,
**cloud saving**, a **coin leaderboard**, and **Google AdSense** to your game — all on your
existing Cloudflare Pages site (`noehnoe.com`).

Everything is already coded and tested. You just need to do the parts that require **your
Cloudflare login** (I can't log in as you). It takes about 10 minutes.

---

## What was added

| File | What it does |
|------|--------------|
| `functions/api/[[path]].js` | Backend API (register / login / sync / leaderboard) — runs on Cloudflare Pages Functions |
| `schema.sql` | Database tables (users + sessions) |
| `wrangler.toml` | Connects the site to your D1 database |
| `js/cloud.js` | Frontend: login screen, cloud sync, leaderboard |
| `js/engine.js` | Small hooks so the game can save to the cloud |
| `index.html` / `css/style.css` | Login UI, Leaderboard tab, ad slots |

Passwords are **never stored in plain text** — they're hashed with PBKDF2-SHA256 (100k
iterations) and a unique salt per user. Login tokens are random and stored server-side.

---

## Part 1 — Create the database (run these once)

Open a terminal **in this folder** and run:

```bash
# 1. Log into Cloudflare (opens your browser)
npx wrangler login

# 2. Create the database
npx wrangler d1 create brainy-bunch-db
```

The second command prints something like:

```
[[d1_databases]]
binding = "DB"
database_name = "brainy-bunch-db"
database_id = "abc123-your-real-id-here"
```

**Copy that `database_id`** and paste it into `wrangler.toml`, replacing
`PASTE_DATABASE_ID_HERE`.

Then create the tables on the real (remote) database:

```bash
npx wrangler d1 execute brainy-bunch-db --remote --file=./schema.sql
```

---

## Part 2 — Deploy

Since your site auto-deploys from GitHub, just commit and push:

```bash
git add .
git commit -m "Add accounts, cloud save, leaderboard and ads"
git push
```

Cloudflare Pages will build and deploy the API automatically with the site.

### Connect the database to your Pages project (one time)

The Pages build needs to know about the D1 binding:

1. Go to **Cloudflare dashboard → Workers & Pages → your `fun-edu-game` project**.
2. **Settings → Bindings → Add → D1 database**.
3. Variable name: **`DB`**  · Database: **`brainy-bunch-db`** · Save.
4. **Deployments → retry/redeploy** the latest deployment so the binding takes effect.

That's it — accounts, saving and the leaderboard are now live on `noehnoe.com`. 🎉

---

## Part 3 — Google AdSense (real ad money)

Ads are already wired into the page (a banner under the home screen). You just need your
own AdSense account and to swap in your IDs.

1. **Apply** at <https://adsense.google.com> with `noehnoe.com`. Approval can take a few
   days to a couple of weeks and requires the site to be live with real content — which it
   now is.
2. Once approved, AdSense gives you a **Publisher ID** like `ca-pub-1234567890123456`.
3. Search the project for **`ca-pub-XXXXXXXXXXXXXXXX`** and replace **every** occurrence
   with your real Publisher ID. It appears in:
   - `index.html` (the `<head>` script tag, once)
   - `index.html` (the ad slot, `data-ad-client`, once)
4. Create an **ad unit** in the AdSense dashboard → it gives you a **slot ID** (a number).
   Replace `data-ad-slot="0000000000"` in `index.html` with it.
5. Commit and push again.

> 💡 Easiest option: turn on **Auto ads** in the AdSense dashboard for `noehnoe.com`.
> Then the `<head>` script alone places ads automatically and you can ignore the manual
> slot. Ads never show while a mini-game is being played (they hide during gameplay).

**Payment:** AdSense pays out once your balance reaches **$100**. You add your bank
details in the AdSense dashboard under Payments.

---

## How the login works (for reference)

- **Sign up:** username (3–20 chars) + password (6+ chars). A **security phrase** is
  optional — think of it as a second password for extra protection.
- **Log in:** username + password. **If** the account has a security phrase, it must also
  be entered (the field says "if you set one" — leave it blank if you didn't).
- **Guest:** plays immediately, progress saved only on that device (localStorage), and
  **not** shown on the leaderboard. Guests can upgrade to a full account any time (their
  progress carries over).
- **Leaderboard:** ranks everyone by total coins. Updates automatically as people play.

---

## Testing locally (optional)

```bash
# create a local test database
npx wrangler d1 execute brainy-bunch-db --local --file=./schema.sql
# run the site + API locally at http://127.0.0.1:8788
npx wrangler pages dev . --port 8788
```

Local mode uses a separate on-disk database, so you can experiment without touching the
real one.
