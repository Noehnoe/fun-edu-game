# 🎮 Submitting Brainy Bunch to CrazyGames

You now have a **portal build** of the game — the same 23 games, but with CrazyGames'
ad SDK instead of AdSense, and no external accounts (portals require self-contained games).
Your live site **noehnoe.com is untouched** and keeps all its features.

## What the portal build has / doesn't have
| Feature | noehnoe.com | CrazyGames build |
|---|---|---|
| 23 mini-games, coins, XP, badges, shop, rebirth | ✅ | ✅ |
| Progress saving | Cloud accounts | Local (device) only |
| Ads | Your Google AdSense | CrazyGames' ads (their SDK) |
| Accounts / global leaderboard | ✅ | ❌ (removed — portals host on their own domain) |
| CrazyGames ad breaks + gameplay tracking | — | ✅ built in |

## Step 1 — (Re)build the folder
The folder `crazygames-build/` is already made. To regenerate it any time:
```
node portal/build-crazygames.js
```

## Step 2 — Zip it correctly ⚠️
CrazyGames needs **`index.html` at the top level of the zip** — so zip the *contents*,
not the folder:
1. Open the **`crazygames-build`** folder.
2. Select **everything inside** it (`index.html`, `css`, `js`, `icons`, `manifest.json`, `menu music.mp3`).
3. Right-click → **Compress / Send to → Zip**.
4. You should get a zip where `index.html` sits at the root (not inside another folder).

## Step 3 — Create a developer account
Go to **https://developer.crazygames.com** → sign up (free).

## Step 4 — Submit the game
In the dashboard → **Submit / Add game** → upload your zip, then fill in:
- **Title:** Brainy Bunch
- **Description:** e.g. *"23 quick brain-training mini-games — logic, memory, math, language and reflex. Earn coins, level up, unlock games and collect badges!"*
- **Category:** Puzzle / Brain
- **Controls:** Mouse / touch / tap
- **Thumbnail:** they require a cover image (usually 16:9). You can screenshot the game or
  I can help you make one.

## Step 5 — Test with their QA tool
CrazyGames gives you a **preview / QA link** after upload. Play through it and check that:
- the game loads,
- ads appear when you return to the menu after a few games,
- everything is responsive on mobile.

Our integration already calls their SDK for **loading**, **gameplay start/stop**, and a
**midgame ad** at natural breaks (every 2nd return to the menu), so it should pass the
technical checks.

## Step 6 — Submit for review
Click submit. CrazyGames reviews manually — it can take a few days to a couple of weeks.
If approved, your game goes live on crazygames.com and you earn a **share of their ad
revenue** (paid monthly once you pass their payout threshold).

---

### 💡 Optional upgrade for more revenue: rewarded ads
The build includes a ready-to-use rewarded-ad function. If later you want a
**"Watch an ad for +50 coins"** button, call this from anywhere in the game:
```js
window.CGRewardedAd(function (rewarded) {
  if (rewarded) { /* give the player their bonus coins */ }
});
```
Tell me and I'll wire a nice button into the shop or result screen for you.
