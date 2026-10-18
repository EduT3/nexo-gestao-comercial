# NEXO — roadmap da versão local Windows

## Etapa 1 — Programa local utilizável · concluída

- [x] Electron + React/TypeScript sem servidor HTTP.
- [x] SQLite em `%LOCALAPPDATA%\NEXO`, fora da instalação e do OneDrive.
- [x] primeiro acesso, senha local, seleção explícita de empresa e persistência após reabrir.
- [x] produtos, categorias, clientes e fornecedores separados por empresa.
- [x] backup consistente, restauração validada e cópia do estado anterior.
- [x] pacote autocontido que abre sem Node.js, banco ou internet.

## Etapa 2 — Operação comercial · concluída

- [x] compra, entrada de estoque e conta a pagar na mesma transação.
- [x] abertura, suprimento, sangria e fechamento de caixa por operador.
- [x] venda com desconto, pagamento, troco, estoque, caixa e financeiro atômicos.
- [x] cancelamento de venda, pagamento/recebimento e estornos compensatórios.
- [x] idempotência, rollback, valores exatos e histórico imutável.
- [x] isolamento entre Adega JG e Depósito JG.
- [x] perfis Administrador e Operador validados na camada local.

## Etapa 3 — Excel, consultas e usabilidade · concluída

- [x] saldo e histórico paginado de estoque.
- [x] contas a pagar e receber e resumo financeiro consolidado.
- [x] resumo diário por data, forma de pagamento e produto.
- [x] modelo Excel e importação de produtos com prévia, erros e duplicidades.
- [x] exportação Excel de produtos, estoque, vendas, contas e financeiro.
- [x] navegação local com atalhos de módulos, empresa e estado offline visíveis.

## Etapa 4 — Entrega · concluída em 18/09/2026

- [x] pacote executável `NEXO-Windows-1789781786817` com instruções atualizadas.
- [x] atualização simulada da versão anterior para a atual preservando a base temporária.
- [x] ciclo comercial completo, backup/restauração, operador, relatórios e Excel verificados no pacote.
- [x] prévia web fictícia, identificada e somente leitura compilada sem servidor de produção.
- [x] README, arquitetura, riscos, status e instruções alinhados à versão local.

## Limites mantidos

Um computador por instalação, sem sincronização em rede/nuvem. Emissão fiscal, integrações bancárias, e-commerce, delivery, CRM, BI avançado e inteligência artificial ficam fora da V1. O pacote não possui instalador tradicional nem assinatura digital; a homologação no computador operacional continua sendo uma etapa de implantação, sem uso de dados reais nos testes automatizados.


## Correções após reavaliação — 18/10/2026

- [x] F1: recuperação independente da abertura da base, com preservação dos arquivos anteriores.
- [x] F2: histórico de vendas identificável, detalhado e paginado acima de cem registros.
- [x] F3: conferência de compras, totais e remoção individual de item.
- [x] F4: condição do caixa no PDV e mensagens legíveis nas áreas corrigidas.
- [x] F5: confirmação visível de produto salvo e de restauração no login.
- [x] F6: Pagar/Receber/Resumo separados, com filtros e datas brasileiras.
- [ ] Manutenção: identificação interna de versão/build, extração adicional de LocalApp e contratos centrais.
- [ ] Crescimento: medir bases grandes e evoluir consultas/paginação SQL dos demais históricos.

Evidências e limites em RECOVERY-HISTORY-2026-10-18.md e PURCHASES-CASH-FINANCE-2026-10-18.md. A nova organização operacional foi entregue no Windows e publicada na demonstração web em 18/10/2026. O pacote portátil v1.0.2 está preparado para download no GitHub Releases.
