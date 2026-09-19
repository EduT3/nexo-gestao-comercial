# NEXO — Gestão Comercial · estado de implementação

Atualizado em 17/09/2026. Registros anteriores preservados em history/STATUS-before-consolidation.md.

## Objetivo e estado atual

MVP V1 de GOAL.md para Adega JG e Depósito JG, com dados isolados. Entrega final desktop Windows; prévia web visual adicional autorizada.

M5: 6/8 tarefas verificadas (75%). Cadastros, estoque, compras, venda principal, abertura/movimentação/fechamento de caixa, pagamento de títulos de compras, recebíveis e lançamentos financeiros manuais integrados à API e interface.

Estornos/correções e ciclo financeiro integral permanecem pendentes. O fluxo principal de M4 passou, mas cancelamento rastreável de venda previsto no roadmap não foi comprovado; M4 volta a EM DESENVOLVIMENTO até esse requisito passar. M0 depende do shell Windows e M1 da revisão integral de experiência. M6/M7 pendentes.

## Evidência

- Incremento de estornos: migration 013 e API `POST /api/companies/:companyId/finance/entries/:entryId/reverse` para lançamentos MANUAL implementadas. Original preservado; reversão imutável, chave composta e idempotência; totais líquidos excluem reversões. Pix sem caixa, despesa em dinheiro devolvida ao caixa, rollback tardio e reexecução, replay/conflito, acesso negado e origem cruzada validados. `npm.cmd run check`: 78 testes, tipagem e build aprovados. Interface, receita em dinheiro com saldo insuficiente, caixa de outro operador/fechado e reversão comercial de títulos/vendas ainda pendentes. M5 continua 6/8 (75%). Incremento local ainda não enviado ao GitHub.

- Checks após integrar a prévia: 76 testes, tipagem e build aprovados. Testes da prévia comprovam contexto fictício, isolamento, cópia de dados e recusa de gravações.
- Último Edge: 8 testes aprovados com banco temporário isolado; inclui cadastros 360/1440px, compras, estoque, PDV, títulos, recebíveis, lançamentos manuais 360px e fechamento.
- Contrato da conta a pagar em Compras corrigido e testado: categoria, meio, responsável e observação de liquidação retornados conforme modelo compartilhado.
- Prévia visual em revalidação: build específico aprovado; testes de isolamento e bloqueio de gravações adicionados.

## Prévia web e publicação

- Usuário definiu prévia apenas visual e renovou login GitHub.
- Repositório privado publicado: https://github.com/EduT3/nexo-gestao-comercial. Commit inicial integrado: 7d376ebfd576b78daa339624c7d048182bc1b2af.
- Vercel vinculada ao GitHub no workspace edut3's projects; projeto prj_DKzC1AT65laeGGilIstViQTlIoVC. Deploy dpl_7wQKu7RdZaHxNWBc9qzuZKFNiLaB confirmado READY para o commit acima.
- URL: https://nexo-gestao-comercial.vercel.app. Interface renderizada e troca entre os catálogos Adega/Depósito verificadas no navegador. Correção adicional inclui consulta de movimentos de caixa no snapshot.
- build:preview gera snapshot fictício em banco em memória descartável e reutiliza as mesmas telas. Sem .env, DATABASE_URL, dados empresariais ou sessão real. Mutações comerciais recusadas; sem simular sucesso.
- vercel.json configura npm run build:preview e dist/client. Build normal permanece conectado à API real.
- Git local e workflow Node 24 preparados. CLI GitHub sem token válido; connector autenticado disponível para envio.

## Limites e próximos gates

PostgreSQL real, concorrência, privilégios e backup/restore ainda não homologados. Não há executável/instalador Windows validado. PGlite não substitui essas evidências. Dashboard, relatórios, histórico comercial de clientes/fornecedores, roadmap visual e revisão final de requisitos ainda precisam de implementação/verificação.

