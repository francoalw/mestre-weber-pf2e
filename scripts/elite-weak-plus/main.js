const MODULE_ID = "mestre-weber-pf2e";
const FLAG_EXTRA_TIER = "extraAdjustmentTier";

Hooks.once("setup", () => {
  const NPCPF2e = CONFIG.PF2E?.Actor?.documentClasses?.npc;
  const MeleePF2e = CONFIG.PF2E?.Item?.documentClasses?.melee;
  if (!NPCPF2e || !MeleePF2e) {
    console.warn(`${MODULE_ID} | Classes de NPC/Ataque do PF2e não encontradas; Elite/Fraco+ desativado.`);
    return;
  }

  patchNPCAdjustments(NPCPF2e);
  patchMeleeDamageDice(MeleePF2e);
});

Hooks.on("renderNPCSheetPF2e", (sheet, html) => {
  const actor = sheet.actor;
  if (!actor || !(actor.isElite || actor.isWeak)) return;

  const $adjustments = html.find(".adjustments");
  if (!$adjustments.length) return;

  const extraTier = getExtraTier(actor);
  const label = actor.isElite ? "Elite" : "Fraco";

  const $wrapper = $(`
    <div class="mwpf2e-extra-tier">
      <a class="mwpf2e-tier-minus" title="Diminuir nível extra de ${label}">−</a>
      <span class="mwpf2e-tier-value">${label}${extraTier > 0 ? ` +${extraTier}` : ""}</span>
      <a class="mwpf2e-tier-plus" title="Aumentar nível extra de ${label}">+</a>
    </div>
  `);
  $wrapper.find(".mwpf2e-tier-minus").on("click", () => changeExtraTier(actor, -1));
  $wrapper.find(".mwpf2e-tier-plus").on("click", () => changeExtraTier(actor, 1));

  $adjustments.append($wrapper);
});

function getExtraTier(actor) {
  return actor.getFlag(MODULE_ID, FLAG_EXTRA_TIER) ?? 0;
}

async function changeExtraTier(actor, delta) {
  const next = Math.max(0, getExtraTier(actor) + delta);
  await actor.setFlag(MODULE_ID, FLAG_EXTRA_TIER, next);
}

// Mesma tabela de HP por nível que o sistema usa para o Elite/Fraco padrão (getHpAdjustment
// interno do pf2e), reaplicada aqui para escalar cada nível extra.
function getHpPerTier(level, sign) {
  if (sign > 0) {
    if (level >= 20) return 30;
    if (level >= 5) return 20;
    if (level >= 2) return 15;
    return 10;
  }
  if (level >= 21) return -30;
  if (level >= 6) return -20;
  if (level >= 3) return -15;
  return -10;
}

function patchNPCAdjustments(NPCPF2e) {
  const original = NPCPF2e.prototype.prepareDerivedData;
  NPCPF2e.prototype.prepareDerivedData = function (...args) {
    original.call(this, ...args);

    const extraTier = getExtraTier(this);
    if (!extraTier || !(this.isElite || this.isWeak)) return;

    const sign = this.isElite ? 1 : -1;
    const flatAmount = 2 * extraTier * sign;
    const attributes = this.system.attributes;

    // CA, saves, Percepção, perícias e ataques: reaproveita o mesmo mecanismo do sistema
    // (ajuste de modificadores com slug "base", igual ao Elite/Fraco padrão).
    this.synthetics.modifierAdjustments.all.push({
      slug: "base",
      getNewValue: (base) => base + flatAmount,
      test: () => true
    });

    // CD de classe/magia.
    if (attributes.classDC) attributes.classDC.value += flatAmount;
    if (attributes.classOrSpellDC) attributes.classOrSpellDC.value += flatAmount;

    // HP: mesma tabela por nível do Elite/Fraco padrão, escalada pelos níveis extras.
    const hpExtra = getHpPerTier(this.system.details.level.base, sign) * extraTier;
    const hp = attributes.hp;
    hp.max = Math.max(hp.max + hpExtra, 1);
    hp.value = Math.min(hp.value + Math.max(hpExtra, 0), hp.max);
  };
}

function patchMeleeDamageDice(MeleePF2e) {
  const original = MeleePF2e.prototype.prepareBaseData;
  MeleePF2e.prototype.prepareBaseData = function (...args) {
    original.call(this, ...args);

    const actor = this.actor;
    if (!actor?.isOfType("npc") || !actor.isElite) return;

    const extraDice = 1 + getExtraTier(actor); // Elite padrão já soma 1 dado extra; cada nível extra soma mais um
    const firstInstance = Object.values(this.system.damageRolls ?? {})[0];
    if (!firstInstance) return;

    const dieSize = /^\d*d(\d+)/i.exec(firstInstance.damage)?.[1];
    if (!dieSize) return; // ataque sem dados de dano (só valor fixo) — nada a fazer

    try {
      firstInstance.damage = `${firstInstance.damage} + ${extraDice}d${dieSize}`;
    } catch (err) {
      console.warn(`${MODULE_ID} | Não foi possível adicionar dado extra de Elite ao ataque ${this.name}.`, err);
    }
  };
}
