# NEXO Balcão — relatório de evolução M2

O M2 reorganiza as rotinas de venda, estoque, caixa e contas e melhora a autorização de operações administrativas. A candidata Windows aprovada que inclui consulta ao canal público por HTTPS é a **1.0.6**, build **NEXO-DA69ABFF1376B072**. Ela antecede o histórico de caixa recolhido e a instrumentação adicional de desempenho. [Execução Windows e 242 testes aprovados](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779) · [ZIP da candidata](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779/artifacts/14116091263).

| Marco | Alteração e evidência |
|---|---|
| M2.1 · Guard | Produtos e entradas de estoque distinguem autorização pendente e processamento. O roteiro instalado verificou cancelamento, preservação de rascunho, teclado, bloqueio de chamadas diretas e recuperação com PIN. A seleção por nome identifica o operador. A proteção administrativa depende do Guard onde configurado. |
| M2.2 · Navegação | A barra superior mostra loja e situação do caixa, com ajuda acessível nas áreas operacionais. O teste em janela de 1000 × 650 verificou abertura, Escape e devolução de foco. |
| M2.3 · Produtos e estoque | Uma área reúne busca, cadastro, entrada e movimentações. O Windows verificou a busca, limpeza dos filtros e a ação de salvar durante a rolagem. |
| M2.4 · Caixa e contas | O caixa mostra situação, saldo esperado e diferença prevista. Pagar e Receber orientam quando a busca não encontra registros. A captura da [execução 43599279108](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599279108) mostrou o painel de histórico aberto antes da ação de abertura. A revisão ef068e0 usa um botão com estado explícito e verifica o estado inicial e a exibição do fechamento na [execução 43599952832](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832). |
| M2.5 · Interface | A navegação por teclado e a largura da página foram verificadas em 1280 × 720, 1366 × 768 e 1920 × 1080 nas áreas Vender, Estoque, Caixa e Contas. O monograma aparece na interface empacotada e no ícone extraído do instalador da [execução 43598010478](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598010478). |
| M2.6 · Atualização | As origens 1.0.4 e 1.0.5 com Guard instalaram a candidata por um canal isolado, preservando registros e configurações. O relatório técnico distingue falhas reais de transporte, falhas simuladas do instalador e limites do teste. |

A [comparação SQLite](benchmarks/catalogo-m2.json) usou o mesmo computador e bases fictícias de 1.000, 10.000 e 50.000 produtos. Com 50.000 produtos, as medianas antes e depois ficaram em 110,8 e 111,1 ms no catálogo, 92,3 e 90,9 ms no estoque, 67,0 e 66,5 ms no histórico de vendas e 55,6 e 55,8 ms no histórico de estoque. Os resultados coincidiram nas duas versões. O roteiro instalado coleta medições adicionais de exportação, processos e contas. Na [execução 43599390736](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599390736), o relatório parcial registrou a comparação abaixo entre a instalação 1.0.4 e a candidata 1.0.6, build NEXO-15966D20515C0A26. As medições antecederam a falha posterior no teste de visibilidade do histórico de caixa.

| Medida no mesmo runner Windows | 1.0.4 | 1.0.6 |
|---|---:|---:|
| Abertura até a interface responder | 702 ms | 1.509 ms |
| Exportação Excel | 208 ms | 80 ms |
| Pagar, mediana de 12 consultas | 1,423 ms | 1,734 ms |
| Receber, mediana de 12 consultas | 1,343 ms | 1,652 ms |
| Memória residente, processos principal e de interface | 299,6 MiB | 251,2 MiB |

Pagar e Receber retornaram zero registros nos dois lados. A abertura e a exportação tiveram uma observação por versão. A abertura da candidata ocorreu logo após instalar. A CPU foi amostrada por um segundo e os processos ficaram abaixo de 1% cada em ambos os casos. Esses dados são diagnósticos e não sustentam uma conclusão sobre regressão, ganho ou requisitos de hardware.

## Próximos passos da homologação

1. Confirmar o pacote que reúne o caixa corrigido e as medições Windows. Verificar as capturas desse pacote e a integridade do ZIP baixado.
2. Confirmar reabertura automática e recuperação por falha após o início do NSIS em ambiente isolado. A verificação publicada usa reabertura controlada. O instalador de teste está sem assinatura digital.
3. Aplicar o [roteiro de primeiro uso](USABILIDADE-M2.md) quando houver participantes. O roteiro preparado ainda não tem resultados de sessões reais.

## Próximas evoluções propostas

| Prioridade | Entrega | Benefício | Complexidade, dependências e riscos |
|---|---|---|---|
| P0 | Qualificação do canal de distribuição e recuperação do instalador | Permite atualizar com recuperação demonstrada | Média. Requer ambiente Windows descartável e canal de candidata. Assinatura depende de certificado. |
| P1 | Melhorias nas rotinas identificadas nas sessões de primeiro uso | Reduz dúvidas e passos do atendimento | Média. Depende de observações registradas e regressões comerciais. |
| P2 | Avaliação de integrações fiscais e de pagamentos | Reduz digitação e conciliação manual | Alta. Depende de requisitos fiscais e provedores. Integrações exigem validação de segurança e contingência offline. |

[Relatório técnico do atualizador](UPDATE-QA-M2.6.md) · [Auditoria Windows](AUDITORIA-WINDOWS.md) · [Histórico das mudanças](../PROJECT_PROGRESS.md)
