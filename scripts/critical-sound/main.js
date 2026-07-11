const MODULE_ID = "mestre-weber-pf2e";
const SETTING_ENABLED = "criticalSoundEnabled";
const SETTING_VOLUME = "criticalSoundVolume";

const SOUND_NAT_20 = `modules/${MODULE_ID}/sounds/20natural.mp3`;
const SOUND_NAT_1 = `modules/${MODULE_ID}/sounds/1natural.mp3`;

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_ENABLED, {
    name: "MWPF2E.Settings.CriticalSound.Name",
    hint: "MWPF2E.Settings.CriticalSound.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTING_VOLUME, {
    name: "MWPF2E.Settings.CriticalSoundVolume.Name",
    hint: "MWPF2E.Settings.CriticalSoundVolume.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.8
  });
});

Hooks.on("createChatMessage", (message) => {
  if (!game.settings.get(MODULE_ID, SETTING_ENABLED)) return;

  const roll = message.rolls?.[0];
  const d20 = roll?.dice?.find((die) => die.faces === 20);
  const natural = d20?.total;
  if (natural !== 1 && natural !== 20) return;

  // Só toca para personagens jogadores, não para NPCs/monstros controlados pelo Mestre.
  const actor = ChatMessage.getSpeakerActor(message.speaker);
  if (actor?.type !== "character") return;

  const src = natural === 20 ? SOUND_NAT_20 : SOUND_NAT_1;
  const volume = game.settings.get(MODULE_ID, SETTING_VOLUME);
  foundry.audio.AudioHelper.play({ src, volume, autoplay: true, loop: false }, false);
});
