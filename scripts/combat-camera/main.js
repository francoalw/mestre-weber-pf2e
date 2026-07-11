const MODULE_ID = "mestre-weber-pf2e";
const SETTING_PAN_TO_COMBATANT = "panToCombatant";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_PAN_TO_COMBATANT, {
    name: "MWPF2E.Settings.PanToCombatant.Name",
    hint: "MWPF2E.Settings.PanToCombatant.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      disabled: "MWPF2E.Settings.PanToCombatant.Choices.Disabled",
      gm: "MWPF2E.Settings.PanToCombatant.Choices.GM",
      everyone: "MWPF2E.Settings.PanToCombatant.Choices.Everyone"
    },
    default: "everyone"
  });
});

Hooks.on("updateCombat", (combat, changed) => {
  if (!("turn" in changed) && !("round" in changed)) return;

  const mode = game.settings.get(MODULE_ID, SETTING_PAN_TO_COMBATANT);
  if (mode === "disabled") return;
  if (mode === "gm" && !game.user.isGM) return;

  panToCombatant(combat);
});

function panToCombatant(combat) {
  const combatant = combat.combatant;
  if (!combatant) return;

  if (!canvas.ready || (combat.scene && combat.scene.id !== canvas.scene?.id)) return;

  const token = combatant.token?.object ?? combatant.actor?.getActiveTokens(true)[0];
  if (!token) return;

  // Não entrega a posição de combatentes ocultos/invisíveis para quem não pode detectá-los;
  // o Mestre sempre enxerga, então o pan não é restringido para ele.
  if (!game.user.isGM && !token.visible) return;

  canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 500 });
}
