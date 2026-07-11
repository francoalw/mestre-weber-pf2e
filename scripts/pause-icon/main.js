const MODULE_ID = "mestre-weber-pf2e";
const SETTING_NO_SPIN = "pauseIconNoSpin";
const CSS_CLASS = "mwpf2e-pause-no-spin";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_NO_SPIN, {
    name: "MWPF2E.Settings.PauseIconNoSpin.Name",
    hint: "MWPF2E.Settings.PauseIconNoSpin.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: applyPauseSpinState
  });
});

Hooks.once("ready", applyPauseSpinState);

function applyPauseSpinState() {
  const noSpin = game.settings.get(MODULE_ID, SETTING_NO_SPIN);
  document.body.classList.toggle(CSS_CLASS, noSpin);
}
