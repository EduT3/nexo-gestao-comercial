# Melhorias de desempenho, estabilidade e utilidades — 14/10/2026

## Resultado

- Módulos secundários montam na primeira visita. Depois ficam montados para preservar rascunhos, mas suas consultas são suspensas enquanto a área está escondida.
- Produtos do cadastro são consultados quando a lista é aberta. Categorias do formulário carregam sob demanda; a seleção é controlada para preservar edição/rascunho quando as opções chegam depois ou ao voltar de outra tela.
- Vendas, compras, caixa, contas a pagar/receber e lista de produtos usam um controle compartilhado de consultas. Respostas e erros antigos são ignorados; mudança de empresa/desmontagem invalida o contexto. Gravações bloqueiam repetição síncrona e invalidam snapshots anteriores. Gravações da mesma empresa podem concluir ao navegar sem perder o rascunho de outra empresa.
- Produtos e saldos de estoque mostram até 50 linhas por página. Busca por nome/código em produtos e nome em estoque ignora acentos e capitalização; índice de busca é reaproveitado entre renderizações. Todas as páginas continuam acessíveis.
- Estoque ganhou filtro Somente sem estoque. Paginar/filtrar o histórico não recalcula os saldos completos.
- A biblioteca Excel no processo principal só carrega ao usar modelo, importação ou exportação.
- Backup e dados ganhou Verificar dados: integridade SQLite, vínculos entre registros, data da checagem e tamanho lógico da base. A operação é somente leitura, exige ADMIN nas duas empresas e não aceita SQL/caminhos do renderer. Nenhuma migração, limpeza de histórico ou reparação automática foi acrescentada.
- Uma falha na consulta de caixa após gravar continua visível, sem ser substituída pela mensagem de sucesso da gravação.

Fundamentação: a separação de efeitos e descarte de respostas antigas seguem a [documentação do React](https://react.dev/reference/react/useEffect). O diagnóstico executa [integrity_check e foreign_key_check do SQLite](https://www.sqlite.org/pragma.html#pragma_integrity_check), que verificam estrutura e vínculos; não representam conciliação comercial dos saldos.

## Validação

Na entrega de 14/10, passaram 123 testes unitários, 20 regressões novas no Edge e quatro regressões existentes. Os roteiros de pacote verificaram listas, busca, filtro, diagnóstico sem alteração comercial, Excel real, backup, reabertura e permissões.

A navegação repetida produziu 12 consultas de caixa em 12 visitas, 13 de produtos incluindo a visita inicial de vendas e uma de histórico de vendas. A mudança de página do histórico gerou duas consultas de movimentos e uma de saldo. Essas medidas representam quantidade de trabalho, não benchmark de tempo em base empresarial.

Todos os cinco roteiros práticos foram executados no mesmo pacote final da [integração de 15/10](INTEGRATION-2026-10-15.md). Use `scripts/verify-local-improvements.mjs` para Electron e `scripts/verify-local-improvements-browser.mjs` para as regressões de renderer. Resultados e capturas são gerados localmente e não são versionados.

## Limites

- A paginação limita o trabalho visual; catálogo e saldo ainda retornam listas completas. Bases muito maiores podem precisar de paginação também no banco.
- A verificação de integridade sob demanda pode ocupar a fila local em bases grandes. O tamanho informado não inclui WAL, backups ou preferências; não é conciliação econômica dos saldos.
- Foram usados dados sintéticos. Outra máquina Windows limpa e leitor de tela manual não foram homologados.
