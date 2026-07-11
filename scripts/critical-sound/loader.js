// Ponto de extensão local: "./local.js" não é versionado no repositório (veja .gitignore).
// Em qualquer instalação deste módulo baixada do git, esse arquivo não existe, o import
// abaixo falha silenciosamente e este loader não faz nada.
async function loadLocal() {
  try {
    return await import("./local.js");
  } catch {
    return null;
  }
}

Hooks.once("init", async () => {
  const local = await loadLocal();
  local?.init?.();
});

Hooks.once("ready", async () => {
  const local = await loadLocal();
  local?.ready?.();
});
