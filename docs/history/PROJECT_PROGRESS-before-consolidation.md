# NEXO — Gestão Comercial · progresso verificável

Atualizado em 17/09/2026.

## Milestone atual

**M5 — Caixa e financeiro · EM DESENVOLVIMENTO · 6 de 8 tarefas verificadas (75%)**

O percentual conta tarefas com código integrado e evidência executada. Ele não representa liberação da V1.

As oito tarefas de M5 são: abertura/vendas e separação de meios; fechamento; movimentos manuais; consulta financeira e pagamento de títulos de compra; contas a receber; lançamentos manuais; estornos/correções; validação integrada do ciclo financeiro. As seis primeiras possuem implementação e evidência; as demais permanecem pendentes.

## Progresso por milestone

| Milestone | Estado | Evidência atual |
| --- | --- | --- |
| M0 Fundação técnica | EM DESENVOLVIMENTO | API, banco, autenticação, empresas, usuários e isolamento validados; shell/instalador Windows pendentes. |
| M1 Experiência e identidade | EM DESENVOLVIMENTO | Identidade NEXO, navegação agrupada e design system base integrados; revisão completa das telas operacionais pendente. |
| M2 Cadastros comerciais | CONCLUÍDO | Produto, categoria, cliente e fornecedor funcionais na API e interface; fluxos e layout 360/1440 validados no Edge. |
| M3 Estoque e compras | CONCLUÍDO | Movimentos, saldos, estados, compras, recebimento, atualização de custo e conta a pagar opcional integrados e validados. |
| M4 PDV e vendas | CONCLUÍDO | Caixa mínimo, carrinho, pesquisa/código, quatro pagamentos, venda e baixa automática integrados e validados. |
| M5 Caixa e financeiro | EM DESENVOLVIMENTO | Fechamento, entradas e saídas manuais idempotentes validados no backend e Edge; financeiro completo permanece pendente. |
| M6 Dashboard e relatórios | NÃO INICIADO | Dashboard atual é base de navegação; indicadores operacionais ainda não existem. |
| M7 Estabilização | NÃO INICIADO | Depende do fluxo completo e do build desktop. |

## Concluído nesta etapa

- Lançamentos manuais de receitas/despesas integrados à tela Financeiro. 74 testes, tipagem e build aprovados; 8 fluxos Edge aprovados, incluindo despesa Pix, receita/despesa em dinheiro, persistência, isolamento e formulário 360px. Reenvio do mesmo conteúdo após falha conserva a chave de idempotência em memória.

- Contas a receber com cadastro, consulta, totais e recebimento integrados à interface e API. Pix/dinheiro, replay, acesso negado, isolamento e rollback tardio/reexecução validados. 71 testes, tipagem e build aprovados em 17/09/2026; última suíte Edge com 8 fluxos aprovada nessa data.

- Objetivo vigente de 58 seções registrado em `docs/GOAL.md`; histórico anterior preservado.
- Marca oficial NEXO — Gestão Comercial aplicada à interface; Adega JG e Depósito JG permanecem empresas operadas.
- Fundação TypeScript/React/Fastify com migrations verificadas, sessões seguras, RBAC por empresa e auditoria transacional.
- Perfis ADMIN/OPERADOR migrados sem elevar automaticamente vínculos legados suspensos.
- Migration `003_commerce_catalog.sql` com categorias, produtos, clientes e fornecedores por empresa, chaves compostas e inativação lógica.
- Valores monetários do catálogo em centavos inteiros e estoque mínimo em decimal exato; saldo de estoque ainda não é alterado pelo cadastro.
- API de busca, paginação, criação, edição e inativação dos quatro cadastros, com custo omitido quando não há `cost.read`.
- Interface comercial com navegação por grupos, formulários, pesquisa, filtros, feedback, estados vazios, confirmação de inativação e troca de empresa.
- Seed idempotente com catálogo realista: seis produtos para cada empresa, categorias, fornecedores e clientes.
- **66 testes unitários/integrados aprovados**, incluindo isolamento, precisão, permissões, idempotência, movimentos de caixa, liquidação de compras, modelo de contas a receber, fechamento e rollback tardio.
- **8 testes Playwright aprovados no Edge**, cobrindo fundação, duas abas, perfil negado, responsividade 360/1440 nas quatro telas comerciais e cadastros persistentes/isolados.
- Identidade oficial consolidada no título, login, logotipo, rodapé, metadados e nome técnico do pacote `nexo-gestao-comercial`.
- Roadmap reestruturado pelas milestones oficiais M0–M7 e rastreado contra as 58 seções do objetivo.
- `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` e `npm.cmd run test:e2e` aprovados em 15/09/2026.
- Migration `004_inventory_foundation.sql` cria saldo por produto e movimentos imutáveis com chaves compostas por empresa.
- API e tela de Estoque oferecem consulta por situação, histórico, entrada manual, perda e ajuste; saldo negativo é recusado.
- Movimentação, saldo e auditoria confirmam juntos; repetição da mesma chave não duplica efeito e comando divergente gera conflito.
- Fluxo Edge cadastra produto, registra entrada fracionária, confere saldo/histórico e valida a tela de Estoque em 360px.
- Migration `005_purchases.sql` cria compra, itens históricos e conta a pagar vinculada, além da origem comercial dos movimentos.
- Recebimento idempotente confirma compra, itens, estoque, custo, título e auditoria em uma transação; teste com falha tardia comprova rollback integral.
- Tela Compras conduz fornecedor → itens → quantidade/custo → conta a pagar → recebimento; o Edge confirmou total, histórico e saldo resultante em 360px.
- Migration `006_cash_sales.sql` cria caixa, vendas, itens, pagamentos, movimentos de caixa e receita realizada com vínculos compostos por empresa.
- Caixa aberto é obrigatório e pertence ao operador; abertura repetida não duplica e apenas dinheiro compõe o saldo físico esperado.
- PDV oferece busca por nome/código/código de barras, carrinho, cliente opcional, desconto autorizado e dinheiro/Pix/débito/crédito.
- Venda idempotente confirma itens, pagamento, baixa de estoque, caixa, receita e auditoria em uma transação; falha tardia comprova rollback integral.
- Edge validou abertura, venda por Pix com desconto, histórico, saldo financeiro separado e baixa do produto; PDV permanece utilizável em 360px.
- A barra lateral ganhou rolagem própria após o Edge detectar que novos módulos escondiam o botão de saída em viewport menor.
- Migration `007_cash_closing.sql` registra valor contado, diferença, observação e chave idempotente de fechamento.
- Fechamento exige o operador responsável, preserva o turno, audita a diferença e impede novas vendas; replay idêntico não duplica efeitos.
- Tela Caixa agora conduz conferência, contagem e fechamento; Edge validou diferença negativa de R$ 0,25 e retorno ao estado sem turno aberto.
- Migration `008_cash_manual_movements.sql` adiciona idempotência aos movimentos manuais sem alterar o histórico existente.
- Entrada e saída exigem caixa aberto do operador, motivo e dinheiro suficiente; movimento, auditoria e novo saldo esperado confirmam na mesma transação.
- A tela Caixa registra e lista movimentos do turno. O Edge confirmou entrada de R$ 10, saída de R$ 5, saldo esperado de R$ 105 e fechamento contado em R$ 104,75.

