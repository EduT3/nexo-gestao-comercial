# NEXO Balcão — relatório de evolução M2

O M2 reorganiza as rotinas de venda, estoque, caixa e contas e melhora a autorização de operações administrativas. A candidata Windows aprovada é a **1.0.13**, build **NEXO-2BC1CFAE0D6D5B7A**. [Execução Windows e 246 testes aprovados](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333) · [ZIP conferido](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333/artifacts/14195233556).

| Marco | Alteração e evidência |
|---|---|
| M2.1 · Guard | Produtos e entradas de estoque distinguem autorização pendente e processamento. O roteiro instalado verificou cancelamento, preservação de rascunho, teclado, bloqueio de chamadas diretas e recuperação com PIN. A seleção por nome identifica o operador. A proteção administrativa depende do Guard onde configurado. |
| M2.2 · Navegação | A barra superior mostra loja e situação do caixa, com ajuda acessível nas áreas operacionais. O teste em janela de 1000 × 650 verificou abertura, Escape e devolução de foco. |
| M2.3 · Produtos e estoque | Uma área reúne busca, cadastro, entrada e movimentações. O Windows verificou a busca, limpeza dos filtros e a ação de salvar durante a rolagem. |
| M2.4 · Caixa e contas | O caixa mostra situação, saldo esperado e diferença prevista. Pagar e Receber orientam quando a busca não encontra registros. A captura da [execução 43599279108](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599279108) mostrou o painel de histórico aberto antes da ação de abertura. A revisão ef068e0 usa um botão com estado explícito e verifica o estado inicial e a exibição do fechamento na [execução 43599952832](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832). |
| M2.5 · Interface | A navegação por teclado e a largura da página foram verificadas em 1280 × 720, 1366 × 768 e 1920 × 1080 nas áreas Vender, Estoque, Caixa e Contas. O monograma aparece na interface empacotada e no ícone extraído do instalador da [execução 43598010478](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598010478). |
| M2.6 · Atualização | As origens 1.0.4 e 1.0.5 com Guard instalaram a candidata por um canal isolado, preservando registros e configurações. O relatório técnico distingue falhas reais de transporte, falhas simuladas do instalador e limites do teste. |

A [comparação SQLite](benchmarks/catalogo-m2.json) usou o mesmo computador e bases fictícias de 1.000, 10.000 e 50.000 produtos. Com 50.000 produtos, as medianas antes e depois ficaram em 110,8 e 111,1 ms no catálogo, 92,3 e 90,9 ms no estoque, 67,0 e 66,5 ms no histórico de vendas e 55,6 e 55,8 ms no histórico de estoque. Os resultados coincidiram nas duas versões. O roteiro instalado coleta medições adicionais de exportação, processos e contas. A execução 43599952832 mediu duas origens no mesmo runner Windows, com atualização em perfis fictícios.

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
2. A [reabertura automática em modo silencioso](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623101334) foi comprovada na atualização a partir da versão com Guard. A [recuperação após interromper o NSIS](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624707886) também passou, com integridade SQLite e preservação da política do Guard. O ensaio interrompeu o processo do instalador. A reinicialização do computador durante a instalação segue sem evidência. O instalador de teste está sem assinatura digital.
3. Aplicar o [roteiro de primeiro uso](USABILIDADE-M2.md) quando houver participantes. O roteiro preparado ainda não tem resultados de sessões reais.

## Próximas evoluções propostas

| Prioridade | Entrega | Benefício | Complexidade, dependências e riscos |
|---|---|---|---|
| P0 | Qualificação do canal de distribuição e recuperação do instalador | Permite atualizar com recuperação demonstrada | Média. Requer ambiente Windows descartável e canal de candidata. Assinatura depende de certificado. |
| P1 | Melhorias nas rotinas identificadas nas sessões de primeiro uso | Reduz dúvidas e passos do atendimento | Média. Depende de observações registradas e regressões comerciais. |
| P2 | Avaliação de integrações fiscais e de pagamentos | Reduz digitação e conciliação manual | Alta. Depende de requisitos fiscais e provedores. Integrações exigem validação de segurança e contingência offline. |

