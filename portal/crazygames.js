/* ===================================================================
   Brainy Bunch — CrazyGames SDK integration (portal build only)
   Loaded ONLY in the CrazyGames version, never on noehnoe.com.
   Maps the engine's arcade hooks -> CrazyGames SDK calls, and shows
   their ads at natural breaks. Everything is guarded so the game still
   runs fine if the SDK is missing (e.g. testing locally).
   Docs: https://docs.crazygames.com
   =================================================================== */
(function () {
  'use strict';

  function sdk() {
    return (window.CrazyGames && window.CrazyGames.SDK) ? window.CrazyGames.SDK : null;
  }

  let ready = false;
  let playing = false;     // are we inside active gameplay right now?
  let sinceAd = 0;         // games finished since the last ad (frequency guard)
  let adInFlight = false;

  const SAVE_KEY = 'brainy-bunch-save-v1';   // same key engine.js uses for localStorage

  /* ---- Data Module: load the player's cloud save, then let the engine boot ---- */
  function loadCloudSave() {
    const s = sdk();
    if (!s || !s.data) return;
    try {
      const raw = s.data.getItem(SAVE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (window.Game && Game.loadRemoteState) Game.loadRemoteState(state, false);
      }
    } catch (e) { console.warn('[CrazyGames] could not read save:', e); }
  }

  /* ---- Data Module: push the current state up whenever the game saves ---- */
  function saveCloudSave(state) {
    const s = sdk();
    if (!s || !s.data) return;
    try { s.data.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('[CrazyGames] could not write save:', e); }
  }

  /* ---- init: tell CrazyGames the game is loading, then ready ---- */
  async function init() {
    const s = sdk();
    if (!s) { console.info('[CrazyGames] SDK not present — running standalone.'); return; }
    try {
      await s.init();
      ready = true;
      // The game boots instantly (no async asset load), so loading is already done.
      try { s.game.sdkGameLoadingStart && s.game.sdkGameLoadingStart(); } catch (e) {}
      try { s.game.loadingStop && s.game.loadingStop(); } catch (e) {}
      try { s.game.gameplayStop && s.game.gameplayStop(); } catch (e) {}

      loadCloudSave();
      if (window.Game && Game.setSaveHook) Game.setSaveHook(saveCloudSave);
    } catch (e) {
      console.warn('[CrazyGames] init failed:', e);
    }
  }

  /* ---- gameplay tracking ---- */
  function gameplayStart() {
    const s = sdk();
    playing = true;
    if (ready && s) { try { s.game.gameplayStart(); } catch (e) {} }
  }
  function gameplayStop() {
    const s = sdk();
    if (playing && ready && s) { try { s.game.gameplayStop(); } catch (e) {} }
    playing = false;
  }

  /* ---- midgame ad at a natural break (returning to the menu) ---- */
  function requestMidgameAd() {
    const s = sdk();
    if (!ready || !s || adInFlight) return;
    // Show at most every 2nd time the player comes back to the menu.
    sinceAd++;
    if (sinceAd < 2) return;
    sinceAd = 0;
    adInFlight = true;
    try {
      s.ad.requestAd('midgame', {
        adFinished: () => { adInFlight = false; },
        adError:    () => { adInFlight = false; },
        adStarted:  () => {}
      });
    } catch (e) { adInFlight = false; }
  }

  /* ---- the hooks the engine calls (see engine.js arcadeHook) ---- */
  window.__ARCADE_HOOKS__ = {
    gameplayStart: function () { gameplayStart(); },
    gameplayStop:  function () { gameplayStop(); },
    returnToMenu:  function () { gameplayStop(); requestMidgameAd(); }
  };

  /* ---- OPTIONAL: a rewarded ad the game can offer for bonus coins ----
     Call window.CGRewardedAd(onReward) from a button if you add one later. */
  window.CGRewardedAd = function (onReward) {
    const s = sdk();
    if (!ready || !s) { onReward && onReward(false); return; }
    try {
      s.ad.requestAd('rewarded', {
        adFinished: () => { onReward && onReward(true); },
        adError:    () => { onReward && onReward(false); },
        adStarted:  () => {}
      });
    } catch (e) { onReward && onReward(false); }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