## Em desenvolvimento

- Estornos/correções e validação integrada completa do financeiro permanecem pendentes. Publicação GitHub e prévia Vercel autorizadas; aguardando renovação do login GitHub e modalidade da prévia.

- Interface de contas a receber integrada e validada no Edge: cadastro, troca de empresa, recebimento por Pix e viewport 360px. Suíte completa com 8 testes Edge aprovada, além de 69 testes e build. Não aumentar percentual até concluir rollback e acessos críticos do recebimento.

- Consulta e totais de contas a receber integrados à API; total aberto independe da paginação. Recebimento em dinheiro e replay conciliam título, receita e caixa nos testes. 69 testes, tipagem e build aprovados; interface e casos críticos restantes pendentes. M5 permanece em 50%.

- API de recebimento implementada, com receita vinculada e entrada física somente para dinheiro. Teste confirma Pix sem efeito físico, replay, conflitos e bloqueio de dinheiro sem caixa. 68 testes, tipagem e build aprovados. Casos críticos restantes, consulta/totais e tela pendentes; progresso permanece 4/8 (50%).

- API de criação de contas a receber implementada e testada: persistência e auditoria transacionais, replay seguro e recusa de cliente cruzado. 67 testes, tipagem e build aprovados. Recebimento, consulta/totais e tela pendentes; percentual permanece em 50%.

- Modelo de contas a receber implementado na migration `011_finance_receivables.sql`, com invariantes e relações por empresa testadas. Criação/recebimento via API, totais e interface pendentes; M5 permanece em 4/8 (50%).

- Consulta financeira e pagamento dos títulos de compra integrados à tela Financeiro. A última suíte Edge validou pagamento por Pix e preservação do dinheiro físico; testes de serviço cobrem dinheiro, saldo insuficiente, replay e rollback.
- Migration `010_finance_payable_origin.sql` protege a origem da despesa com chave estrangeira composta por empresa; acesso negado ao operador e tentativa de origem cruzada são testados.

- Contas a pagar/receber, receitas/despesas manuais e liquidação rastreável.
- Definição do shell Tauri e do processo de build Windows. Rust/Cargo e a CLI Tauri ainda não estão disponíveis nesta máquina.

## Pendente

- M5: contas a pagar/receber, receitas/despesas e liquidações/estornos rastreáveis.
- M6: dashboard e relatórios conciliados com operações reais.
- M7: revisão integral, PostgreSQL real, backup/restore, instalador e teste de instalação limpa.

## Bugs e bloqueios conhecidos

- Não há falha conhecida nas suítes locais atuais. O overflow móvel encontrado na tela de usuários foi corrigido e incluído no teste de regressão.
- PGlite local não comprova concorrência, privilégios ou restore de PostgreSQL de produção.
- Sem Rust/Cargo/Tauri local, não existe executável ou instalador Windows validado; por isso M0 continua em desenvolvimento.

## Decisões relevantes

- O cadastro de produto guarda estoque mínimo, mas nunca aceita edição direta de saldo. M3 criou o saldo materializado, alterado somente junto a movimentos.
- Saldos são derivados de `inventory_balances` atualizado exclusivamente junto a `inventory_movements`; movimentos são append-only e guardam saldo anterior/posterior.
- Entrada/perda/ajuste exigem chave idempotente por empresa. Compra e venda reutilizarão o mesmo contrato transacional sem expor escrita direta de saldo.
- Categorias e fornecedores só podem ser associados a produtos da mesma empresa; IDs de outra empresa são tratados como inexistentes.
- Cadastros administrativos continuam secundários. Módulos comerciais aparecem primeiro na navegação conforme se tornam funcionais.

## Próxima ação

Publicar o projeto no GitHub e vincular a prévia web à conta Vercel conforme solicitação do usuário. Em seguida, implementar estornos/correções rastreáveis. Apontamentos anteriores registram incrementos históricos; contas a receber e lançamentos manuais já foram validados.