[Relatório técnico do atualizador](UPDATE-QA-M2.6.md) · [Auditoria Windows](AUDITORIA-WINDOWS.md) · [Histórico das mudanças](../PROJECT_PROGRESS.md)


## Contas com dados fictícios na candidata mais recente

A execução [43652959533](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533) comparou as duas páginas de 60 contas a pagar e 60 a receber, antes e depois da atualização no mesmo runner e perfil. Os registros, totais e a ordem das páginas permaneceram iguais. Tempos abaixo são medianas de 12 consultas da primeira página em cada versão.

| Origem | Consulta | Antes | Candidata 1.0.6 |
| --- | --- | ---: | ---: |
| 1.0.4 | Pagar | 3,649 ms | 4,035 ms |
| 1.0.4 | Receber | 3,462 ms | 3,583 ms |
| 1.0.5 com Guard | Pagar | 3,954 ms | 5,177 ms |
| 1.0.5 com Guard | Receber | 3,767 ms | 4,045 ms |

As quatro consultas ficaram mais lentas, com diferença mediana entre 0,121 e 1,223 ms no runner. Esse ensaio pequeno não estabelece impacto em estações comerciais nem requisitos de hardware. [Amostras brutas](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533/artifacts/14136753150)

## Inicialização pareada da candidata 1.0.7

No mesmo Windows 11 Pro x64 26300.9974, os executáveis extraídos 1.0.6 e 1.0.7 abriram cópias idênticas do SQLite fictício com 1.000 produtos e 11 vendas. Após descartar o primeiro par, oito pares foram medidos alternando a ordem. O cronômetro parou após a abertura da janela e a primeira leitura por IPC.

| Mediana | 1.0.6 | 1.0.7 |
| --- | ---: | ---: |
| Abertura | 407,11 ms | 407,51 ms |
| Memória residente, processos principal e de interface | 214,14 MiB | 215,53 MiB |
| CPU em repouso, soma dos dois processos | 0,029% | 0,040% |

A diferença observada de abertura foi de 0,39 ms e a de memória residente, de 1,39 MiB. O ensaio usou janelas ocultas, perfis novos e cache do sistema sem limpeza forçada. Ele não reproduz o primeiro lançamento imediatamente após instalação, nem comprova desempenho em outro hardware. [Método e amostras](benchmarks/windows11-startup-1.0.6-1.0.7.json)


### M2 — tutorial interativo aprovado na candidata Windows 1.0.8

A [execução 43731330072](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43731330072) aprovou 246 testes automatizados, empacotamento e os dois perfis Windows Server 2025. No aplicativo instalado, o roteiro completou as seis tarefas da prática de balcão em ambos os perfis e verificou a igualdade dos registros comerciais antes e depois. A captura mostra o fechamento simulado de R$ 30,00, sem diferença. O ensaio não representa uma sessão com participantes.

O [ZIP 1.0.8](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43731330072/artifacts/14168893349) foi baixado e conferido. Os relatórios do build `NEXO-6B0A9FA4933420C2` passaram sem erros de interface. O NSIS tem 124.155.663 bytes e corresponde à versão, ao tamanho e ao SHA-512 de `latest.yml`. O blockmap está presente. SHA-256 do instalador: `896A66CCBEEE5D29056D18246B4872D62C25C3B4476DD83430E6A444337B9F41`. A candidata é para testes, com artefato disponível até 29/11/2026, 12h56 no horário de Brasília. A versão pública permanece 1.0.4.


### M2 — retomada do tutorial na candidata Windows 1.0.9

A [execução 43743070192](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43743070192) aprovou 246 testes em Windows Server 2025. Nos dois perfis fictícios, o roteiro fechou a ajuda durante o recebimento, navegou para Vender e reabriu a prática com a etapa e o vencimento preservados. As seis tarefas foram concluídas e os registros comerciais permaneceram iguais.

O [ZIP 1.0.9](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43743070192/artifacts/14173905565) foi baixado. O instalador de 124.155.777 bytes e seu SHA-512 correspondem ao manifesto. O blockmap está presente, e os dois relatórios do build `NEXO-2EE2C72849C11E4A` passaram sem erros de interface. SHA-256: `96BFD60D5A32B176E98D44AF8B926E77F3007A09935F48909A84D1A40F64445E`. Artefato disponível até 29/11/2026, 15h02 no horário de Brasília. A versão pública permanece 1.0.4.


