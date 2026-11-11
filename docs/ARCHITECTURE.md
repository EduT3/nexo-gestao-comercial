# Arquitetura do NEXO local

Este documento descreve a arquitetura vigente do [objetivo local](./GOAL.md). Evidências executadas ficam em [STATUS.md](./STATUS.md).

## Forma de entrega

O NEXO é um aplicativo Electron para Windows. A interface React/Vite abre dentro da janela do programa; o processo principal executa as operações comerciais e persiste os dados em SQLite. Não existe servidor HTTP, serviço do Windows nem dependência de internet durante a operação.

```text
React (renderer, sem acesso direto ao sistema)
        | API tipada exposta pelo preload
Electron IPC (canais explícitos e validados)
        | autenticação, autorização e casos de uso
Serviços locais TypeScript
        | transações e consultas parametrizadas
SQLite em %LOCALAPPDATA%\NEXO\nexo.sqlite
```

O renderer usa isolamento de contexto e recebe somente as funções necessárias por `window.nexoLocal`. A interface apresenta a intenção do usuário; permissões, empresa, cálculos e integridade são validados novamente no processo principal.

## Persistência e atualização

- uma base SQLite ativa por instalação, fora da pasta do programa e do OneDrive;
- migrations numeradas e aplicadas automaticamente ao abrir;
- novas versões evoluem a base no lugar, sem apagar registros;
- testes e verificações empacotadas usam `%LOCALAPPDATA%` temporário;
- cada escrita composta usa uma transação: falha em qualquer efeito reverte todos;
- backup usa a cópia consistente do SQLite e restauração valida o arquivo antes da troca;
- antes de restaurar, o estado atual recebe uma cópia de segurança.

O pacote contém Electron, interface compilada, runtime local, SQLite integrado, validações e o runtime necessário para Excel. O usuário não instala Node.js, banco ou Microsoft Excel.

## Modelo comercial

Toda entidade operacional pertence a `company_id`. Adega JG e Depósito JG compartilham o programa, mas não os registros. Consultas, referências, unicidade e mutações validam a empresa ativa.

Dinheiro é armazenado em centavos inteiros. Quantidades usam milésimos inteiros. Totais e arredondamentos não usam ponto flutuante binário. Venda, compra, cancelamento, liquidação e estorno preservam seus valores históricos e geram movimentos compensatórios; registros confirmados não são apagados para corrigir saldo.

Os fluxos críticos são atômicos:

- compra: cabeçalho, itens, entrada de estoque, conta a pagar e auditoria;
- venda: itens, pagamentos, baixa de estoque, caixa, financeiro e auditoria;
- cancelamento: status, devolução de estoque, compensações financeiras/caixa e auditoria;
- liquidação/estorno: título, evento financeiro compensatório e auditoria.

Chaves de idempotência impedem que reenvios dupliquem efeitos.

## Acesso local

A primeira abertura cria a senha do administrador. Senhas usam `scrypt` com salt; a sessão fica apenas em memória e exige novo login ao reabrir. Os perfis são:

| Perfil | Acesso |
| --- | --- |
| Administrador | Cadastros, compras, vendas, estoque, caixa, financeiro, usuários, Excel, backup e restauração. |
| Operador | Consulta de produtos, próprio caixa e venda. |

A autorização ocorre dentro dos serviços locais. Ela organiza e protege a operação cotidiana, mas não pretende proteger os dados de uma pessoa com acesso administrativo ao próprio Windows.

## Excel

O runtime embarcado gera o modelo e os relatórios `.xlsx`. A importação de produtos limita tamanho e linhas, exige cabeçalhos conhecidos, rejeita células complexas, valida cada linha e classifica duplicidades. A confirmação reanalisa o arquivo dentro da transação, evitando gravar uma prévia alterada ou desatualizada.

A exportação lê um retrato transacional da empresa e cria abas de resumo, produtos, estoque, vendas, itens, contas a pagar, contas a receber e movimentos financeiros. Editar a planilha não altera o NEXO.

## Interface e prévia

A navegação mantém a empresa visível e agrupa a rotina em catálogo, estoque, compras, caixa, vendas, financeiro e relatórios. Ações destrutivas exigem confirmação. Estados de erro explicam a correção esperada.

A prévia web usa somente dados fictícios descartáveis, identifica-se como demonstração e bloqueia mutações. Ela não lê o SQLite local, não recebe backup e não substitui o aplicativo.

## Código principal

```text
electron/             janela, preload, IPC e runtime Excel
src/client/           interface React compartilhada
src/local/            banco SQLite, migrations e serviços locais
src/shared/           contratos, validações e regras exatas
scripts/              empacotamento e verificações do executável
tests/                regras, persistência, integração e Excel
docs/                 objetivo, roadmap, riscos e evidências
```

O código antigo de API permanece apenas para sustentar a prévia histórica enquanto a interface web é convergida. Ele não faz parte do executável nem da rotina operacional.


## Consultas financeiras paginadas — 19/10/2026

Pagar e Receber usam os contratos aditivos payablesPage/receivablesPage: página zero-based, de 1 a 50 títulos por chamada, contagem e total em centavos de todo o filtro. Filtros de situação, intervalo de vencimento inclusivo, vencidas em aberto e busca sem acentos são aplicados no SQLite. A ordenação é vencimento/id. Contagem, soma e linhas compartilham uma transação autorizada; isso não mantém um cursor congelado entre chamadas quando há novas gravações.

As baixas ativas são materializadas uma vez por consulta e juntadas aos títulos, evitando a varredura repetida da coleção de pagamentos. Duas funções registradas somente na conexão confiável normalizam a busca e somam centavos com BigInt/resultado decimal, inclusive acima de int64. Sem índices novos, migração ou mudanças nas tabelas. A soma acumulada da interface usa financeTotals, que retorna escalares sem listas comerciais. Métodos antigos de coleção permanecem compatíveis para consumidores existentes; a interface destas duas tarefas não os usa.

useLocalAccountPage isola o ciclo de leitura por empresa/filtro/página, conservando formulários no espaço da empresa. Consultas de áreas escondidas e respostas antigas continuam descartadas. Clientes do formulário de recebível são consultados ao abrir o cadastro. Baixa/estorno continuam nos serviços e transações originais. Método e orçamento da medição: FINANCIAL-PAGINATION-METHOD-2026-10-19.md; resultados: FINANCIAL-PAGINATION-2026-10-19.md.

O ciclo da gravação é separado do contexto de leitura: trocar de data/filtro não descarta a conclusão da baixa na mesma empresa. Empresa/remontagem continuam invalidando callbacks antigos. A lista atual é renovada após a gravação, incluindo a virada do dia.

Quando há busca textual, o conjunto filtrado é materializado uma única vez na mesma instrução SQL para reutilização pela contagem/soma e página. Metadados internos de contagem/posição são removidos antes da resposta; a ponte recebe a mesma página limitada e os totais completos. Sem busca, contagem/soma e página continuam dentro da mesma transação.
