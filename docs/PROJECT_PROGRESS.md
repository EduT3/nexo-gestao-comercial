# NEXO — Gestão Comercial · progresso verificável

Atualizado em 17/09/2026. Histórico anterior em history/PROJECT_PROGRESS-before-consolidation.md; evidência corrente em STATUS.md.

## Milestone atual

**M5 — Caixa e financeiro · EM DESENVOLVIMENTO · 6/8 (75%)**

Percentual da etapa, não da V1 inteira. Tarefas verificadas: abertura/vendas e separação de meios; fechamento; movimentos manuais; consulta financeira e pagamento de títulos de compra; contas a receber; receitas/despesas manuais. Pendentes: estornos/correções e validação integrada completa do ciclo financeiro.

## Milestones

| Milestone | Estado | Gate restante |
| --- | --- | --- |
| M0 Fundação | EM DESENVOLVIMENTO | Shell Windows e build desktop. |
| M1 Experiência | EM DESENVOLVIMENTO | Revisão completa e roadmap visual. |
| M2 Cadastros | CONCLUÍDO | Quatro cadastros, API/interface e Edge 360/1440 aprovados. |
| M3 Estoque/compras | CONCLUÍDO | Recebimento, saldo, replay e rollback aprovados. |
| M4 PDV/vendas | EM DESENVOLVIMENTO | Venda principal aprovada; cancelamento rastreável do roadmap pendente. |
| M5 Caixa/financeiro | EM DESENVOLVIMENTO | Estornos e ciclo integral. |
| M6 Dashboard/relatórios | NÃO INICIADO | Indicadores e relatórios reais. |
| M7 Estabilização | NÃO INICIADO | PostgreSQL real, restore, concorrência, revisão e instalação Windows. |

## Concluído

- Operação principal com persistência, autorização, auditoria transacional e isolamento por empresa.
- Recebíveis e lançamentos manuais integrados e validados, inclusive rollback/reexecução.
- Últimos checks anteriores à prévia: 74 testes, tipagem/build; 8 Edge aprovados.
- Correção do contrato de título em Compras verificada pelo teste de liquidação.
- Repositório GitHub privado criado; build da prévia visual aprovado.

## Em desenvolvimento

Prévia visual web: snapshot fictício separado, gravações bloqueadas, testes específicos adicionados; verificação e publicação em andamento. Envio do código e vinculação Vercel ainda pendentes.

## Pendentes e bloqueios

Estornos/cancelamentos, ciclo financeiro completo, dashboard/relatórios, histórico comercial, roadmap visual e revisão integral. Sem instalador Windows, PostgreSQL real ou restore homologados. CLI GitHub sem autenticação válida; connector autenticado disponível. Nenhum deploy Vercel criado ainda.

## Decisões

Empresas explícitas na API, autorização no servidor, relações por chaves compostas, dinheiro em centavos e quantidades exatas. Estoque muda exclusivamente junto do movimento. Negócio e auditoria compartilham transação. Prévia somente visual não grava operações; entrega final continua desktop Windows. M4 corrigido para refletir o cancelamento ainda não comprovado.

## Próxima ação

Verificar e publicar a prévia no GitHub/Vercel; depois implementar estornos/cancelamentos rastreáveis.
