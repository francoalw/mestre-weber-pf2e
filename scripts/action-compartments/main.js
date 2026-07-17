import { MODULE_ID } from "./compartments.js";
import { onRenderActions } from "./render.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing action-compartments`);
});

Hooks.on("renderCharacterSheetPF2e", onRenderActions);
