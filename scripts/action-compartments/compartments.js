export const MODULE_ID = "mestre-weber-pf2e";
const ACTOR_FLAG = "actionCompartments";
const ITEM_FLAG = "actionCompartment";

/** @returns {{id: string, name: string, collapsed: boolean, scope: string|null}[]} */
export function getCompartments(actor, scope) {
  const all = foundry.utils.deepClone(actor.getFlag(MODULE_ID, ACTOR_FLAG) ?? []);
  return scope === undefined ? all : all.filter((c) => c.scope === scope);
}

export async function setCompartments(actor, compartments) {
  return actor.setFlag(MODULE_ID, ACTOR_FLAG, compartments);
}

export async function createCompartment(actor, name, scope) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const compartments = getCompartments(actor);
  const compartment = { id: foundry.utils.randomID(), name: trimmed, collapsed: false, scope: scope ?? null };
  compartments.push(compartment);
  await setCompartments(actor, compartments);
  return compartment;
}

export async function renameCompartment(actor, id, name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const compartments = getCompartments(actor);
  const compartment = compartments.find((c) => c.id === id);
  if (!compartment) return;
  compartment.name = trimmed;
  await setCompartments(actor, compartments);
}

export async function deleteCompartment(actor, id) {
  const compartments = getCompartments(actor).filter((c) => c.id !== id);
  await setCompartments(actor, compartments);

  const updates = actor.items
    .filter((item) => item.getFlag(MODULE_ID, ITEM_FLAG) === id)
    .map((item) => ({ _id: item.id, [`flags.${MODULE_ID}.-=${ITEM_FLAG}`]: null }));
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
}

export async function toggleCompartmentCollapsed(actor, id) {
  const compartments = getCompartments(actor);
  const compartment = compartments.find((c) => c.id === id);
  if (!compartment) return;
  compartment.collapsed = !compartment.collapsed;
  await setCompartments(actor, compartments);
}

export function getItemCompartment(item) {
  return item.getFlag(MODULE_ID, ITEM_FLAG) ?? null;
}

export async function setItemCompartment(item, compartmentId) {
  if (!compartmentId) return item.unsetFlag(MODULE_ID, ITEM_FLAG);
  return item.setFlag(MODULE_ID, ITEM_FLAG, compartmentId);
}