## Evidências de aceite e limites

| Critério | Evidência | Limite |
| --- | --- | --- |
| M2.1 · Autorização, cancelamento e persistência | O roteiro instalado conferiu isolamento por operador e empresa, pedido de PIN e recuperação. Na 1.0.11 extraída, PIN incorreto preservou rascunho e dados. Falha de IPC antes da gravação exibiu mensagem de tentativa. Perda de resposta após gravar permitiu repetir sem duplicação. | Os ensaios de falha de IPC cobrem o formulário de venda na mesma sessão. |
| M2.2 · Navegação, ajuda e rascunho | A 1.0.11 passou em 20 combinações de tamanho e módulo no Windows 11, com loja, operador e modo local visíveis. O roteiro instalado conferiu foco ao sair da ajuda e preservação da venda ao alternar o caixa. | A prática mantém o rascunho durante a sessão do operador e da empresa. |
| M2.3 · Produtos, compras e estoque | Cadastro, entrada e movimentações no roteiro instalado. Edição no executável 1.0.7 extraído conservou preço e nome de venda anterior e saldo. | Testes com base fictícia. A edição dirigida em Windows cliente usou o executável extraído. |
| M2.4 · Caixa, financeiro e estornos | Roteiro instalado conferiu fechamento, histórico, venda e cancelamento. Em Windows 11, a baixa de duas contas e os estornos foram verificados em perfil fictício com valores exatos. | Confirmações nativas dos estornos foram respondidas pela automação. |
| M2.5 · Layout e acessibilidade | A 1.0.11 passou na navegação entre cinco módulos em quatro tamanhos de conteúdo. Na 1.0.13, o ícone oficial foi conferido no recurso para a janela e nos dois binários. O teste dirigido também confirmou a contagem acessível do PIN e o retorno do foco na venda. Ajuda e prática têm evidências de contraste, foco e árvore de acessibilidade em candidatas anteriores. | A cobertura de contraste é amostral. A barra de tarefas, o DPI nativo e a sessão com leitor de tela seguem sem ensaio controlado. |
| M2.6 · Instalação e atualização | A 1.0.13 passou em dois perfis instalados no Windows Server 2025, com rejeição de hash divergente, atualização a partir de 1.0.4 e 1.0.5, backup, preservação e recuperação após interrupção. O ZIP local foi conferido contra o digest do GitHub. | A atualização usou canal isolado. A instalação e atualização controladas em Windows cliente seguem pendentes. Windows 10 aguarda ambiente e não impede o desenvolvimento. |
| M2.6 · Desempenho | Comparação SQLite com 1.000, 10.000 e 50.000 produtos. Na 1.0.11 há resultados próprios de abertura, memória, CPU em repouso, busca e históricos no Windows 11 e de contas e Excel no Windows Server. | Os ensaios têm perfis distintos. A exportação 1.0.11 no runner teve uma observação por versão e por perfil. Hardware mínimo ainda sem homologação. |
| M2.6 · Primeiro uso | Roteiro preparado para observar tempo, cliques, erros e ajuda nas seis rotinas solicitadas. A 1.0.11 instalada retomou a prática após navegação e completou as seis tarefas fictícias com os registros comerciais intactos. | Sem sessão registrada com participantes. |

[Ações e artefatos da 1.0.9](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43743070192) · [Status e histórico](STATUS.md) · [Compatibilidade](WINDOWS-COMPATIBILITY.md) · [Usabilidade](USABILIDADE-M2.md)

### Acessibilidade do tutorial no Windows 11

No executável extraído 1.0.9, build NEXO-2EE2C72849C11E4A, o Electron expôs a navegação principal, a região Tutorial do NEXO, o estado expandido do botão de ajuda e o formulário de prática com nome próprio na árvore de acessibilidade do Chromium. O campo Nome do produto e o botão Cadastrar produto fictício também tinham nomes acessíveis. Enter abriu a ajuda e a prática. Escape devolveu o foco ao botão de ajuda e retirou a região e o formulário ocultos da árvore. O teste usou perfil fictício no Windows 11 e não substitui uma sessão com leitor de tela.