Prévia GitHub/Vercel confirmada publicada, inclusive segundo deploy automático READY (commit 6c1c40b02455ed2873dab2099880abbc67b90fd4), consulta de Caixa renderizada. Próximo gate: completar validação e interface do estorno manual, implementar reversões comerciais de títulos/vendas e homologar o ciclo nas duas empresas.

## Validação incremental — 17/09/2026

Interface do estorno manual integrada: motivo obrigatório, confirmação explícita, original preservado e histórico com identificação do estorno. npm.cmd run check aprovado (78 testes, tipagem e build); Edge aprovado (8 testes), incluindo recusa da confirmação, execução e persistência após recarregar. Teste adicional protege pagamentos vinculados a compras contra o fluxo manual. Permanecem pendentes casos de receita em dinheiro sem saldo, caixa fechado/de outro operador e reversões comerciais de títulos/vendas. M5 permanece 6/8 (75%); incremento local ainda não publicado.

### Estorno manual em dinheiro — 17/09/2026

18 testes financeiros aprovados. Novos casos comprovam: receita sem saldo rejeitada sem evento parcial; reforço permite retry da mesma chave e devolução uma vez; caixa fechado e de outro responsável recusados; novo turno do responsável recebe correção, preservando valor do fechamento anterior. Interface previamente validada no Edge. Reversões de títulos e cancelamento de vendas seguem pendentes; M5 permanece 75%. Próximo passo: modelar eventos de liquidação/reversão de títulos sem sobrescrever a identidade da operação anterior.


Check completo deste incremento: npm.cmd run check aprovado, 81 testes, tipagem e build. Nenhuma alteração de código após esse check.

### Fundação das reversões de títulos — 17/09/2026

Migration 014 cria title_settlements imutável, com chaves compostas por empresa, identidade da entrada financeira e chave/hash de liquidação. Migra liquidações anteriores e registra novas liquidações na mesma transação do título, caixa e auditoria. Replay de pagar/receber agora consulta esse histórico persistente. npm.cmd run check aprovado: 81 testes, tipagem e build. Reabertura/reliquidação e API/interface de reversão ainda não implementadas; M5 permanece 6/8 (75%). Próxima ação: permitir múltiplas realizações históricas por título com uma realização ativa, estorno transacional e replay independente do estado atual.


### API de reversão de títulos — 17/09/2026

Migration 015 permite histórico de realizações por título e valida a correspondência da liquidação com sua origem financeira. POST /api/companies/:companyId/finance/settlements/:entryId/reverse implementado: motivo, permissão, empresa, idempotência, evento imutável, caixa quando dinheiro, reabertura do título e auditoria na mesma transação. Pagamento Pix → estorno → reabertura → pagamento débito testado, incluindo isolamento, motivo conflitante e replay antigo sem efeitos na nova liquidação. npm.cmd run check: 82 testes, tipagem/build aprovados. Pendentes: testes próprios de recebíveis, dinheiro e rollback para títulos, upgrade com dados anteriores, interface/Edge e cancelamento de vendas. M5 segue 6/8 (75%); alterações locais não publicadas.


### Reversão de recebíveis e interface — 17/09/2026

Histórico financeiro permite estornar liquidações de pagar/receber com motivo, confirmação e aviso de reabertura do título; venda continua exigindo fluxo próprio. Recebimento CASH → estorno → novo PIX validado: saldo físico retorna ao anterior, replay antigo não altera nova realização, dois eventos preservados. npm.cmd run check aprovado: 83 testes, tipagem/build. Pendentes: rollback específico de títulos, upgrade com dados liquidados, cancelamento de vendas e ciclo integral das duas empresas. M5 permanece 6/8 (75%). Incremento ainda local.

Edge deste incremento: 8 testes aprovados, incluindo estorno de liquidação com motivo, título reaberto, novo recebimento e histórico preservado após reload, em viewport 360px.

