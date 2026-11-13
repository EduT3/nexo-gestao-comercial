# Correção do NEXO Windows #6

A execução [#6](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43487203493) aprovou 222 testes e falhou em `npm run package:installer`. O primeiro erro do empacotamento foi `Dependência Windows ausente: string_decoder`, lançado por `scripts/after-pack.cjs` ao percorrer dependências do ExcelJS. O instalador não chegou a ser gerado. O aviso posterior de ausência de arquivos no upload foi consequência da falha.

O commit `d2d3a5d` passou a usar o bundle de ExcelJS já utilizado no pacote portátil e a preservar a árvore de dependências necessária ao atualizador e ao Zod. O teste Windows exercita a exportação XLSX no aplicativo instalado.

O workflow foi atualizado para versões das Actions com Node 24, fixadas por SHA. A permissão do token continua limitada a leitura. A etapa de upload falha quando nenhum arquivo é encontrado. Antes dela, `scripts/verify-windows-artifacts.cjs` exige o instalador da versão do projeto, seu blockmap, `latest.yml`, relatório do pacote e metadados da aplicação empacotada. O script compara versão, nome, tamanho e SHA-512 do manifesto com o instalador.

## Execução de validação

A primeira execução com as Actions atualizadas gerou o instalador, mas falhou no teste de entrada ao atingir o prazo de cinco segundos. A revisão seguinte ampliou o prazo e passou a registrar a tela e o texto em caso de falha. O motivo exato da demora daquela execução não foi determinado.

A execução [43529701176](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43529701176), commit `474227d`, terminou com sucesso em Windows. Foram aprovados 230 testes em 53 arquivos, instalação sobre a versão 1.0.4, fluxos comerciais, Excel, recuperação e Guard. O artefato `nexo-windows` foi publicado pela execução e baixado para inspeção. Contém instalador, blockmap, manifesto, relatório do pacote, resultado do teste e capturas.

O instalador `NEXO-Setup-1.0.5.exe` tem 124.152.431 bytes. Sua versão e o SHA-512 foram conferidos com `latest.yml` e com os metadados do aplicativo empacotado. O SHA-512 em base64 é `gGmhGeDWoVhwex2kcFBrmXD6P0N9VQvW7sxsJ+R7bQO4A5pO2hin9nsUPerkjckXFH5GdQNLRNxmNmsz3x0HFQ==`.

O artefato tem retenção de 14 dias. A execução validada pertence à branch de trabalho e permanece disponível como candidata.