### M2 — candidata Windows 1.0.10

A [execução 43745162436](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436) passou com 246 testes e duas verificações de aplicativo instalado no Windows Server. A candidata inclui as mensagens de autorização, processamento e cancelamento de caixa e contas, exercitadas em testes direcionados na compilação local. Os dois perfis instalados passaram no roteiro de atualização, operações comerciais e retomada da prática. O teste dirigido no executável extraído está registrado abaixo.

O [ZIP 1.0.10](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436/artifacts/14174511359) foi baixado e conferido. O build `NEXO-576BB6253FF853C7` inclui o instalador de 124.155.887 bytes, o blockmap e o manifesto com SHA-512 correspondente. SHA-256 do instalador: `4CD4A2445912F8740AC1857F6EB0BBB7F0051D0A592727030A4F2E048877087C`. Artefato disponível até 29/11/2026, 15h21 no horário de Brasília. A release pública permanece 1.0.4.


### Verificação dirigida da 1.0.10 no Windows 11 cliente

A carga x64 extraída do instalador conferido da 1.0.10, build `NEXO-576BB6253FF853C7`, passou nos testes de feedback de suprimento, pagamento e recebimento no Windows 11 Pro x64 26300.9974, em três perfis temporários. A interface informou a espera pelo PIN. O cancelamento preservou os campos e o caixa. As novas tentativas autorizadas registraram os valores previstos.

Os dois cancelamentos de estorno exibiram a mensagem correspondente, preservaram os motivos, mantiveram as contas baixadas e conservaram o caixa em R$ 11,50. Os diálogos nativos foram respondidos por automação. O ensaio usou o executável extraído, sem executar o NSIS nem acessar a instalação pessoal. [Artefato de origem](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436/artifacts/14174511359)

### Contraste dos controles da ajuda

No Windows 11, o executável extraído da candidata 1.0.10 exibiu relações de contraste de 7,75:1 em Modo local, 5,23:1 em Caixa fechado, 12,73:1 em Ajuda e tutorial, 16,84:1 no título da ajuda e na abertura da prática, 6,64:1 na nota da ajuda e 4,92:1 nos botões principais de início e cadastro fictício. Os cálculos usaram cores efetivas da interface, fundos sólidos e luminância relativa. Os oito alvos medidos superaram 4,5:1 no estado normal. A medição não abrange todos os módulos, estados de interação ou tecnologia assistiva. [Critério de contraste WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)


### M2 — venda e prévia Excel na candidata Windows 1.0.11

A [execução 43747340730](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730) aprovou 246 testes e dois perfis no Windows Server 2025. Em ambos, cancelar a confirmação protegida do Excel manteve a prévia e o catálogo sem o produto fictício. Autorizar a nova tentativa importou um produto, preservado ao reabrir. A mensagem da venda com desconto foi verificada em perfil temporário na compilação local.

O [ZIP 1.0.11](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730/artifacts/14175212566) foi baixado. O build `NEXO-B4FBEDEBFCC6D0E8` inclui o instalador de 124.155.850 bytes, o blockmap e o manifesto com versão e SHA-512 correspondentes. SHA-256 do instalador: `8A4CC5AD3C8FDFBB7B8AB7048BC7E91C3779BB92DC68D8C59A119F1186EF6962`. Artefato disponível até 29/11/2026, 15h47 no horário de Brasília. A versão pública permanece 1.0.4.

### Teste dirigido da venda com desconto no pacote 1.0.11

No Windows 11, a carga x64 extraída do instalador 1.0.11 conferido, build NEXO-B4FBEDEBFCC6D0E8, exibiu Aguardando autorização ao concluir a venda com desconto. Cancelar preservou o desconto de R$ 1,00, duas unidades no estoque, caixa de R$ 10,00 e zero vendas. A nova tentativa com PIN válido gravou uma venda de R$ 4,00, baixou uma unidade e deixou o caixa em R$ 14,00. O teste usou perfil fictício, sem executar o NSIS no Windows cliente.

