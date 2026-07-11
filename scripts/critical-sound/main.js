const MODULE_ID = "mestre-weber-pf2e";
const SETTING_ENABLED = "criticalSoundEnabled";
const SETTING_VOLUME = "criticalSoundVolume";
const SETTING_DEMON_LORD_IMAGES = "demonLordImages";

const SOUND_NAT_20 = `modules/${MODULE_ID}/sounds/20natural.mp3`;
const SOUND_NAT_1 = `modules/${MODULE_ID}/sounds/1natural.mp3`;
const DEMON_LORD_FOLDER = `modules/${MODULE_ID}/images/lordes-demonios`;
const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif)$/i;

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

  // Cache da lista de imagens dos lordes demônios: só o Mestre tem permissão de navegar
  // no sistema de arquivos, então os jogadores leem essa lista já pronta.
  game.settings.register(MODULE_ID, SETTING_DEMON_LORD_IMAGES, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

Hooks.once("ready", () => {
  if (game.user.isGM) refreshDemonLordImages();
});

async function refreshDemonLordImages() {
  try {
    const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
    const { files } = await FilePickerImpl.browse("data", DEMON_LORD_FOLDER);
    const images = files.filter((file) => IMAGE_EXTENSION.test(file));
    await game.settings.set(MODULE_ID, SETTING_DEMON_LORD_IMAGES, images);
  } catch (err) {
    console.warn(`${MODULE_ID} | Não foi possível ler a pasta de imagens dos lordes demônios (${DEMON_LORD_FOLDER}).`, err);
  }
}

function pickRandomDemonLordImage() {
  const images = game.settings.get(MODULE_ID, SETTING_DEMON_LORD_IMAGES);
  if (!images?.length) return null;
  return images[Math.floor(Math.random() * images.length)];
}

function triggerShake() {
  document.body.classList.remove("mwpf2e-shake");
  void document.body.offsetWidth; // força reflow para reiniciar a animação se já estiver tremendo
  document.body.classList.add("mwpf2e-shake");
  setTimeout(() => document.body.classList.remove("mwpf2e-shake"), 600);
}

function showNat20Flash() {
  const el = document.createElement("div");
  el.className = "mwpf2e-nat20-flash";
  el.textContent = "20";
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

function showNat1Flash() {
  const image = pickRandomDemonLordImage();
  if (!image) return;

  const el = document.createElement("div");
  el.className = "mwpf2e-nat1-flash";
  el.style.backgroundImage = `url("${encodeURI(image)}")`;
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

Hooks.on("createChatMessage", (message) => {
  if (!game.settings.get(MODULE_ID, SETTING_ENABLED)) return;

  const roll = message.rolls?.[0];
  const d20 = roll?.dice?.find((die) => die.faces === 20);
  const natural = d20?.total;
  if (natural !== 1 && natural !== 20) return;

  // Só dispara para personagens jogadores, não para NPCs/monstros controlados pelo Mestre.
  const actor = ChatMessage.getSpeakerActor(message.speaker);
  if (actor?.type !== "character") return;

  const src = natural === 20 ? SOUND_NAT_20 : SOUND_NAT_1;
  const volume = game.settings.get(MODULE_ID, SETTING_VOLUME);
  foundry.audio.AudioHelper.play({ src, volume, autoplay: true, loop: false }, false);

  triggerShake();
  if (natural === 20) showNat20Flash();
  else showNat1Flash();
});
