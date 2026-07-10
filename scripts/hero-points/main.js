const MODULE_ID = "mestre-weber-pf2e";
const SETTING_MAX_HERO_POINTS = "maxHeroPoints";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_MAX_HERO_POINTS, {
    name: "MWPF2E.Settings.MaxHeroPoints.Name",
    hint: "MWPF2E.Settings.MaxHeroPoints.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 10, step: 1 },
    default: 5,
    requiresReload: true
  });
});

Hooks.once("setup", () => {
  const CharacterPF2e = CONFIG.PF2E?.Actor?.documentClasses?.character;
  if (!CharacterPF2e) {
    console.warn(`${MODULE_ID} | Classe de personagem do PF2e não encontrada; o sistema pode ser incompatível.`);
    return;
  }

  const original = CharacterPF2e.prototype.prepareBaseData;
  CharacterPF2e.prototype.prepareBaseData = function (...args) {
    original.call(this, ...args);
    // Personagens Míticos usam Pontos Míticos em vez de Pontos Heróicos (max fica 0 nesse caso).
    const heroPoints = this.system.resources?.heroPoints;
    if (heroPoints && heroPoints.max > 0) heroPoints.max = game.settings.get(MODULE_ID, SETTING_MAX_HERO_POINTS);
  };

  console.log(`${MODULE_ID} | Máximo de Pontos Heróicos configurável via Configurações do Mundo`);
});