### Rollback das reversões de títulos — 17/09/2026

Falha de auditoria injetada após reabertura, para pagar e receber em dinheiro: título completo e lançamento original permanecem iguais, saldo e quantidade de movimentos conservados, nenhum estorno parcial. Retry da mesma chave reabre título e aplica devolução/saída uma vez; replay não duplica movimento. npm.cmd run check aprovado: 84 testes, tipagem e build. Sem mudança de interface neste incremento. Pendentes: upgrade a partir de base com títulos liquidados, cancelamento de vendas e ciclo integral. M5 continua 6/8 (75%), alterações locais ainda não publicadas.


### Upgrade de títulos já liquidados — 17/09/2026

Teste isolado restaura estruturas anteriores às migrations 014/015 conservando uma conta paga e outra recebida por Pix. Upgrade e segunda execução preservam títulos e entradas completos; identidades/chaves históricas reconstruídas uma vez; replay e reversão após upgrade aprovados. Evidência em PGlite, não substitui PostgreSQL real. npm.cmd run check: 85 testes aprovados; tipagem e build verificados. Pendentes: cancelamento rastreável de vendas e ciclo completo nas duas empresas. M5 continua 6/8 (75%); alteração local não publicada.


### Modelo de cancelamento de vendas — 17/09/2026

Migration 016 adiciona evento imutável sale_cancellations com motivo, ator, chave/hash, venda e reversão financeira da mesma empresa. Trigger exige reversão pertencente à venda. Estoque usa ADJUSTMENT/IN com origem SALE_CANCELLATION e FK composta; unicidade por cancelamento/produto. npm.cmd run check aprovado: 85 testes, tipagem/build; comprova aplicação da migration e regressão existente, ainda não valida execução de cancelamento. API, interface, testes próprios de isolamento/rollback/saldo e Edge pendentes. M4/M5 continuam em desenvolvimento, M5 75%. Próxima ação: comando transacional de cancelar venda integrando evento, estoque, reversão, caixa e auditoria.


### Comando de cancelamento de venda — 17/09/2026

POST /api/companies/:companyId/sales/:saleId/cancel integrado com sales.cancel, motivo e chave idempotente. Empresa bloqueada na transação; reversão financeira reutiliza função transacional; evento, devolução exata de estoque, status CANCELLED e auditorias compartilham transação. Pix testado com quantidade 1.250, replay, motivo conflitante, caminho cruzado e nova tentativa após cancelamento; itens/pagamentos preservados, sem movimento de dinheiro para Pix. npm.cmd run check aprovado: 86 testes, tipagem/build. Ainda pendentes: dinheiro/saldo/caixa, acesso de operador, falha tardia, interface/Edge e ciclo completo. M4/M5 continuam em desenvolvimento, M5 6/8 (75%). Incremento local não publicado.


### Dinheiro, autorização e rollback no cancelamento — 17/09/2026

Cancelamento CASH testado: saldo insuficiente rejeitado sem evento; falha de auditoria sale.cancelled após retorno do estoque desfaz status, estoque, estorno financeiro, evento e saída de caixa. Retry mesma chave devolve estoque/dinheiro uma vez e replay não duplica movimento. Operador com vínculo na empresa recebe 403 e venda permanece CONFIRMED. Check completo aprovado com 87 testes, tipagem/build; após adicionar caso de operador, suíte sales com 11 testes aprovada. Interface/Edge, caixa fechado/de outro responsável, integridade própria dos vínculos e ciclo completo ainda pendentes. M4/M5 seguem em desenvolvimento; M5 75%, alterações locais não publicadas.


### Interface de cancelamento — 17/09/2026

