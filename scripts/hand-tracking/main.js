const MODULE_ID = "mestre-weber-pf2e";
const SETTING_ENABLED = "handTrackingEnabled";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_ENABLED, {
    name: "MWPF2E.Settings.HandTracking.Name",
    hint: "MWPF2E.Settings.HandTracking.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  console.log(`${MODULE_ID} | Initializing hand-tracking`);
});

Hooks.on("preUpdateItem", (item, changes, options, userId) => {
  if (!game.settings.get(MODULE_ID, SETTING_ENABLED)) return;
  if (game.user.isGM) return;

  const actor = item.actor;
  if (!actor || !actor.isOfType("character")) return;

  const equippedChanges = changes.system?.equipped;
  if (!equippedChanges) return;

  const currentEquipped = item.system.equipped;
  const carryType = equippedChanges.carryType ?? currentEquipped.carryType;
  if (carryType !== "held") return;

  const handsHeld = equippedChanges.handsHeld ?? currentEquipped.handsHeld ?? 1;
  if (handsHeld <= 0) return;

  const maxHands = actor.system.hands?.max?.value ?? 2;
  const otherHandsHeld = heldHandsExcluding(actor, item.id);

  if (otherHandsHeld + handsHeld > maxHands) {
    const free = Math.max(maxHands - otherHandsHeld, 0);
    ui.notifications.warn(game.i18n.format("MWPF2E.HandTracking.NotEnoughHands", {
      item: item.name,
      needed: handsHeld,
      free
    }));
    return false;
  }
});

function heldHandsExcluding(actor, excludeItemId) {
  let total = 0;
  for (const item of actor.inventory) {
    if (item.id === excludeItemId) continue;
    total += item.handsHeld ?? 0;
  }
  return total;
}
