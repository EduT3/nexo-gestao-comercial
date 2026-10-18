# Remoção de itens da venda — 14/10/2026

Cada linha da venda tem o botão **Remover item**, com nome acessível que identifica a posição e o produto. A remoção usa UUID próprio da linha, separado do produto; as linhas restantes mantêm valores e identidade React/DOM. O foco vai para o produto seguinte, ou o anterior ao excluir o último. Excluir o único item cria uma linha vazia de quantidade 1. O campo de status anuncia a remoção. Controles permanecem desabilitados durante o salvamento.

Totais e troco continuam derivados dos itens em centavos inteiros, com o arredondamento por item existente. Desconto e recebido são preservados: se o novo subtotal não comportar o desconto, a mensagem continua explícita e a conclusão é recusada. O UUID visual não é enviado pelo IPC. Nenhuma alteração em banco, migrações, contratos, validação de produtos repetidos ou permissões.

Arquivos desta entrega:

- `src/client/LocalSales.tsx`: remoção individual, identidade estável, foco e payload explícito.
- `src/client/local.css`: quatro linhas adicionais para alinhar o controle e permitir uso em zoom alto; conteúdo anterior preservado, com normalização dos fins de linha para CRLF.
- `scripts/verify-local-sales-removal.mjs`: regressão em Electron real e pacote, com SQLite temporário e capturas.
- `docs/STATUS.md`, `docs/PROJECT_PROGRESS.md` e este relatório: evidências e limites.

Validações concluídas:

- `npm.cmd run build:local`: tipagem e build desktop aprovados.
- Testes específicos de vendas, cálculo, cancelamentos e preferências: 4 arquivos / 5 testes aprovados.
- `npm.cmd test`: 32 arquivos / 116 testes aprovados em 44,01 s.
- `git -c core.whitespace=cr-at-eol diff --check`: aprovado.
- `node scripts/verify-local-sales-removal.mjs`: dez grupos de verificações aprovados em desenvolvimento e no executável empacotado, sem erros de página.
- `scripts/verify-local-navigation.mjs` e `scripts/verify-local-backup-indicator.mjs`: aprovados no pacote atualizado, em execuções sequenciais com bases fictícias próprias.
- Revisão React: inicializador lazy, UUID estável, estado imutável, totais derivados, refs apenas para foco após commit, botão nativo e rótulos acessíveis. Sem dependência nova ou mudança arquitetural.
- Capturas reais inspecionadas em 1200×800, 900×650 e zoom 200%; controle acessível e sem transbordamento horizontal no cenário medido.

Roteiro comercial fictício: A custa R$ 10,01 (quantidade 1,250), B R$ 20,00 (2), C R$ 30,01 (0,500). Subtotal R$ 67,52, desconto R$ 7,52, total R$ 60,00, recebido R$ 100,00 e troco R$ 40,00. Ao remover B, A/C preservam quantidades, subtotal R$ 27,52, total R$ 20,00 e troco R$ 80,00. O banco permanece idêntico enquanto apenas o rascunho é editado. Uma venda exclusivamente fictícia foi concluída depois: SQLite contém somente A/C; o estoque de B permanece intacto. Reabrir mantém essa venda e a preferência do tutorial.

Também foram testados primeiro/último/único item, adicionar após remover, uma ocorrência entre duas linhas do mesmo produto, desconto acima do subtotal, recebido insuficiente, PIX, cliente/observações e navegação. Produtos repetidos continuam recusados na conclusão pela regra já existente; remover uma ocorrência não exclui a outra.

O rascunho permanece ao navegar entre telas da mesma empresa. Ao trocar de empresa ele é descartado, mantendo o isolamento anterior. O rascunho não é salvo em disco e desaparece ao fechar/reabrir, comportamento preexistente confirmado no teste; esta tarefa não introduz persistência de rascunhos.

A remoção foi novamente validada no pacote final da [integração de 15/10](INTEGRATION-2026-10-15.md), junto ao tutorial e às melhorias de consultas. O roteiro `scripts/verify-local-sales-removal.mjs` usa dados temporários e gera resultados/capturas locais, não versionados.

Limites: sem homologação em outra máquina Windows limpa ou leitor de tela manual. O rascunho continua sem persistência em disco.
