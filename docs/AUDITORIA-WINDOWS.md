# Auditoria de desempenho e distribuição

## Método e referência

Referência 1.0.4, commit `b197d54`, e candidata 1.0.5. O benchmark executa os serviços SQLite compilados com Node 24.22.1 e SQLite 3.53.4, em Windows x64 com Ryzen 7 7700X e 32 GB de RAM instalados. Cada tamanho começa de uma base temporária, copiada para as duas versões. Foram usados 1.000, 10.000 e 50.000 produtos, o mesmo número de vendas e dois movimentos de estoque por produto. A carga é sintética e foi inserida em lote. O benchmark mede leitura, sem incluir renderização ou gravação de vendas.

Cada consulta tem duas execuções de aquecimento e doze medições por versão. A ordem é alternada. O hash dos resultados de cada consulta coincidiu entre versões. A base inicial passou nas verificações de integridade e de chaves estrangeiras. O p95 em uma amostra de doze corresponde ao maior tempo registrado.

| Produtos | Consulta | 1.0.4, mediana / p95 em ms | Candidata, mediana / p95 em ms |
|---:|---|---:|---:|
| 1.000 | Catálogo completo | 2.00 / 3.29 | 2.06 / 2.51 |
| 1.000 | Saldos de estoque | 1.33 / 2.22 | 1.29 / 1.89 |
| 1.000 | Histórico de vendas | 1.25 / 1.99 | 1.28 / 1.35 |
| 1.000 | Histórico de estoque | 1.72 / 2.25 | 1.18 / 1.28 |
| 10.000 | Catálogo completo | 21.81 / 31.44 | 24.09 / 28.14 |
| 10.000 | Saldos de estoque | 15.65 / 18.90 | 15.96 / 21.28 |
| 10.000 | Histórico de vendas | 13.79 / 16.40 | 12.66 / 13.93 |
| 10.000 | Histórico de estoque | 19.74 / 31.64 | 11.47 / 12.13 |
| 50.000 | Catálogo completo | 130.89 / 175.86 | 134.04 / 191.74 |
| 50.000 | Saldos de estoque | 97.06 / 117.99 | 94.45 / 113.11 |
| 50.000 | Histórico de vendas | 77.45 / 82.64 | 68.19 / 77.34 |
| 50.000 | Histórico de estoque | 109.44 / 145.82 | 58.78 / 77.73 |

[Resultados brutos](benchmarks/catalogo-1.0.5.json) · [Script de medição](../scripts/benchmark-catalog.mjs).

Com 50 mil produtos, o ganho mais claro foi no histórico de estoque. Paginar antes dos cruzamentos diminuiu a mediana de 109,44 para 58,78 ms. O catálogo completo continua materializando todas as linhas. Seu p95 variou de 175,86 a 191,74 ms, sem uma mudança deliberada no caminho do catálogo. A próxima medição deve incluir renderização, memória e carga simultânea no caixa.

A consulta paginada de contas também foi executada separadamente na máquina de referência com 400, 4.000 e 40.000 títulos fictícios, com nove amostras por cenário e dois aquecimentos. O maior p95 observado em cada volume foi 1,64 ms, 10,06 ms e 70,72 ms. Os cenários conferiram identificadores, totais e valores contra um resultado esperado calculado a partir da base sintética. Essa rodada mede a versão atual, sem inferir aceleração histórica no financeiro.

## Duplicação, arquivos e permissões

A varredura de `src` e `electron` com jscpd, mínimo de oito linhas e 70 tokens, marcou sete blocos. Cinco pertencem aos dados da demonstração. Um bloco de 16 linhas repetia as regras de pagamento, estorno, caixa e auditoria entre contas a pagar e a receber e foi consolidado. A repetição caiu de sete para seis blocos e de 499 para 483 linhas marcadas. O bloco restante pertence ao servidor web de compras e estoque. O inventário Git não encontrou arquivos rastreados com hashes idênticos.

A candidata restringe o empacotamento Windows à árvore de dependências do atualizador e do Zod. O Excel usa o mesmo runtime já distribuído pelo ZIP portátil. O instalador deixa de carregar dependências do servidor web. As fontes distribuídas incluem os subconjuntos latinos da tipografia. Arquivos de migração, recuperação e servidor continuam no projeto.

A seleção do nome registra a identidade declarada. Qualquer pessoa que possa abrir o NEXO pode selecionar o responsável e obter as permissões administrativas desse perfil. A checagem de função no processo principal restringe o operador selecionado, mas qualquer pessoa pode trocar para o perfil de responsável. Isso afeta cadastros de equipe, operações administrativas, exportação, backup, restauração e confirmação de atualização. O histórico identifica o perfil selecionado. Seu valor como prova de autoria é limitado. O uso em computador compartilhado exige tratar a autenticação administrativa como prioridade antes de ampliar a implantação.

A suíte cobre falha de substituição da base, preservação dos arquivos originais e nova tentativa. O instalador 1.0.4 publicado tem 148.655.544 bytes e foi usado como referência de distribuição. O manifesto publicado tem o SHA-512 do instalador. A assinatura Authenticode e o ciclo do atualizador entre duas releases públicas são verificações próprias.

## Validação do instalador

[Execução Windows 43488248174](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43488248174), commit `d0ba483`. A suíte executou 222 testes. O ensaio instalado criou dados na 1.0.4, executou o instalador da candidata sobre o mesmo diretório e conferiu integridade SQLite, chaves estrangeiras, vendas e saldo. Também verificou exportação XLSX, restauração, reabertura e retorno ao executável 1.0.4 preservado. A suíte local de falhas incluiu falha injetada na substituição da base. A instalação foi comandada pelo teste e o retorno foi feito pelo executável preservado. A troca iniciada pelo botão do atualizador e uma falha durante a substituição dos binários ainda precisam de ensaio próprio.

| Indicador | 1.0.4 | Candidata 1.0.5 |
|---|---:|---:|
| Instalador | 148.655.544 bytes | 124.146.323 bytes |
| Arquivos de interface em assets | 1.779.965 bytes | 929.566 bytes |
| Fontes em assets | 70 arquivos / 1.117.624 bytes | 10 arquivos / 277.000 bytes |
| Aberturas observadas no mesmo runner | 797 e 637 ms | 652 e 582 ms |

Os tempos de abertura foram duas observações por versão com uma base pequena em estados distintos. Servem como referência operacional. A comparação controlada de desempenho está na seção do benchmark. O instalador confere com o SHA-512 de seu manifesto. A assinatura digital continua pendente.
