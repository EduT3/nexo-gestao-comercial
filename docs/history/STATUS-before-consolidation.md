# NEXO — Gestão Comercial · estado de implementação

Atualizado em 17/09/2026. Documento de continuidade; afirmações de conclusão dependem das evidências registradas aqui. O resumo operacional detalhado está em `docs/PROJECT_PROGRESS.md`.

## Objetivo vigente

MVP V1 definido no objetivo atualizado de 58 seções, em `docs/GOAL.md`. Marca oficial: **NEXO — Gestão Comercial**. Empresas iniciais: Depósito JG e Adega JG. O objetivo anterior de ERP completo foi substituído pelo escopo comercial da V1. A entrega final prevista é uma aplicação desktop instalável para Windows; o navegador permanece ferramenta de desenvolvimento até o empacotamento Tauri ser homologado.

## Estado confirmado

- Estado atual: M5 6/8 (75%). Lançamentos manuais possuem formulário integrado e evidência Edge para despesa Pix, receita/despesa em dinheiro, persistência, isolamento e 360px; os 8 testes Edge passaram. 74 testes, tipagem e build aprovados. Estornos e validação integrada completa continuam pendentes. Usuário autorizou publicação GitHub e prévia na sua Vercel; nenhuma publicação foi realizada ainda. CLI GitHub com autenticação inválida; renovação de login solicitada. Modalidade da prévia (visual ou operações com PostgreSQL separado) aguardando definição.

- Incremento atual: API de receitas/despesas manuais (`POST /api/companies/:companyId/finance/entries`) e migration `012_finance_manual_entries.sql` implementadas. Registro realizado com origem MANUAL, categoria, observação, auditoria e idempotência por empresa. Dinheiro exige caixa do operador; despesa exige saldo suficiente. Pix não altera caixa físico. Testes comprovam replay/conflito, isolamento, operador negado, conciliação física e rollback tardio com reexecução. `npm.cmd run check` aprovado com 74 testes, tipagem e build. Formulário e teste Edge deste incremento ainda pendentes; M5 permanece 5/8 (63%).

- Estado vigente de M5: 5/8 tarefas verificadas (63%). Contas a receber concluídas no fluxo de criação, consulta/totais e recebimento. 71 testes, tipagem e build aprovados; 8 fluxos Edge aprovados na última execução de 17/09/2026. Rollback tardio do recebimento em dinheiro e reexecução da mesma chave comprovados; operador e caminho de outra empresa recusados sem efeitos. Os relatos incrementais abaixo descrevem o histórico; pendências antigas de contas a receber foram resolvidas neste gate.

- Projeto existente e aproveitável em TypeScript, React/Vite e Fastify.
- Banco relacional PostgreSQL/PGlite, migration inicial, login e sessões, cadastro de empresas/usuários e auditoria implementados.
- Navegação agora prioriza Dashboard, Produtos, Categorias, Clientes e Fornecedores; administração permanece em grupo secundário.
- Limite de login e troca de senha incorreta foram corrigidos sem mascarar os casos negativos.
- TypeScript, build e 66 testes unitários/integrados aprovados em 17/09/2026. Os 8 fluxos Playwright foram aprovados na última execução em 15/09/2026, incluindo pagamento por Pix na tela Financeiro.
- A documentação anterior foi preservada em `docs/history/GOAL-previous-erp.md`; o objetivo vigente está em `docs/GOAL.md`.
- A suíte de browser usa banco temporário isolado, Microsoft Edge e cobre 360px/1440px, incluindo Produtos, Categorias, Clientes e Fornecedores. O overflow móvel identificado foi corrigido.
- M2 está concluído com migration, API, interface, seed realista, isolamento por empresa e revisão responsiva para produtos, categorias, clientes e fornecedores.
- Identidade oficial NEXO · Gestão Comercial foi aplicada ao título, login, marca, rodapé, metadados e pacote; o roadmap agora segue M0–M7.
- M3 inclui migration, API e interface de estoque: saldos derivados, estados normal/baixo/zerado, movimentos manuais imutáveis e histórico auditado.
- Idempotência de movimento, saldo negativo, produto de outra empresa, precisão de três casas, rollback e imutabilidade possuem testes executados.
- M3 está concluído: compra e recebimento registram itens/custos históricos, aumentam estoque, atualizam custo corrente e geram conta a pagar opcional na mesma transação.
- Falha injetada na etapa tardia de auditoria comprovou rollback de compra, itens, saldo, custo e título.
- M4 está concluído: caixa mínimo, PDV, quatro meios, venda, pagamento, baixa de estoque, movimento de caixa e receita foram integrados.
- Dinheiro físico permanece separado de Pix/cartões; operador não vê custo nem aplica desconto sem permissão. Rollback tardio da venda foi comprovado.
- M5 começou pelo fechamento idempotente: valor contado e diferença são preservados, somente o operador fecha e novas vendas são bloqueadas.
- A tela Caixa executa o fechamento real; o Edge confirmou contagem divergente, mensagem da diferença e encerramento do turno.
- Entradas e saídas manuais são idempotentes, auditadas e restritas ao caixa aberto do operador; saída sem saldo é recusada.
- A tela Caixa exibe os movimentos e recalcula o dinheiro esperado; o Edge confirmou entrada, saída e fechamento reconciliado no mesmo turno.

