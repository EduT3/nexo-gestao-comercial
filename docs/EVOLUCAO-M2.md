# NEXO Balcão — relatório de evolução M2

O M2 reorganiza as rotinas de venda, estoque, caixa e contas e melhora a autorização de operações administrativas. A candidata Windows aprovada é a **1.0.6**, build **NEXO-17AEB4E230DDCD9F**, com a correção do histórico de caixa e as medições do executável. [Execução Windows e 242 testes aprovados](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832) · [ZIP da candidata](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832/artifacts/14115859392).

| Marco | Alteração e evidência |
|---|---|
| M2.1 · Guard | Produtos e entradas de estoque distinguem autorização pendente e processamento. O roteiro instalado verificou cancelamento, preservação de rascunho, teclado, bloqueio de chamadas diretas e recuperação com PIN. A seleção por nome identifica o operador. A proteção administrativa depende do Guard onde configurado. |
| M2.2 · Navegação | A barra superior mostra loja e situação do caixa, com ajuda acessível nas áreas operacionais. O teste em janela de 1000 × 650 verificou abertura, Escape e devolução de foco. |
| M2.3 · Produtos e estoque | Uma área reúne busca, cadastro, entrada e movimentações. O Windows verificou a busca, limpeza dos filtros e a ação de salvar durante a rolagem. |
| M2.4 · Caixa e contas | O caixa mostra situação, saldo esperado e diferença prevista. Pagar e Receber orientam quando a busca não encontra registros. A captura da [execução 43599279108](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599279108) mostrou o painel de histórico aberto antes da ação de abertura. A revisão ef068e0 usa um botão com estado explícito e verifica o estado inicial e a exibição do fechamento na [execução 43599952832](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832). |
| M2.5 · Interface | A navegação por teclado e a largura da página foram verificadas em 1280 × 720, 1366 × 768 e 1920 × 1080 nas áreas Vender, Estoque, Caixa e Contas. O monograma aparece na interface empacotada e no ícone extraído do instalador da [execução 43598010478](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598010478). |
| M2.6 · Atualização | As origens 1.0.4 e 1.0.5 com Guard instalaram a candidata por um canal isolado, preservando registros e configurações. O relatório técnico distingue falhas reais de transporte, falhas simuladas do instalador e limites do teste. |

A [comparação SQLite](benchmarks/catalogo-m2.json) usou o mesmo computador e bases fictícias de 1.000, 10.000 e 50.000 produtos. Com 50.000 produtos, as medianas antes e depois ficaram em 110,8 e 111,1 ms no catálogo, 92,3 e 90,9 ms no estoque, 67,0 e 66,5 ms no histórico de vendas e 55,6 e 55,8 ms no histórico de estoque. Os resultados coincidiram nas duas versões. O roteiro instalado coleta medições adicionais de exportação, processos e contas. A execução aprovada mediu duas origens no mesmo runner Windows, com atualização em perfis fictícios.

| Origem | Medida | Antes | Candidata 1.0.6 |
|---|---|---:|---:|
| 1.0.4 | Primeira abertura | 848 ms | 1496 ms |
| 1.0.4 | Exportação Excel | 225 ms | 79 ms |
| 1.0.4 | Pagar, mediana | 1,614 ms | 1,748 ms |
| 1.0.4 | Receber, mediana | 1,425 ms | 1,544 ms |
| 1.0.4 | Memória residente | 299,8 MiB | 253,5 MiB |
| 1.0.5 | Primeira abertura | 533 ms | 953 ms |
| 1.0.5 | Exportação Excel | 94 ms | 80 ms |
| 1.0.5 | Pagar, mediana | 2,062 ms | 2,189 ms |
| 1.0.5 | Receber, mediana | 1,911 ms | 1,754 ms |
| 1.0.5 | Memória residente | 298,9 MiB | 254,9 MiB |

Pagar e Receber retornaram zero registros, com 12 amostras por operação e versão. A exportação teve uma observação por versão e origem. A primeira abertura da candidata seguiu a instalação. Nas reaberturas posteriores da candidata, os tempos ficaram entre 477 e 501 ms. A CPU foi amostrada por um segundo, com menos de 1% por processo. Esses dados descrevem o ensaio e não sustentam recomendações de hardware.

## Próximos passos da homologação

1. As capturas da candidata aprovada confirmaram o espaçamento dos filtros de estoque em 1280 × 720, 1366 × 768 e 1920 × 1080 e o histórico de caixa recolhido em 1280 × 720. O instalador baixado foi conferido contra o manifesto.
2. Confirmar reabertura automática e recuperação por falha após o início do NSIS em ambiente isolado. A verificação publicada usa reabertura controlada. O instalador de teste está sem assinatura digital.
3. Aplicar o [roteiro de primeiro uso](USABILIDADE-M2.md) quando houver participantes. O roteiro preparado ainda não tem resultados de sessões reais.

## Próximas evoluções propostas

| Prioridade | Entrega | Benefício | Complexidade, dependências e riscos |
|---|---|---|---|
| P0 | Qualificação do canal de distribuição e recuperação do instalador | Permite atualizar com recuperação demonstrada | Média. Requer ambiente Windows descartável e canal de candidata. Assinatura depende de certificado. |
| P1 | Melhorias nas rotinas identificadas nas sessões de primeiro uso | Reduz dúvidas e passos do atendimento | Média. Depende de observações registradas e regressões comerciais. |
| P2 | Avaliação de integrações fiscais e de pagamentos | Reduz digitação e conciliação manual | Alta. Depende de requisitos fiscais e provedores. Integrações exigem validação de segurança e contingência offline. |

[Relatório técnico do atualizador](UPDATE-QA-M2.6.md) · [Auditoria Windows](AUDITORIA-WINDOWS.md) · [Histórico das mudanças](../PROJECT_PROGRESS.md)
