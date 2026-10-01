// Runs after the loading-screen DOM exists and before the deferred game module.
// Keep startup code in an external file: YouTube CSP can reject inline scripts.
if (typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV) {
  ytgame.game.firstFrameReady();
}