SaleHistory integrado ao PDV: motivo obrigatório, confirmação explícita, chave reutilizada em retry, atualização de estoque/caixa/histórico, ação apenas sales.cancel e status Cancelada preservando valores/itens originais. npm.cmd run check aprovado: 88 testes, tipagem/build. Edge: 8 testes aprovados, cancelamento Pix após fechamento, recusa da confirmação, formulário em 360px e persistência Cancelada após reload. Ainda pendentes: motivo/ator do cancelamento no contrato visual, testes de caixa fechado/de outro responsável para dinheiro, vínculos de cancelamento e ciclo integral nas duas empresas. M4/M5 continuam em desenvolvimento; M5 6/8 (75%). Alterações locais não publicadas.


### Rastreabilidade visual do cancelamento — 17/09/2026

Contrato Sale recebe cancellation (motivo, nome do ator e horário ISO). API hidrata por empresa/venda; histórico exibe esses dados junto à situação Cancelada sem perder valores originais. Check: 88 testes, tipagem/build aprovados; suíte sales 11 testes com contrato motivo/ator/horário aprovado; Edge 8 testes com motivo persistente após reload. Pendentes: caixa fechado/de outro responsável em cancelamento CASH, vínculos de integridade próprios e ciclo integral nas duas empresas. M4/M5 continuam em desenvolvimento; M5 6/8 (75%). Alterações locais não publicadas.


### Cancelamento em novo turno e integridade — 17/09/2026

Caixa fechado e caixa de outro ADMIN recusam cancelamento CASH sem evento parcial. Novo turno do responsável com saldo permite devolução uma vez, preservando registro completo do fechamento anterior. Imutabilidade do cancelamento UPDATE/DELETE e rejeição de reversão pertencente a outra venda (23514) testadas. Check aprovado: 89 testes, tipagem/build; após reforçar invariantes, sales 12 testes aprovados. Próxima ação: conciliar o ciclo completo nas duas empresas, revisar gates M4/M5 e publicar incremento autorizado. M5 permanece 6/8 (75%); execução desktop/PostgreSQL real não homologados.


### Conciliação integrada pela API — 17/09/2026

commercial-cycle.test executa nas duas empresas compra 5 unidades e pagamento Pix, venda 2 unidades CASH, venda 1 unidade PIX cancelada, receita/despesa manuais CASH, recebível CASH e fechamento sem diferença. Estoque final 3.000, receita líquida venda válida+250, despesa600, caixa1000+venda válida+150; isolamento do histórico/estoque entre empresas conferido. Sem manipulação manual de saldo ou operação empresarial no teste. npm.cmd run check aprovado: 90 testes, tipagem/build. Gate pela interface nas duas empresas ainda pendente; não equivale a ciclo desktop nem PostgreSQL real. M4/M5 seguem em validação funcional sem declarar concluídos; M5 permanece 6/8 (75%) até revisão dos critérios. Próxima ação: repetir ciclo pelo Edge no Depósito e revisar gates, consolidar documentos correntes e publicar incremento autorizado.


### Ciclo Edge nas duas empresas — 17/09/2026

9 testes Edge aprovados, incluindo ciclo comercial completo em Adega JG e Depósito JG com cadastros, compras, vendas Pix, estoque, títulos, estornos, lançamentos manuais, caixa e cancelamento após fechamento. Preferência da empresa por aba preservada via sessionStorage (apenas ID, sem sessão/credenciais); servidor segue validando vínculos. E2E configura orçamento 10000 requisições/100 logins por minuto para execução acelerada; padrões 300/10 preservados e produção força padrões. Falhas iniciais 429 registradas e corrigidas no harness; espera antes de reload e helpers multiempresa corrigidos. Check geral aprovado: 90 testes, tipagem/build. M5 sobe a 7/8 (87,5%): tarefa de estornos verificada; gate final conserva revisão de recuperação de resposta perdida no PDV e ciclo crítico. M4 em validação, sem concluir desktop. Próximo passo: chave estável de finalização no cliente PDV e teste de retry após resposta perdida; consolidar documentação e publicar incremento. Alterações locais ainda não publicadas.
