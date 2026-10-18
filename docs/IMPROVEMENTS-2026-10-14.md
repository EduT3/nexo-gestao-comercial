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

## Evidências

| Verificação | Resultado |
| --- | --- |
| Vitest | 34 arquivos / 123 testes aprovados; inclui 7 novos testes de consulta, paginação e diagnóstico real |
| Regressões novas Edge | 20 aprovadas: carregamento por área, 125 produtos, busca/páginas/filtro, resposta/erro atrasados, pós-gravação e troca de empresa nos 5 módulos, navegação repetida, histórico sem recalcular saldo e categoria adiada |
| Regressões existentes Edge | 4 aprovadas: rascunho/empresa, Excel e tutorial fictício |
| Tipagem, builds desktop/geral/prévia | Aprovados |
| Pacote final Windows | NEXO-Windows-1792010815728/NEXO.exe; melhorias e navegação aprovadas, offline, janela oculta, base temporária, PATH mínimo e NODE_PATH vazio |
| Utilidades no pacote final | 55 produtos; páginas/busca/filtro; diagnóstico preserva hash de todas as tabelas; Excel ausente no início e funcional no primeiro uso; modelo/prévia/importação/exportação com 8 abas; backup válido; reabertura com 56 produtos e isolamento; operador negado por IPC; nenhum erro do renderer |
| Venda/tutoriais preservados | Remoção de itens e tutorial completos no pacote intermediário 1792010635915, que difere do final apenas pela ordem da mensagem de sucesso de caixa (correção coberta no Edge); venda real fictícia, reabertura, foco, teclado, 900×650, zoom 200%, preferências e isolamento aprovados |
| ZIP final | NEXO-Windows-atualizado-2026-10-14.zip, 172759013 bytes; 1061 arquivos conferidos e hashes do executável/ponte/diagnóstico iguais ao pacote |

Evidência de utilidades finais: artifacts/improvements-1792010918166/result.json. Capturas inspecionadas: artifacts/improvements-1792010661184/estoque.png e dados.png. Venda: artifacts/sales-removal-1792010696693. Tutorial: artifacts/tutorial-1792010785409.

A navegação repetida no renderer produziu exatamente 12 consultas de caixa em 12 visitas, 13 de produtos incluindo a visita inicial de vendas, e apenas 1 de histórico de vendas. A mudança de página do histórico gerou 2 consultas de movimentos e somente 1 de saldo. Estas são medidas de quantidade de trabalho, não um benchmark de tempo de abertura em base empresarial.

## Limites e ocorrências

- A paginação atual limita o trabalho visual; os serviços de catálogo/saldo ainda retornam as listas completas. Catálogos e históricos muito maiores precisarão de paginação também no banco em uma etapa futura.
- A verificação de integridade é executada sob demanda. Em bases grandes, pode demorar e ocupar a fila local; tamanho informado não inclui WAL, backups nem arquivos de preferências. Não substitui backup nem valida a correção econômica de cada operação.
- Nenhum dado real foi utilizado. Outra máquina Windows limpa e uso manual de leitor de tela não foram homologados. Sem promessa de quantidade de anos de uso, melhoria percentual de velocidade ou garantia contra falhas de hardware.
- Houve ajustes no harness: leitura de arquivo antes de enviar cabeçalhos HTTP; abertura explícita de Contas a receber; consulta do cache usando a API de módulos disponível no Electron; captura nativa de janela oculta em lugar de CDP; seleção do administrador na reabertura. Uma tentativa de reabertura de desenvolvimento foi invalidada por compilação concorrente do mesmo diretório de interface; validação final ocorreu com pacote congelado.
- A revisão automática bloqueou a restauração opcional do snapshot gerado da prévia para HEAD por risco de perder alterações locais. Nenhuma restauração foi realizada; a nova prévia fictícia gerada foi preservada. Isso não bloqueou o código, os testes ou o pacote.
- Mudanças prévias de tutorial, Excel, indicador de backup e remoção de itens foram preservadas. Sem commit, push, merge, deploy ou publicação nesta etapa.
