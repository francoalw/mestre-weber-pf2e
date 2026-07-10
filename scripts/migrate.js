const NEW_SCOPE = "mestre-weber-pf2e";
const OLD_INVENTORY_SCOPE = "inventory-compartments";
const OLD_ATHLETICS_SCOPE = "athletics-attacks";

// Migra flags gravadas pelos módulos antigos (agora fundidos neste) para o novo escopo compartilhado,
// já que actor.getFlag/setFlag validam o escopo contra módulos ativos e os antigos deixam de existir.
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  for (const actor of game.actors) {
    await migrateActor(actor);
  }
});

async function migrateActor(actor) {
  const updates = {};

  const oldCompartments = actor.flags?.[OLD_INVENTORY_SCOPE]?.compartments;
  if (oldCompartments && !actor.flags?.[NEW_SCOPE]?.compartments) {
    updates[`flags.${NEW_SCOPE}.compartments`] = oldCompartments;
  }

  const oldShowManeuvers = actor.flags?.[OLD_ATHLETICS_SCOPE]?.showManeuvers;
  if (oldShowManeuvers !== undefined && actor.flags?.[NEW_SCOPE]?.showManeuvers === undefined) {
    updates[`flags.${NEW_SCOPE}.showManeuvers`] = oldShowManeuvers;
  }

  if (Object.keys(updates).length) await actor.update(updates);

  const itemUpdates = [];
  for (const item of actor.items) {
    const oldCompartment = item.flags?.[OLD_INVENTORY_SCOPE]?.compartment;
    if (oldCompartment && !item.flags?.[NEW_SCOPE]?.compartment) {
      itemUpdates.push({ _id: item.id, [`flags.${NEW_SCOPE}.compartment`]: oldCompartment });
    }
  }
  if (itemUpdates.length) await actor.updateEmbeddedDocuments("Item", itemUpdates);
}