## Em andamento

Tela Financeiro integrada às contas a receber: cadastro com cliente opcional, descrição, categoria, valor, vencimento e observação; lista e confirmação de recebimento por meio. Edge aprovou criação de R$ 25,50, isolamento na troca de empresa, recebimento por Pix e layout 360px. 69 testes, tipagem, build e 8 testes Edge aprovados em 17/09/2026. Ainda faltam rollback tardio e acessos específicos do recebimento; tarefa permanece em validação, M5 50%.

Consulta financeira agora retorna `receivables` e calcula o total aberto sobre todos os títulos da empresa, independentemente do limite da lista. Recebimento de R$ 9 em dinheiro foi validado: reduz o total aberto, realiza receita e aumenta o caixa exatamente uma vez. 69 testes, tipagem e build aprovados. Faltam rollback tardio e acessos específicos do recebimento, além de formulário/lista na interface e validação Edge; M5 continua em 50%.

Recebimento conectado a `POST /api/companies/:companyId/finance/receivables/:receivableId/receive`: receita, título, auditoria e entrada física para dinheiro compartilham a transação. 68 testes, tipagem e build aprovados. Pix, replay, comando divergente, título já recebido e dinheiro sem caixa foram testados. Ainda falta validar recebimento em dinheiro, rollback tardio, acessos negados específicos, consulta/totais e tela; o fluxo permanece incompleto.

Criação de contas a receber conectada a `POST /api/companies/:companyId/finance/receivables`, com `finance.manage`, cliente ativo da mesma empresa, idempotência e auditoria na transação. Replay, comando divergente e cliente cruzado foram validados. A suíte atual tem 67 testes aprovados, tipagem e build aprovados. Recebimento, consulta/totais e tela ainda estão pendentes; não considerar o fluxo concluído.

Contas a receber: migration `011_finance_receivables.sql` implementa título, cliente opcional, valor, categoria, vencimento e metadados de criação/recebimento. Chaves compostas protegem cliente e origem da receita. Testes de banco comprovam recusa de cliente cruzado, valor zero e estado recebido sem dados de liquidação. API, totais e interface ainda não estão conectados; a tarefa não conta como concluída.

Contas a pagar de compras possuem consulta e liquidação idempotente, com despesa, auditoria e saída física para dinheiro na mesma transação. A origem da despesa é protegida por chave estrangeira composta. Acesso financeiro do operador, IDs de outra empresa, saldo insuficiente e rollback são testados. Contas a receber, lançamentos manuais e estornos ainda não estão implementados.

1. Completar contas a pagar/receber e financeiro básico sem duplicar receitas de venda.
2. Implementar liquidações e estornos rastreáveis, com reflexo em caixa somente quando o meio for dinheiro.
3. Preparar empacotamento Tauri para Windows quando Rust/Cargo estiverem disponíveis.

## Próximos gates

- **Fundação web:** API, persistência, tipos, build e navegador aprovados; o gate M0 completo ainda exige shell desktop validado.
- **Cadastros:** M2 concluído; implementação funcional, isolamento e revisão 360/1440 aprovados no Edge.
- **Estoque/compras:** M3 concluído; movimentos e recebimento reconciliados, sem saldo negativo ou repetição de efeitos.
- **PDV/vendas:** M4 concluído; caixa aberto precede a venda e todos os efeitos confirmam juntos.
- **Caixa/financeiro:** abertura, vendas, movimentos manuais e fechamento estão validados; títulos e liquidações completas são o próximo gate.
- **Gestão:** dashboard e relatórios conciliados com operações reais das duas empresas; revisão funcional e visual de ponta a ponta.

## Limites atuais

M2, M3 e M4 estão concluídos; M5 possui o ciclo do caixa validado, enquanto títulos, liquidações, financeiro e gestão permanecem incompletos. Não há PostgreSQL externo homologado, restore comprovado, instalador Windows ou deploy de produção. PGlite local não substitui essa homologação. Integrações fiscais, bancárias, mesas, comandas e offline avançado permanecem fora desta V1.
