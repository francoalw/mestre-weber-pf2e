import {
  getCompartments,
  getItemCompartment,
  setItemCompartment,
  toggleCompartmentCollapsed
} from "./compartments.js";
import { escapeHTML } from "./util.js";

const ACTION_LIST_SELECTOR = "section.actions-panel ol.actions-list.item-list.directory-list:not(.strikes-list)";

export function onRenderActions(app, html) {
  const actor = app.actor ?? app.document;
  if (!actor || !actor.isOwner) return;
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  injectManageButton(root, actor);
  groupByCompartment(root, actor);
}

// Identifies which action section (encounter/exploration/downtime + action type) a "Criar Ação"
// button belongs to, so compartments created there stay scoped to that section only.
function getSectionScope(createBtn) {
  const panel = createBtn.closest(".actions-panel");
  const tab = panel?.dataset.tab ?? "";
  const traits = createBtn.dataset.traits ?? "";
  const actionType = createBtn.dataset.actionType ?? "";
  return `${tab}|${traits}|${actionType}`;
}

function injectManageButton(root, actor) {
  const pane = root.querySelector(".tab.actions.actions-pane");
  if (!pane) return;

  const createButtons = pane.querySelectorAll('header .controls button[data-action="create-item"][data-type="action"]');
  for (const createBtn of createButtons) {
    const controls = createBtn.parentElement;
    if (!controls || controls.querySelector(".action-compartment-manage-btn")) continue;

    const scope = getSectionScope(createBtn);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-compartment-manage-btn";
    btn.dataset.tooltip = game.i18n.localize("ACTIONCOMP.ManageCompartments");
    btn.innerHTML = `<i class="fa-solid fa-fw fa-folder-tree"></i>${game.i18n.localize("ACTIONCOMP.ManageCompartmentsShort")}`;
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const { openManageDialog } = await import("./manage-dialog.js");
      openManageDialog(actor, scope);
    });
    createBtn.after(btn);
  }
}

function groupByCompartment(root, actor) {
  const lists = root.querySelectorAll(ACTION_LIST_SELECTOR);
  for (const ol of lists) {
    const createBtn = ol.previousElementSibling?.querySelector(
      '.controls button[data-action="create-item"][data-type="action"]'
    );
    if (!createBtn) continue;

    const scope = getSectionScope(createBtn);
    const compartments = getCompartments(actor, scope);
    if (!compartments.length) continue;

    const lis = Array.from(ol.children).filter((el) => el.tagName === "LI");

    const buckets = new Map();
    const rest = [];
    for (const li of lis) {
      const itemId = li.dataset.itemId;
      const item = itemId ? actor.items.get(itemId) : null;
      const compartmentId = item ? getItemCompartment(item) : null;
      const compartment = compartmentId ? compartments.find((c) => c.id === compartmentId) : null;
      if (compartment) {
        if (!buckets.has(compartment.id)) buckets.set(compartment.id, []);
        buckets.get(compartment.id).push(li);
      } else {
        rest.push(li);
      }
    }

    const frag = document.createDocumentFragment();
    for (const compartment of compartments) {
      frag.appendChild(buildGroupElement(compartment, buckets.get(compartment.id) ?? [], actor));
    }
    for (const li of rest) frag.appendChild(li);
    ol.append(frag);

    attachRootDropHandler(ol, actor);
  }
}

function buildGroupElement(compartment, items, actor) {
  const li = document.createElement("li");
  li.className = `action-compartment-group${compartment.collapsed ? " collapsed" : ""}`;
  li.dataset.compartmentId = compartment.id;

  const header = document.createElement("div");
  header.className = "action-compartment-header";
  header.innerHTML = `
    <i class="fa-solid fa-chevron-right action-compartment-caret"></i>
    <i class="fa-solid fa-folder${compartment.collapsed ? "" : "-open"} fa-fw action-compartment-icon"></i>
    <span class="action-compartment-name">${escapeHTML(compartment.name)}</span>
    <span class="action-compartment-count">${items.length}</span>
  `;
  header.addEventListener("click", async () => {
    await toggleCompartmentCollapsed(actor, compartment.id);
  });
  li.appendChild(header);

  const nested = document.createElement("ol");
  nested.className = "actions-list item-list directory-list action-compartment-contents";
  for (const item of items) {
    ensureDraggable(item, actor);
    nested.appendChild(item);
  }
  li.appendChild(nested);

  attachDropHandler(li, actor, compartment.id, li);

  return li;
}

// Foundry marks each action row as draggable on its own, but once we move a row into
// our nested compartment list that can be lost, and the browser falls back to a
// text-selection drag that visually "selects" the whole folder instead of moving just
// the one action. Binding our own dragstart guarantees a real, single-item drag.
function ensureDraggable(li, actor) {
  if (li.dataset.compartmentDragBound) return;
  li.dataset.compartmentDragBound = "1";
  li.draggable = true;
  li.addEventListener("dragstart", (event) => {
    const item = actor.items.get(li.dataset.itemId);
    if (!item) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: item.uuid }));
  });
}

function attachDropHandler(target, actor, compartmentId, highlightEl) {
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    highlightEl.classList.add("drag-over");
  });
  target.addEventListener("dragleave", (event) => {
    if (!target.contains(event.relatedTarget)) highlightEl.classList.remove("drag-over");
  });
  target.addEventListener("drop", async (event) => {
    highlightEl.classList.remove("drag-over");
    const item = resolveDroppedOwnItem(event, actor);
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    await setItemCompartment(item, compartmentId);
  });
}

function attachRootDropHandler(ol, actor) {
  if (ol.dataset.actionCompartmentRootBound) return;
  ol.dataset.actionCompartmentRootBound = "1";
  ol.addEventListener("dragover", (event) => event.preventDefault());
  ol.addEventListener("drop", async (event) => {
    const item = resolveDroppedOwnItem(event, actor);
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    await setItemCompartment(item, null);
  });
}

function resolveDroppedOwnItem(event, actor) {
  let data;
  try {
    data = JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch {
    return null;
  }
  if (!data || data.type !== "Item" || !data.uuid) return null;
  const item = fromUuidSync(data.uuid);
  if (!item || item.actor?.uuid !== actor.uuid) return null;
  return item;
}