### Atualização para a candidata 1.0.11

Os dois relatórios da execução 43747340730 confirmam a atualização instalada para a 1.0.11 no Windows Server 2025, a partir da 1.0.4 pública e da 1.0.5 de teste com Guard. Em ambos os perfis fictícios, o atualizador rejeitou o instalador com hash divergente, gerou backup antes de fechar e reabriu a candidata com os mesmos usuários, vínculos e registros comerciais. O perfil com Guard manteve a política e o PIN de origem. O perfil de origem pública também repetiu a instalação após interromper o NSIS, preservando registros e política do Guard. O canal da candidata foi isolado. O ensaio HTTPS público baixou e verificou separadamente o instalador 1.0.4. [Relatórios e pacote](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730/artifacts/14175212566)

### Monograma na candidata 1.0.11

No build NEXO-B4FBEDEBFCC6D0E8, o Windows extraiu o mesmo ícone de 32 × 32 do instalador e do NEXO.exe da carga x64. Os PNGs extraídos têm SHA-256 EC8C7BB6FA16E08E106B4EEA772FEDFF6A02C42BA5A8FD5D2DD30975AACBE2EE e a inspeção visual confirmou o monograma. O PNG empacotado que o Electron usa na janela é idêntico ao arquivo oficial do repositório. A conferência cobre os recursos do pacote, sem renderizar o ícone na barra de tarefas do Windows cliente.

### Inicialização pareada da candidata 1.0.11

Os executáveis extraídos 1.0.6 e 1.0.11 abriram cópias do mesmo banco fictício de 1.000 produtos e 11 vendas no mesmo Windows 11. Após descartar o primeiro par, foram medidos oito pares, com ordem alternada, cache do sistema sem limpeza forçada, janela oculta e perfil novo a cada abertura. O cronômetro parou após a primeira resposta IPC de identificação do build. Os processos principal e de interface foram amostrados um segundo depois.

| Mediana | 1.0.6 | 1.0.11 |
| --- | ---: | ---: |
| Abertura | 387,71 ms | 385,90 ms |
| Memória residente dos dois processos | 212,96 MiB | 212,26 MiB |

A coleta de CPU retornou leituras negativas e ficou inconclusiva. Os valores brutos foram preservados para diagnóstico. As diferenças observadas de abertura e memória são pequenas neste ambiente e não estabelecem requisitos de hardware. [Amostras e identificação dos builds](benchmarks/windows11-startup-1.0.6-1.0.11.json)

#### Nova coleta de CPU em repouso

O ensaio repetiu somente a medição de CPU, com os mesmos executáveis extraídos e o mesmo banco fictício. Foram seis pares em ordem alternada após um par de aquecimento. O Windows forneceu o tempo acumulado de CPU dos processos principal e de interface. Após 1,5 s de estabilização, foram coletados dois pontos separados por cerca de cinco segundos, com confirmação de que os processos eram os mesmos.

A mediana foi de 0% de um processador lógico nas duas versões, dentro da resolução da coleta. O maior valor na 1.0.6 foi 0,30%, e as seis amostras da 1.0.11 ficaram em 0% registrado. O ensaio descreve repouso com janela oculta, sem medir CPU durante operações ou uso interativo. [Amostras de CPU em repouso](benchmarks/windows11-idle-cpu-1.0.6-1.0.11.json)

### Contas e Excel na atualização para a candidata 1.0.11

A execução 43747340730 comparou cada origem com a 1.0.11 após atualização no mesmo runner Windows Server 2025 e no mesmo perfil fictício. O roteiro comparou o conteúdo e a ordem das duas páginas antes e depois. Havia 60 contas a pagar e 60 a receber por perfil. Os tempos de consulta são medianas de 12 leituras da primeira página. A exportação XLSX teve uma observação por versão e perfil.

| Origem | Operação | Antes | Candidata 1.0.11 |
| --- | --- | ---: | ---: |
| 1.0.4 | Pagar | 4,664 ms | 4,843 ms |
| 1.0.4 | Receber | 4,441 ms | 4,475 ms |
| 1.0.4 | Exportar Excel | 218 ms | 94 ms |
| 1.0.5 com Guard | Pagar | 4,991 ms | 5,668 ms |
| 1.0.5 com Guard | Receber | 4,657 ms | 4,964 ms |
| 1.0.5 com Guard | Exportar Excel | 101 ms | 106 ms |

