# Pf2e Mestre Weber

Módulo único para Foundry VTT v14 (sistema PF2e) que reúne os três módulos separados construídos anteriormente:

- **Máximo de Pontos Heróicos**: configurável (1 a 10) em Configurações do Mundo → aba **Pf2e Mestre Weber**. Padrão: 5.
- **Compartimentos de Inventário**: pastas virtuais na aba Inventário para organizar itens sem afetar bulk. Dá pra atribuir um item a um compartimento pelo seletor ao lado do item, ou arrastando o item para dentro da pasta já visível na lista. Pra tirar um item de um compartimento, arraste ele para qualquer espaço da lista fora das pastas. Para colocar o primeiro item em um compartimento novo (ainda sem nenhum item naquela seção do inventário), use o seletor uma vez — depois disso a pasta aparece e aceita arrastar.
- **Manobras de Atletismo como Ataques**: na aba Ações, mostra Agarrar/Derrubar/Desarmar/Empurrar/Reposicionar com três botões de rolagem (MAP 0/-5/-10), com um toggle em "Configure Character" para esconder a seção por personagem.
- **Câmera segue o combate**: quando o turno de um combatente começa, o mapa arrasta (pan) automaticamente até o token dele. Configurável em Configurações do Mundo → **Pf2e Mestre Weber** (Desativado / Somente Mestre / Todos). Padrão: Todos. Para jogadores, o pan só acontece se o token for visível para eles (respeita `hidden` e detecção de Invisibilidade do Foundry) — o Mestre sempre vê o pan, já que ele enxerga tudo.
- **Terreno Difícil**: novo botão (ícone de montanha) na aba **Região** dos Controles de Cena. Ative-o e desenhe uma forma com as ferramentas normais de Região (retângulo, elipse ou polígono) — a Região criada já vem com o comportamento "Modificar Custo de Movimento" configurado como Terreno Difícil (dobra o custo de deslocamento a pé). Fica ativo até você clicar de novo para desligar, permitindo desenhar várias áreas seguidas. Só aparece para o Mestre.
- **Elite/Fraco com um nível extra**: quando um NPC está Elite ou Fraco (botões padrão do sistema, na ficha), aparecem setinhas "−"/"+" ao lado para aplicar **um único** nível extra (Elite +1, sem ir além disso — o "+" fica desabilitado depois de usado). O nível extra soma mais ±2 em CA/saves/Percepção/perícias/ataques/CD e mais HP (mesma tabela por nível do Elite/Fraco padrão). Além disso, todo NPC Elite agora também ganha **um dado de dano extra** no primeiro dano de cada ataque (além do +2 fixo que o sistema já dava), e o nível extra de Elite soma mais um dado. Fraco não perde dados, só o -2 fixo padrão.
- **Rastreamento de mãos**: impede que um jogador segure mais itens do que tem mãos livres — por exemplo, empunhar um martelo em duas mãos enquanto também segura um escudo. Usa a mesma contagem de mãos que o sistema PF2e já calcula (`system.hands`), mas o sistema nativo só exibe o valor sem bloquear; este ajuste bloqueia a ação e avisa o jogador quando não há mãos suficientes. Configurável (ativado/desativado) em Configurações do Mundo → **Pf2e Mestre Weber**. Padrão: ativado. Atualizações feitas pelo Mestre nunca são bloqueadas.
- **Ocultar compêndios**: o Foundry não deixa apagar de verdade compêndios do sistema/módulos (ex.: os bestiários do PF2e) — isso é bloqueado pelo próprio `deleteCompendium` do core, que só permite excluir packs criados no mundo, já que os outros ficam dentro da pasta de instalação do sistema e voltariam sozinhos na próxima atualização. Em vez de tentar contornar esse bloqueio (arriscado: pode corromper a pasta do compêndio ou quebrar o carregamento do mundo), este ajuste adiciona um botão "Ocultar" ao lado de "Criar Compêndio" na aba Compêndios — só o Mestre vê o botão. Ele abre uma lista com todos os compêndios (Sistema/Módulos/Mundo) para marcar quais ficam escondidos da aba Compêndios, para todo mundo na mesa. Nada é apagado; desmarcar a qualquer momento traz o compêndio de volta.

O `id` interno do módulo continua `mestre-weber-pf2e` (usado na pasta, nos esmodules e no escopo das flags) — só o nome exibido (`title`) mudou para "Pf2e Mestre Weber". Trocar o `id` também exigiria renomear a pasta e migrar as flags de novo, então não fiz isso a menos que você peça.

## Instalação

1. Copie a pasta `mestre-weber-pf2e` (esta pasta) para dentro de `Data/modules/` da sua instalação/User Data do Foundry — ou crie um link simbólico:
   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\Caminho\Para\FoundryData\Data\modules\mestre-weber-pf2e" -Target "c:\Users\Weber\Desktop\outros\Mestre Weber\Foundry Dev pf2er\modules\mestre-weber-pf2e"
   ```
   (Rode o PowerShell como Administrador.)
2. Se os módulos antigos (`hero-points-max`, `inventory-compartments`, `athletics-attacks`) estiverem instalados/ativos no seu mundo, **desative-os** em Configurações do Mundo → Gerenciar Módulos, e ative **Pf2e Mestre Weber** no lugar. Rodar os dois ao mesmo tempo duplica os hooks (ex.: a seção de Manobras de Atletismo apareceria duas vezes).
3. Reinicie/recarregue o mundo.

## Migração de dados

Compartimentos de inventário e o toggle de "mostrar Manobras de Atletismo" eram salvos como flags nos escopos dos módulos antigos (`flags.inventory-compartments.*`, `flags.athletics-attacks.*`). Este módulo unificado usa um único escopo, `flags.mestre-weber-pf2e.*`.

`scripts/migrate.js` roda uma vez por sessão (hook `ready`, só para o GM) e copia automaticamente qualquer dado antigo encontrado nos atores/itens do mundo para o novo escopo, sem apagar os dados antigos (caso algo dê errado, nada é perdido). Isso é idempotente — rodar de novo não duplica nem sobrescreve dados já migrados.

## Notas técnicas

- Cada funcionalidade continua em sua própria pasta dentro de `scripts/` (`hero-points/`, `inventory-compartments/`, `athletics-attacks/`) e é carregada como um `esmodule` independente listado em `module.json` — o código de cada uma não foi reescrito, só o `MODULE_ID` usado para flags foi unificado para `"mestre-weber-pf2e"`.
- As pastas dos três módulos antigos continuam existindo em `modules/` (não foram apagadas) para o caso de você já ter algo apontando para elas; podem ser removidas/arquivadas manualmente depois que confirmar que a versão unificada está funcionando.
