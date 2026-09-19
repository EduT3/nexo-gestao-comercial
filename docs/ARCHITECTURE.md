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