As medianas das consultas aumentaram entre 0,034 e 0,678 ms neste ensaio. Os dois pares de exportação variaram em direções diferentes, com a origem sempre medida primeiro. A amostragem de Excel e o ambiente de CI limitam qualquer inferência sobre ganho de desempenho em uso comercial. [Amostras de contas e Excel](benchmarks/windows-server-finance-excel-1.0.11.json)

### Busca e históricos no Windows 11

Os executáveis extraídos 1.0.6 e 1.0.11 abriram cópias do mesmo banco fictício com 1.000 produtos, 11 vendas e 12 movimentos. Em quatro pares com ordem alternada após aquecimento, cada versão contribuiu com 24 observações por operação. A busca cronometrou o preenchimento do código até o resultado na tela de venda. Os históricos usaram a primeira página via IPC, e cada resposta foi comparada integralmente com a da versão de referência.

| Mediana | 1.0.6 | 1.0.11 |
| --- | ---: | ---: |
| Busca por código na venda | 5,683 ms | 5,322 ms |
| Histórico de estoque | 1,325 ms | 1,351 ms |
| Histórico de vendas | 1,245 ms | 1,271 ms |

As diferenças ficaram abaixo de 0,4 ms nesta base. Os históricos retornaram o mesmo conteúdo e a mesma ordem. O ensaio usou automação em janela oculta e não mede grandes históricos no Windows cliente. [Amostras de busca e históricos](benchmarks/windows11-queries-1.0.6-1.0.11.json)

### Tratamento de falha de comunicação ao concluir venda

No Windows 11, o executável extraído da 1.0.11 (NEXO-B4FBEDEBFCC6D0E8) foi aberto com uma cópia fictícia do banco. O teste retirou em memória apenas o handler IPC de conclusão de venda daquele processo. Ao tentar confirmar uma venda por PIX, a interface exibiu “Não foi possível enviar a solicitação ao NEXO. Tente novamente.” A quantidade e o pagamento permaneceram selecionados, e o botão voltou a ficar disponível. As respostas dos históricos e do caixa permaneceram idênticas antes e depois, com 11 vendas e 12 movimentos. A injeção cobre indisponibilidade antes da gravação. Os arquivos do aplicativo não foram modificados.

### Repetição da venda após perda da resposta

Na mesma candidata 1.0.11 extraída, no Windows 11 e com banco fictício, a automação deixou o handler original concluir uma venda por PIX e simulou um erro de comunicação somente na resposta ao formulário. A primeira tentativa registrou a venda e a baixa de estoque, passando de 11 para 12 vendas e de 12 para 13 movimentos. A interface preservou o rascunho. Repetir a ação no mesmo formulário exibiu a confirmação, limpou o rascunho e preservou os totais e o conteúdo dos históricos após a primeira gravação. O caixa permaneceu com o mesmo saldo, como esperado para PIX. O ensaio cobre a repetição do mesmo rascunho na mesma sessão e não modificou os arquivos do pacote.

### PIN incorreto em venda com desconto

No Windows 11, o executável extraído da 1.0.11 foi aberto com banco fictício e Guard ativado. Ao informar um PIN incorreto durante uma venda por PIX com desconto, o diálogo informou o erro e preservou a quantidade e o desconto. Os históricos de vendas e estoque e o saldo do caixa permaneceram idênticos. Informar o PIN correto na mesma autorização registrou uma única venda e uma única baixa. O saldo de dinheiro permaneceu igual, como esperado para PIX.

### Navegação e cabeçalho na candidata 1.0.11

O executável extraído da 1.0.11, em Windows 11 e com perfil fictício, passou em 20 combinações de módulo e tamanho de conteúdo. Em 1000 × 650, 1280 × 720, 1366 × 768 e 1920 × 1080, Enter selecionou Início, Vender, Estoque, Caixa e Contas, e o módulo ativo expôs aria-current. Loja, nome do operador, Modo local e Ajuda e tutorial permaneceram visíveis. Os controles do cabeçalho ficaram dentro da área visível, sem rolagem horizontal no documento. As dimensões foram aplicadas ao Chromium pelo protocolo de automação. O ensaio não altera a resolução física nem o DPI do Windows.

