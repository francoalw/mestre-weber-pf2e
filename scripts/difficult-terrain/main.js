const REGION_BEHAVIOR_TYPE = "modifyMovementCost";
const DIFFICULT_TERRAIN_VALUE = 2;
const REGION_NAME = "Terreno Difícil";
const REGION_COLOR = "#a0522d";

let difficultTerrainModeActive = false;

// Adiciona um novo botão (toggle) na aba Controles de Região. Enquanto ativo, qualquer
// Região nova criada ao desenhar uma forma (retângulo, elipse/emanação, polígono/cone)
// recebe automaticamente o comportamento "Modificar Custo de Movimento" configurado como
// Terreno Difícil, sem precisar configurar isso manualmente depois.
Hooks.on("getSceneControlButtons", (controls) => {
  const regionsControl = controls.regions;
  if (!regionsControl) return;

  regionsControl.tools.mwpf2eDifficultTerrain = {
    name: "mwpf2eDifficultTerrain",
    title: "Desenhar Terreno Difícil",
    icon: "fa-solid fa-mountain",
    order: Object.keys(regionsControl.tools).length,
    toggle: true,
    active: difficultTerrainModeActive,
    visible: game.user.isGM,
    onChange: (_event, active) => {
      difficultTerrainModeActive = active;
    }
  };
});

Hooks.on("preCreateRegion", (region) => {
  if (!difficultTerrainModeActive || !game.user.isGM) return;

  region.updateSource({
    name: REGION_NAME,
    color: REGION_COLOR,
    behaviors: [
      {
        name: REGION_NAME,
        type: REGION_BEHAVIOR_TYPE,
        system: { difficulties: { walk: DIFFICULT_TERRAIN_VALUE } }
      }
    ]
  });
});