### Exportação Excel pareada no Windows 11

Os executáveis extraídos 1.0.6 e 1.0.11 exportaram o mesmo banco fictício de 1.000 produtos, 11 vendas e 12 movimentos. Foram quatro pares alternados após aquecimento, com 24 exportações medidas por versão. O tempo inclui a chamada pelo aplicativo e a gravação XLSX, com destino indicado pela automação no diálogo de salvamento. A mediana foi de 60,91 ms na 1.0.6 e 61,08 ms na 1.0.11. Nos oito separadores, o conteúdo das células coincidiu em todas as planilhas após normalizar apenas os horários de emissão. A medição descreve a exportação dessa base e exclui o tempo de interação com o diálogo. [Amostras e resumo das planilhas](benchmarks/windows11-excel-1.0.6-1.0.11.json)

### Candidata Windows 1.0.12 · acessibilidade do Guard

O diálogo do NEXO Guard expõe quantos dígitos foram preenchidos em uma região de anúncio, sem expor os números. A compilação local em perfil fictício confirmou a atualização da contagem na árvore de acessibilidade e o cancelamento por Escape. A devolução do foco ao controle que abriu o diálogo e a sessão com leitor de tela ainda precisam de validação. A [execução Windows 43795531364](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43795531364) aprovou 246 testes e os dois roteiros instalados no Windows Server 2025, incluindo a verificação da contagem e a atualização a partir da 1.0.4 e da 1.0.5 com Guard. O [ZIP da 1.0.12](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43795531364/artifacts/14193569832) foi baixado e conferido. Build NEXO-920D260F754C3F6D. O instalador de 124.156.011 bytes confere com versão, tamanho e SHA-512 do manifesto. O blockmap está presente. SHA-256 do ZIP: `06423556ADD30ABBFE21DFE773C3E49308C18545514B6E7413B9DD78757267C7`. Artefato disponível até 30/11/2026 às 00h13 de Brasília. A versão pública permanece 1.0.4 e a instalação controlada em Windows cliente segue pendente.

### Candidata Windows 1.0.13 · foco ao cancelar o Guard

Na venda com desconto, Enter abre o Guard e Escape cancela a autorização, preserva o desconto e devolve o foco a Concluir venda quando o diálogo deixa o foco no documento. O roteiro confirmou que o histórico não ganhou outra venda. Os 246 testes e os dois roteiros instalados no Windows Server 2025 passaram, incluindo atualização em canal isolado a partir da 1.0.4 e da 1.0.5 com Guard. O ZIP baixado confere com o SHA-256 do GitHub. O instalador de 124.156.041 bytes corresponde ao SHA-512, tamanho e versão do manifesto, com blockmap presente. Build NEXO-2BC1CFAE0D6D5B7A. SHA-256 do ZIP: `A4B23F8FFDA4C00BE7326FAECEB1700E5B1356814D683B68A5C3E1ABDD989860`. Artefato disponível até 30/11/2026 às 00h31 de Brasília. O ensaio de foco cobre a tela de venda. A instalação e a atualização controladas em Windows cliente seguem pendentes. [Execução](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333) · [ZIP](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333/artifacts/14195233556)

### Monograma na candidata 1.0.13

Com o SHA-256 do instalador conferido, o Windows extraiu o mesmo ícone de 32 × 32 do instalador e do NEXO.exe da carga x64 do build NEXO-2BC1CFAE0D6D5B7A. O SHA-256 dos dois PNGs é EC8C7BB6FA16E08E106B4EEA772FEDFF6A02C42BA5A8FD5D2DD30975AACBE2EE, igual ao monograma inspecionado na 1.0.11. O PNG para a janela coincide com o arquivo oficial do repositório, com SHA-256 43E3A0E5686F0B58B92ABED5C0C4FE279E2A4FD553460D72F2F6D2BAE87752EA. A exibição na barra de tarefas ainda aguarda ensaio cliente.
