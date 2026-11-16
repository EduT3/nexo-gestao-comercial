
Cadastros de clientes/fornecedores visíveis e reais validados com janela oculta, base temporária, isolamento e reabertura. Build aprovado; 102 testes em19 arquivos aprovados. Próximo: manutenção e adaptação do ciclo comercial local. Envio ao GitHub autorizado ao concluir as atualizações; não realizado nesta etapa.

SQLitev4 prepara histórico imutável de estoque para o ciclo comercial. Saldo exato derivado de movimentos, saída insuficiente recusada, rollback e reabertura comprovados. Migração/recuperação compatíveis e build aprovados;4 testes específicos passaram. Compra e venda locais permanecem pendentes. GitHub autorizado ao concluir atualizações; sem envio nesta etapa.

Compra local transacional implementada com fornecedor/itens reais, estoque e título opcional, auditoria e idempotência. Testes específicos/build aprovados. Sem interface comercial ainda; não declarar etapa2 concluída. Próximo: integração visível de compra/estoque, depois caixa/venda/financeiro. Publicação GitHub segue autorizada ao concluir atualizações.

2026-09-18: nova pasta C:\Users\eduar\Pictures\PROGRAMAÇÃO\ERP. Compra e estoque reais integrados e validados pela janela oculta: arredondamento exato, vencimento, isolamento e reabertura. Build e4 testes específicos aprovados. Próximo: caixa/venda/financeiro, cancelamento/estorno e pacote atualizado. GitHub será enviado após concluir/validar atualizações conforme solicitado.

Caixa local SQLitev6 implementado na camada de negócio: abertura/fechamento reais transacionais, auditoria, reexecução e histórico preservado. Build e4 testes específicos aprovados. Ainda sem interface/movimentos; próximo gate integração visível antes de venda. GitHub autorizado ao concluir atualizações, envio pendente.

Suprimento/sangria/consulta local implementados e testados; caixa fechado e saldo negativo bloqueados. IPC integrado, ainda sem interface. Build e2 testes aprovados. Próximo: caixa visível e integração de venda; publicação GitHub pendente da conclusão solicitada.

Caixa local visível aprovado pelo teste oculto: abertura, suprimento, sangria, saldo, contado/diferença e reabertura. Build e testes de regras aprovados. Ciclo ainda precisa venda/financeiro/cancelamentos e pacote atual. Envio GitHub continua pendente da conclusão das atualizações autorizadas.

SQLitev7: venda real integrada atomicamente com estoque, pagamentos, caixa físico e receita, com custo/preço históricos, desconto/troco e reexecução. Primeiro ciclo local na camada de negócio aprovado; build e4 testes específicos passaram. Venda ainda sem UI/IPC, etapa2 incompleta. Próximo: interface e cancelamento/estorno, depois financeiro essencial/Excel e pacote. GitHub autorizado ao concluir atualizações; envio pendente.

Venda visível aprovada no ciclo local pela janela oculta: desconto/troco, baixa estoque, incremento caixa físico, fechamento e reabertura. Suíte geral24 arquivos/107 testes aprovada, build aprovado. Requisitos restantes: cancelamento/estorno, financeiro essencial, operador, Excel/relatórios, pacote/Windows limpo e prévia. GitHub autorizado após concluir atualizações, ainda pendente.

Cancelamento SQLitev8 validado na camada de negócio com estorno de estoque/receita/caixa e histórico imutável, usando caixa atual sem alterar fechamento anterior. Build final aprovado após corrigir tipagem de consulta; testes específicos passaram. Próximo: interface/IPC com confirmação e financeiro. Objetivo ativo; GitHub autorizado após concluir atualizações.

Cancelamento visível aprovado pela janela oculta: desistir/confirmar, motivo persistente, retorno estoque, estorno em caixa novo e reabertura. Consulta financeira líquida real testada (receita preservada menos estorno). Build/tipagem/testes críticos aprovados; financeiro completo/Excel/pacote e publicação GitHub ainda pendentes. Objetivo ativo.

Pagamento/estorno de títulos de compra SQLitev9 validados, com caixa/auditoria atômicos e histórico preservado. Build final e testes específicos aprovados. Próximo: financeiro visível, recebíveis e Excel/pacote. Envio GitHub autorizado após concluir atualizações, ainda pendente.

Financeiro real aprovado pela janela oculta: pagar título em dinheiro, cancelar/confirmar estorno, nova baixaPIX, saldo e reabertura. Build/testes críticos aprovados. Pendentes recebíveis, relatórios/Excel, acesso operador, pacote atualizado e publicação GitHub após concluir atualizações.

Contas a receber SQLitev10 reais implementadas: criação, recebimento/estorno atômicos, histórico, reexecução e isolamento. Build e4 testes específicos aprovados. Próximo: interface/consulta e validação oculta; relatórios/Excel/acesso operador/pacote/GitHub ainda pendentes.

Contas a receber visíveis aprovadas pela janela oculta: criação, cliente, recebimento dinheiro, desistir/estornar e reabertura. Caixa identifica corretamente origem financeira. Suíte27 arquivos/110 testes aprovada e build aprovado. Objetivo ativo; pendentes operador/cadastros/consultas/Excel/relatórios/pacote/Windows limpo e envio GitHub após concluir atualizações.

Acesso local SQLitev11: credenciais derivadas, operador por empresa e autenticação reais testados; caixa de outro usuário bloqueado. Build e5 testes específicos aprovados. Login/UI/sessão ainda pendentes; objetivo ativo e publicação GitHub após concluir atualizações segue pendente.


## Acesso local integrado — 18/09/2026

A janela agora separa instalação configurada e sessão autenticada. O primeiro responsável define senha local; cada reabertura exige login. Sair limpa a sessão em memória e os cadastros exibidos. Senha incorreta não autentica, e IPC de produtos sem sessão é recusado. Restaurar uma cópia exige entrar novamente; nenhum usuário é escolhido automaticamente. Troca de acesso aguarda operações pendentes. Backup completo e restauração são restritos ao administrador das duas empresas na camada local.

Validação: build local e sintaxe Electron aprovados; suíte geral 28 arquivos/111 testes aprovada. Primeiro roteiro de janela atingiu limite global de 120 segundos no pagamento de contas após diversas reaberturas. Reexecução com limite global de 180 segundos e timeout individual de 7 segundos em andamento; ainda não declarar aprovação integral desse roteiro.

Pendentes: cadastro de operadores na interface e experiência por perfil, consolidação dos recebimentos/relatórios, Excel, pacote atual e validação da entrega Windows. GitHub autorizado após concluir e validar as atualizações; não publicado neste marco.


Resultado terminal: roteiro oculto concluido com exit 0. Login apos cada reabertura, senha incorreta, sair e IPC recusado sem sessao, restauracao seguida de login e ciclo compra/estoque/venda/caixa/financeiro/recebiveis/cancelamentos/estornos aprovados. Base temporaria; dialogos nativos controlados; build de desenvolvimento local. Limite global 180 segundos, individual 7 segundos. Isso nao comprova pacote atualizado nem Windows limpo. Proximo gate: cadastro de operadores e interface por perfil.


## Operador integrado e validado — 18/09/2026

Administrador cadastra operador por nome, senha local e empresas permitidas. Contrato e auditoria do servico local reutilizados por IPC restrito. Interface usa o perfil por empresa: operador consulta produtos e usa vendas/caixa; formularios administrativos, descontos, cancelamentos, movimentos manuais, financeiro e backup completo nao sao oferecidos. Permissoes continuam verificadas na camada local, inclusive chamadas diretas. Custos de produtos omitidos do retorno ao operador.

Troca de sessao aguarda operacoes pendentes e impede novas operacoes comerciais durante a troca. Seletor de usuario ganhou rotulo acessivel explicito: a falha inicial do roteiro era o seletor exato incluindo nomes das opcoes; inspecao confirmou logout correto.

Evidencias atuais: build local aprovado; 3 testes locais criticos acesso/caixa/vendas aprovados. scripts/verify-local-operator.mjs terminou exit 0 com base temporaria e janela oculta/offline: cadastro pela interface, login operador, empresa unica, IPC negando outra empresa/CRUD/financeiro/backup/restore/criar operador, custos omitidos, venda real de R$ 1,00 e fechamento do caixa proprio. Suíte geral 111 testes e ciclo comercial completo aprovados no marco anterior; nao repetidos integralmente neste marco. Pacote atual/Windows limpo continuam pendentes.

Proximo: consolidacao financeira dos recebimentos, consultas/historico e resumo do dia; depois Excel e entrega atualizada. GitHub sera publicado apos concluir e validar as atualizacoes autorizadas.


## Resumo financeiro consolidado — 18/09/2026

Consulta local ADMIN agora inclui recebimentos originais, estornos de recebimentos, contas recebidas liquidas, entradas totais (vendas apos cancelamentos + contas recebidas apos estornos) e entradas menos contas pagas. Tudo calculado com BigInt na transacao de leitura por empresa. Historico imutavel preservado; rebaixa apos estorno nao duplica o valor liquido. Nenhuma migracao SQL necessaria.

Interface distingue vendas, recebimentos e contas pagas; informa periodo completo, metodos eletrônicos versus dinheiro e que o resumo nao calcula lucro. Formatacao monetaria corrigida para valores negativos inferiores a R$ 1,00.

Build local aprovado. 3 testes criticos recebiveis/cancelamentos/pagamentos aprovados, com novas assercoes recebimento/estorno/rebaixa PIX/isolar empresa/perfil negado. scripts/verify-local-finance-summary.mjs aprovado exit 0 em janela oculta/offline e base temporaria: PIX R$ 1,23, empresa vizinha zero, estorno zerando recebimentos/entradas/saldo, conta paga PIX R$ 0,27 e saldo exibido -R$ 0,27. Dados preparados via IPC real, renderizacao verificada; confirmacao nativa controlada no teste.

Ainda pendentes consultas por dia/resumo diario, historico de estoque acessivel, Excel, pacote atualizado/validacao Windows e previa web atualizada/publicacao GitHub autorizada. Objetivo segue ativo.


## Histórico de estoque acessível — 18/09/2026

Nova consulta local autorizada lista movimentações por empresa e produto, mais recentes primeiro, em páginas de 50. Retorna produto/código/unidade, quantidade milli exata, origem, operação, data e responsável; não expõe custo. Valida filtro/offset e recusa produto ou empresa fora do acesso.

Novo painel mostra saldo atual e histórico. Identifica saldo inicial, compra, venda, devolução por cancelamento e ajuste; entradas positivas e saídas negativas, unidade legível, referência recolhida, filtro por produto e navegação mais recentes/mais antigas. Atualiza ao abrir e após revisões comerciais.

Evidências: build local aprovado; testes stock/cancelamento 2/2 aprovados. Teste de estoque cobre ordem, quantidade +1,250/-0,250, referência, responsável, custo omitido, empresa vazia, filtro cruzado negado, offset inválido, 53 movimentos sem repetição em duas páginas, persistência e acesso inativo. scripts/verify-local-operator.mjs aprovado novamente exit 0 após build final: saldo 1,000 depois de compra2/venda1; tabela contém compra, venda e -1,000, filtro resulta duas linhas e outra empresa é negada. Base temporária, janela oculta/offline.

Pendentes: resumo diário e filtros por data, relatórios/Excel, pacote atual/Windows limpo, prévia web e publicação GitHub autorizada. Objetivo segue ativo.


## Resumo diário local — 18/09/2026

Novo serviço local ADMIN recebe início/fim ISO explícitos, valida período e calcula por empresa sem somas monetárias em ponto flutuante: quantidade e valor bruto de vendas, cancelamentos ocorridos no período, vendas líquidas, recebimentos e pagamentos líquidos de seus estornos, resultado financeiro, valores originais por forma de pagamento e quantidades originais por produto. Cancelamentos/estornos contam na data do evento e o relatório preserva os registros originais.

Nova tela Resumo do dia usa a meia-noite local do computador para formar limites UTC, permite escolher data e explica a diferença entre valores originais e compensações. Resultados administrativos ficam fora da interface do operador e o IPC também recusa seu acesso. Rótulos acessíveis foram diferenciados entre relatório diário, tabela por pagamento e resumo histórico.

Evidências: build local aprovado. Testes de cancelamento/recebível/pagamento cobrem totais, formas CASH/PIX, produto/quantidade, empresa isolada, período vazio/inválido, recebimento-estorno-rebaixa, pagamento-estorno-rebaixa e perfil negado. Suíte completa final: 28 arquivos/111 testes aprovados. scripts/verify-local-finance-summary.mjs aprovou janela oculta/offline com pagamento R$0,27, resultado diário -R$0,27 e amanhã zerado. scripts/verify-local-operator.mjs aprovou de novo, incluindo relatório oculto e IPC negado.

Próximo gate: integração Excel de produtos com modelo/prévia/duplicidades e exportações de produtos, estoque, vendas e financeiro. A skill Spreadsheets foi carregada; o projeto não possui biblioteca Excel declarada. Pacote atual/Windows limpo, prévia web e publicação GitHub autorizada permanecem pendentes. Objetivo segue ativo.


## Importação de produtos por Excel — 18/09/2026

ExcelJS4.4.0 adicionado como dependência com override uuid11.1.1; npm audit final encontrou zero vulnerabilidades. Runtime usa buffer e bundle único exceljs.cjs no pacote Windows, sem Excel/Node externo. Arquivos selecionados limitados a5MB/1000 produtos; somente aba Produtos/cabeçalhos exatos e valores simples são aceitos, fórmulas/links/conteúdo formatado rejeitados.

Modelo XLSX por empresa contém Produtos e Instruções, cabeçalho/auto filtro, painel congelado, larguras/formatos, listas de unidade/ativo e categorias atuais. Importação administrativa tem seletor nativo, prévia sem gravação, estados pronto/duplicado/erro e confirmação explícita. Regras comerciais/zod e valores exatos são reutilizados; duplicados existentes são mostrados/ignorados, duplicados internos e linhas inválidas bloqueiam. Confirmação revalida a prévia dentro de uma transação única, audita product.imported e rejeita alteração concorrente. Operador é recusado antes do diálogo.

Correções durante QA: validação por intervalo evita reservar mil linhas; leitor percorre maior linha usada e ignora lacunas; teste de UI foi restringido à tabela de cadastros para não confundir a linha da prévia.

Evidências: testes excel-runtime/local-product-import2/2; scripts/verify-local-excel.mjs aprovado em desenvolvimento e no pacote artifacts/NEXO-Windows-1789776844382/NEXO.exe com base/XLSX temporários, offline, PATH mínimo, NODE_PATH vazio: modelo, prévia, erro, duplicidade, nenhuma gravação antes de confirmar, valores/categoria e isolamento. Operador oculto/IPC negado aprovado. Build/pacote aprovados. Suíte completa final30 arquivos/113 testes; npm audit zero vulnerabilidades.

Este pacote comprova o novo gate Excel, mas ainda não é entrega final: exportações produtos/estoque/vendas/financeiro, instruções atualizadas, pacote comercial completo/Windows limpo, prévia web e publicação GitHub autorizada permanecem pendentes. Objetivo segue ativo.


## Exportações Excel completas — 18/09/2026

Novo serviço ADMIN cria snapshot transacional por empresa de produtos/saldos, movimentos de estoque, vendas/cancelamentos/itens, contas a pagar/receber e eventos financeiros com estornos assinados. Somas de estoque derivadas em BigInt sem SQLite SUM. Operador recusado antes do diálogo.

Um único relatório XLSX contém Resumo, Produtos, Estoque, Vendas, Itens de vendas, Contas a pagar, Contas a receber e Movimentos financeiros. Cabeçalhos legíveis, contexto/empresa/data, filtro, cabeçalho congelado, larguras, moeda/quantidade/data tipadas e aviso de que exportação não é backup nem altera o NEXO. Quantidades fora da precisão segura do Excel são preservadas como texto decimal exato. Botão fica no painel Excel administrativo com seletor nativo.

Evidências: tests/local-export.test.ts aprova dados reais com compra, saldo2,000, vendas CASH/PIX, cancelamento, conta paga/recebida, isolamento e perfil negado; abre XLSX e verifica oito abas, valores tipados, aviso e ausência de erros de fórmula. scripts/verify-local-finance-summary.mjs aprova botão/diálogo e inspeciona relatório. scripts/verify-local-operator.mjs aprova painel oculto e IPC negado. Pacote artifacts/NEXO-Windows-1789780716307/NEXO.exe foi gerado e o roteiro financeiro/exportação passou com PATH mínimo/NODE_PATH vazio; uma primeira observação terminou com SyntaxError sem origem, repetição com node --trace-uncaught no mesmo pacote passou integralmente, sem recriação. Suíte final31 arquivos/114 testes; npm audit zero vulnerabilidades.

Excel requerido pelo objetivo agora cobre importação de produtos com modelo/prévia/duplicidades e exportação de produtos, estoque, vendas e financeiro. Ainda pendentes: atualizar instruções do pacote, executar ciclo comercial completo no pacote atual, revisão de usabilidade/acabamento, prévia web coerente, validação final de atualização/preservação e publicação GitHub autorizada. Objetivo segue ativo.


## Resumo diário: limites de data — 26/10/2026

Correção somente na fonte de `getLocalDailyReport`: limites SQL em UTC canônico, preservando `period`, autorização/transação e BigInt. Frações adicionais são tratadas na grade de milissegundos sem incluir/excluir registros por truncamento. Cinco regressões falharam antes; delta final com nove testes SQLite e duas tipagens aprovado. Bases fictícias novas, snapshots sem mutação e conexões fechadas; negativos anteriores preservados.

Fonte corrigida ainda não empacotada. BEFA e harness antigos intactos; nenhum build/ZIP/publicação ou dado operacional alterado. QA visual e homologação Windows anteriores continuam pendentes independentes. Evidências, método, hashes e limites em [DAILY-REPORT-PERIOD-2026-10-26.md](docs/DAILY-REPORT-PERIOD-2026-10-26.md).


## Candidata de teste com correção de datas — 27/10/2026

Build isolado0.1.0 **NEXO-E6C849C38EF8B8E7** e ZIP de teste separados;400 arquivos extraídos conferidos. Nove regressões aprovadas usando o SQLite do NEXO.exe extraído em modoNode, mais quatro verificações de persistência/reabertura da mesma base fictícia,27tabelas invariantes e integridade/FK aprovadas. Não é nova alteração funcional.

Após revisar os destinos efetivamente usados, o ensaio nativo/IPC passou em sete grupos e duas aberturas no mesmo perfil fictício, ambas encerradas0; identidade, caminhos e27tabelas preservados. Preflight e negativos de preparação anteriores mantidos. QAvisual não executada. Não abrir o executável em ambiente padrão; instruções de teste acompanham o ZIP. Sem instalação, atualização operacional ou publicação; antigos preservados. O ZIP parcial inicial de metadados não é a entrega. SHA,caminhos,ocorrências e limites em [CANDIDATA-DATAS-2026-10-27.md](docs/CANDIDATA-DATAS-2026-10-27.md).


## Unidade de produto após movimentação — 29/10/2026

Corrigida na camada local a troca de unidade que reinterpretava o estoque/histórico sem conversão. Agora é recusada após qualquer movimento, inclusive saldo zerado; produto sem histórico e edição mantendo a unidade continuam permitidos. Pedido misto é recusado por inteiro antes de produto/categoria/auditoria; empresa/ADMIN mantidos. Excel continua ignorando duplicados sem alterar unidade existente.

Cinco regressões reproduziram a falha;14 testes SQLite nos bytes compilados finais (9 novos +5 pertinentes), tipagem e compilação isolada aprovados. Snapshot27 tabelas, ordem concorrente na mesma fila, cancelamento/reabertura e valores exatos verificados. Erro inicial em duas assertivas de tipagem dos testes corrigido, recibos preservados. Candidata por fonte congelada/48 compilados e manifesto, sem novo ZIP. E6/BEFA,30 ZIPs, dist e fixture anteriores preservados; instalação/dados reais não alterados. Sem IPC/navegador/EXE nesta unidade, publicação ou reabertura da investigação de sockets/CIM. A correção ainda não integra a E6 ou versão em uso. [Relatório e limites](docs/PRODUCT-UNIT-GUARD-2026-10-29.md).


## Qualificação IPC da unidade — 29/10/2026

Layout nativo de TESTE NEXO-C271C996BAB58331, separado, com catálogo corrigido e somente esse delta funcional frente àE6. Electron44.4.1/Node24.21.0/SQLite3.53.4, sandbox/preload/bootstrap originais e destinos efetivos novos conferidos. Dez grupos IPC, oito recusas com27 tabelas invariantes,25 snapshots, compra127/venda289centavos e1255milésimos, saldozero e mesma base após fechar/reabrir aprovados. Ambos os processos da campanha encerraram0.

Duas falhas de identificação do harness anteriores às operações foram corrigidas somente na bancada, com negativos/perfis preservados e processos também encerrados0. Sem fonte funcional alterada,14 testes repetidos, aceite visual ou novo ZIP. Candidata fonte334, E6/BEFA,30 ZIPs e2414 arquivos protegidos intactos; instalação/dados reais não alterados, sem publicação. [Relatório e limites](docs/PRODUCT-UNIT-IPC-2026-10-29.md).


## Build manual sem senha — 10/11/2026

A pedido do usuário, cópia temporária em artifacts/teste-sem-senha-2026-11-10: primeiro acesso pelo nome e seleção de usuário sem senha; cadastro de operadores sem senha, mantendo ADMIN/OPERADOR, empresas e auditoria. Fonte padrão e bases anteriores preservadas. Iniciador Abrir NEXO sem senha.cmd usa perfil manual novo; bootstrap recusa perfis externos. Tipagem, compilação local/frontend e10 verificações de IPC/DOMlogin com reabertura aprovadas, zero credenciais; dois processos QA encerrados0. Perfil manual segue vazio. Erro inicial de staging sem index.html corrigido e log preservado. Sem aceite visual/teclado, adaptação da recuperação autenticada, instalação ou publicação. Recibo e diff dentro da pasta desta build.


## Produtos e estoque unificados — 10/11/2026

Interface com Início simples e uma única área para produtos/saldo/cadastro/entrada/movimentos, fornecedor inline e retorno do cadastro à entrada com rascunho preservado. Tutorial local opt-in, linguagem curta e5destinos principais. APIs/regras comerciais e autenticação padrão preservadas; build de teste mantém entrada por nome.

Treze casos distintos aprovados (cinco do helper conferidos novamente no final), tipagem/build isolado e oito grupos funcionais no Electron com estoque/empresa/perfil/reabertura aprovados. Build final NEXO-14069FB7D29BC736 limpo e smoke encerrado0; captura visual bloqueada por timeout, sem aceite visual. Negativos e versões anteriores preservados. Novo iniciador Abrir NEXO Produtos e Estoque.cmd usa o mesmo perfil manual sem lê-lo/alterá-lo durante o trabalho. [Resultado, limites e instruções](docs/PRODUTOS-ESTOQUE-SIMPLES-2026-11-10.md).


## 10/11/2026 — áreas distintas e participantes opcionais

Build local de testes NEXO-56709C9338DD6A58: blocos/cores do Bolsário, atalhos entre áreas com rascunho preservado, fornecedor opcional real e identificação de cliente secundária. SQLite12 com backup automático antes da atualização; versões anteriores não leem a base12.38 testes dirigidos aprovados, atualização nativa11→12 preservando27 tabelas, compra/venda reais em perfil fictício e reabertura conferidas. Capturas nativas inspecionadas; aceite humano de usabilidade pendente. Perfil manual preservado durante os testes; entrada por nome mantida só nesta build. Sem publicação/instalação. Iniciador: `artifacts/teste-sem-senha-2026-11-10/Abrir NEXO Rotinas Simples.cmd`. Evidências e retorno seguro: [ROTINAS-SIMPLES-2026-11-10.md](ROTINAS-SIMPLES-2026-11-10.md).


## 10/11/2026 — revisão final e ZIP portátil

ZIP da build NEXO-56709C9338DD6A58 gerado sem dados pessoais/código-fonte. Executável extraído passou12grupos de integração (compra/venda/cancelamento/pagamento/estorno/caixa/backup/Excel/reabertura),46testes em19arquivos e tipagem aprovados. Capturas atuais inspecionadas; início conferido a1280/900px. Nenhum defeito do aplicativo encontrado no recorte; iniciador cria perfil novo na pasta extraída.403arquivos conferidos byte a byte após extração/QA; SHA256 `A9E652E74AED2E131A58D2C4BE5BCB98A52F746FB3B1246BDA5670C937BC0D10`. Sem publicação/instalação; Windows limpo e diálogos manuais não homologados. Evidências, imagens e instruções: [REVISAO-ZIP-2026-11-10.md](docs/REVISAO-ZIP-2026-11-10.md).

## 11/11/2026 — NEXO Balcão

Integração seletiva na branch `feat/nexo-balcao` sobre a base local mais recente. Balcão com F2, carrinho fracionário, caixa, desconto, pagamentos e histórico sobre o IPC original. Testes Vitest 217/217 e integração no ZIP extraído da build NEXO-782EE60E3D16BC9A aprovados. QA de interface em 1487 × 1058, 1280 × 900 e 900 × 750. A suíte Playwright segue em validação e a correção de navegação legada em janela estreita requer ensaio. Evidências e checklist em [design-qa.md](design-qa.md).


### Fechamento da candidata Balcão r4

Build NEXO-E9061D585A4232E4, 217 testes Vitest e 62 cenários Playwright aprovados. Candidata portátil extraída e testada em perfil fictício, com vendas, caixa, histórico, backup e reabertura. A prévia compilada bloqueou gravação em navegador. Relatório, evidências e checklist manual em [design-qa.md](design-qa.md).

### Candidata Windows 1.0.3

Candidata Windows 1.0.3 preparada com botão de atualização pelo GitHub, ações de estoque por ícones e salvamento visível durante a rolagem. A compilação limpa a saída do frontend antes de montar o pacote. Os 219 testes Vitest passaram.

## NEXO Guard M1

Implementação candidata na branch de trabalho. A integração Windows verifica configuração, bloqueio de IPC, teclado de PIN e persistência após reabrir.


### Guard — autorização pendente e validação

A revisão `0f29d10` impede que alteração da política dispense o PIN de uma solicitação já protegida. A suíte local passou 235 testes em 53 arquivos na revisão `8fc6036`. A execução Windows [43533630029](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43533630029), incluindo duas dimensões para a interface do Guard, está em andamento; o instalador dessa revisão ainda não foi homologado. Detalhes e limitações: [NEXO-GUARD.md](docs/NEXO-GUARD.md).


### Guard — candidata Windows verificada

A execução [43534470859](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43534470859) aprovou 235 testes, o instalador e o roteiro em dados fictícios. Trocas de usuário e de empresa invalidaram pedidos pendentes; as capturas da configuração e do teclado foram inspecionadas em duas dimensões. Candidata vinculada à revisão `0ec218d`; sem merge ou release estável. Detalhes e limites em [NEXO-GUARD.md](docs/NEXO-GUARD.md).


### Guard — revisão atual

Candidata `fefab96`: execução [43535721498](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43535721498) aprovada com 236 testes, instalador e verificação do aplicativo em perfil fictício. Confirmação visual, troca de usuário e empresa, recuperação e retorno à versão anterior foram exercitados. PIN permanece em quatro dígitos; seis são trabalho futuro. Sem release estável ou merge.


### Guard — teclado e foco

A execução [43536830745](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43536830745), revisão `d450186`, aprovou 236 testes e validou foco, Tab, teclado físico, exclusão de dígitos e Escape no aplicativo Windows instalado. Instalador baixado e identificado no relatório do Guard; candidata sem release estável.


### Guard — política individual e global

A revisão `a2c1fbe` adicionou teste integrado de política individual/global com arquivos temporários; a suíte local completa passou 237 testes em 53 arquivos. A candidata Windows validada permanece a da execução 43536830745, sem alteração posterior do código de execução.


### M2.1 — feedback de autorização em produtos e compras

O cadastro de produto e a entrada de estoque exibiam “Salvando…” durante o pedido de PIN. Agora distinguem a autorização pendente do processamento da operação. O formulário de produto também apresenta erros e cancelamentos enquanto permanece aberto. Alterações em `src/client/Guard.tsx`, `main.tsx`, `LocalApp.tsx` e `LocalPurchases.tsx`. Tipagem do cliente e 17 testes de Guard, catálogo e compras aprovados. A verificação no executável e os demais fluxos de M2.1 seguem pendentes.

O processo principal agora sinaliza o PIN aceito depois das verificações de permissão e da invalidação do pedido, imediatamente antes de executar a ação. O diálogo diferencia a verificação do PIN do processamento. Alterações na ponte Electron, no diálogo e no teste do broker. Tipagem e 15 testes do Guard aprovados. Falta verificar o evento no executável Windows.


### M2.6 — auditoria inicial do atualizador

O atualizador libera a instalação apenas após download bem-sucedido e evita confirmações simultâneas. Quatro testes simulados passaram. A validação instalada permanece pendente. Veja docs/UPDATE-QA-M2.6.md.


### M2.1 — resultado da primeira candidata Windows

A execução [43539993490](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43539993490), revisão 8e513a9, confirmou no aplicativo instalado que cancelar a autorização no cadastro mantém o rascunho e não grava o produto. Uma nova solicitação com PIN correto gravou um único produto. A suíte local posterior de 1dd18fd passou 237 testes em 53 arquivos. A execução [43540152770](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43540152770), revisão 48ec00a, também passou. No aplicativo instalado, o PIN incorreto manteve o rascunho e não gravou o produto. Após cancelar, uma nova autorização correta gravou exatamente um produto.


### M2.6 — download no aplicativo instalado

A execução Windows [43541022951](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541022951), revisão fef6086, confirmou que o NEXO 1.0.4 instalado consultou o manifesto e baixou o instalador 1.0.5 pelo canal de teste em loopback. A instalação dessa execução foi acionada diretamente pelo roteiro. Os testes de instalação pelo botão, cancelamento, hash divergente e ajuda global ainda aguardam os resultados das execuções seguintes.


### M2.6 — atualização pelo botão e reabertura confirmadas

A execução [43541885976](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541885976), revisão ce3aa84, aprovou a atualização 1.0.4 → candidata 1.0.5 pelo botão do NEXO em perfil fictício. O roteiro rejeitou hash divergente, baixou o instalador válido, cancelou e retomou a instalação, conferiu a criação do backup e aguardou a extração dos arquivos antes de reabrir. As cinco vendas permaneceram acessíveis na candidata e no executável anterior. A ajuda global também abriu em janela compacta e devolveu o foco ao fechar. A validação de todos os registros comparados e do conteúdo da cópia pré-atualização segue na execução 43542456692.


### M2.6 — integridade dos arquivos instalados

A execução [43542065192](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43542065192), revisão 35aed97, passou pela comparação SHA-256 dos arquivos de aplicação instalados com o pacote da candidata antes da reabertura. A atualização pelo botão, o retorno ao executável anterior em dados fictícios e a ajuda global em 1000 × 650 também passaram. A revisão desta execução ainda não incluía a comparação detalhada do conteúdo do backup.


### M2.6 — conteúdo do backup e preservação dos registros

A execução Windows [43542456692](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43542456692), revisão 1e446e5, confirmou uma única cópia SQLite pré-atualização, integridade da cópia e igualdade dos registros de 16 tabelas com a base anterior. Após instalar e reabrir, a base ativa também manteve esses registros e o responsável voltou a entrar com o mesmo identificador. O roteiro usou perfil fictício e canal local de teste. A preservação do Guard já ativado na versão de origem ainda requer uma origem que inclua o recurso.

### M2.6 — atualização Windows com Guard ativo

A execução Windows [43543550789](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43543550789), revisão 4ccfc3e, aprovou a instalação pelo atualizador da candidata 1.0.6 em perfil fictício. A origem com Guard ativo veio do instalador de teste da execução 43536830745. O roteiro confirmou a preservação da política e do PIN de origem após a atualização. O instalador, o blockmap, o latest.yml e as evidências foram publicados no [artefato temporário nexo-windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43543550789/artifacts/14093078381). A auditoria automatizada confirmou a versão 1.0.6, o tamanho de 124152958 bytes e o SHA-512 do instalador em relação ao manifesto.

A execução usou um canal de teste em loopback e acionou o NSIS silenciosamente, com reabertura controlada pelo roteiro. Seguem pendentes a validação de um canal HTTPS de distribuição, instalação com retorno automático, interrupção de download, falha de execução do instalador e recuperação com migração incompatível.

### M2.6 — comparação de consultas SQLite

Comparação entre 868ad0a e 68ae238 no mesmo computador, com cópias das mesmas bases fictícias. Foram 12 amostras por cenário e 1.000, 10.000 e 50.000 produtos, com o mesmo número de vendas e o dobro de movimentos de estoque. Os resultados das consultas coincidiram. Com 50.000 produtos, as medianas antes e depois foram 110,813 e 111,116 ms no catálogo, 92,348 e 90,861 ms no estoque, 66,983 e 66,544 ms no histórico de vendas e 55,578 e 55,801 ms no histórico de estoque. Esta medição cobre consultas locais e não mede o tempo de renderização do aplicativo.

### M2.6 — consulta, download interrompido e nova tentativa

A execução [43596780998](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596780998) passou com 241 testes automatizados e dois perfis Windows fictícios, partindo de 1.0.4 e 1.0.5 com Guard. A consulta reconheceu a versão instalada, sinalizou perda de conexão e recuperou na nova tentativa. Um download truncado manteve a versão anterior e bloqueou a instalação. A nova tentativa baixou e instalou a candidata 1.0.6, build NEXO-5913A87B0F41F026. A versão com Guard preservou a política e o PIN.

Os relatórios baixados do [ZIP Windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596780998/artifacts/14115127959) confirmam tempos de download de 2,885 s e 2,881 s, e de instalação de 15,254 s e 11,220 s, respectivamente. As medições usaram loopback no runner Windows, com instalação silenciosa e reabertura controlada.

### M2.4 — conferência do fechamento validada no Windows

A execução [43596872161](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596872161), revisão 401814e, passou com 241 testes automatizados e verificou na candidata instalada que o saldo esperado aparece no formulário, a diferença muda ao digitar R$ 11,00 e R$ 12,00 e o fechamento confirma a operação. O roteiro passou nas origens 1.0.4 e 1.0.5 com Guard, reabriu o aplicativo e encontrou as cinco vendas e 27 tabelas íntegras em cada perfil fictício. [ZIP Windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596872161/artifacts/14115178073).

### M2.6 — recuperação e retorno incompatível no Windows

A execução [43597240803](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597240803), revisão ac10af6, passou com 242 testes automatizados. Nos dois perfis fictícios, a candidata manteve o aplicativo aberto e tornou a abrir a base após uma falha imediata simulada ao iniciar o instalador. O roteiro comparou os registros da base ativa e da cópia anterior à tentativa.

As origens 1.0.4 e 1.0.5 com Guard recusaram abrir a base fictícia marcada com versão SQLite futura, conservaram seus bytes e voltaram a abrir a cópia compatível com as cinco vendas. O teste simula incompatibilidade de versão do esquema. O [ZIP da candidata 1.0.6](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597240803/artifacts/14114974245) contém o build NEXO-9726593EFCF75BFE, manifesto de atualização, blockmap e relatórios.

### M2.4 e M2.5 — Contas e resoluções verificadas no Windows

A execução [43597626927](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597626927), revisão 5f13e18, passou nos dois perfis fictícios. Pagar e Receber explicaram quando a busca não encontrou contas e voltaram às pendências ao limpar os filtros. O roteiro também percorreu Vender, Estoque, Caixa e Contas pelo teclado em 1280 × 720, 1366 × 768 e 1920 × 1080, verificou a área ativa e a largura da página e salvou capturas no [ZIP Windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597626927/artifacts/14115149692). O pacote antecede o ajuste de espaçamento dos filtros de estoque e o histórico de caixa recolhido.

### M2.4–M2.6 — candidata com histórico recolhido e evidência de desempenho

A execução [43599952832](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832), revisão ef068e0, aprovou 242 testes e os perfis Windows de origem 1.0.4 e 1.0.5 com Guard. O histórico começou recolhido e mostrou o caixa fechado quando acionado. As capturas confirmaram o espaçamento dos filtros de estoque nas três resoluções do roteiro. O instalador do build NEXO-17AEB4E230DDCD9F, extraído do [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43599952832/artifacts/14115859392), coincidiu com o manifesto em tamanho e SHA-512. O relatório M2 registra as medições e suas limitações. A reabertura automática está em ensaio próprio.

### M2.6 — reabertura automática confirmada

Na [execução 43623101334](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623101334), a atualização de 1.0.5 com Guard para 1.0.6 por canal de teste relançou a janela principal do NEXO em um novo processo, sem abertura manual. O roteiro usou o modo silencioso do NSIS e confirmou o encerramento desse processo antes de reabrir em perfil fictício para conferir os registros e o PIN de origem. O [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623101334/artifacts/14125407186) está disponível no GitHub Actions. A interrupção durante a instalação e a recuperação correspondente ainda precisam de ensaio próprio.

### M2.6 — recuperação com verificação de integridade

A [execução 43624707886](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624707886), revisão 85f81d4, aprovou 242 testes e os dois perfis fictícios. Após interromper a substituição dos arquivos da 1.0.5 com Guard, o roteiro reinstalou a 1.0.6, abriu o NEXO, confirmou as cinco vendas e verificou a integridade SQLite, chaves estrangeiras e igualdade byte a byte do arquivo do Guard. O [ZIP verificado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624707886/artifacts/14125079915) contém o build NEXO-3E2B6BE692122B3C. O tamanho do instalador baixado, 124.153.357 bytes, e o SHA-512 coincidiram com latest.yml. O ensaio encerrou o processo NSIS em um Windows descartável. Reinicialização integral do computador durante a atualização segue sem evidência.


M2.6: a execução Windows 43650469127 comprovou importação XLSX e cancelamento com estorno no aplicativo instalado. O ZIP foi baixado e conferido. A revisão seguinte passa a registrar a versão solicitada antes do NSIS e só mostra a conclusão depois de abrir a versão correspondente com o banco preparado.


M2.6: a execução 43655162737 aprovou 246 testes, confirmou a mensagem de conclusão na atualização 1.0.6 → 1.0.7 e recuperou o aplicativo após interromper o NSIS em ambiente descartável. Artefato conferido com manifesto e hash. A homologação Windows cliente segue pendente.


### Windows 11 confirmado em uso prático e continuidade do M2

Em 14/11/2026, o usuário informou que o NEXO já está instalado no computador pessoal com Windows 11 e funciona normalmente nos testes práticos que realizou. O registro é manual e foi informado pelo usuário. Versão, método de instalação e cenários individuais não foram especificados. Os ensaios automatizados da candidata no Windows Server e no executável extraído em Windows 11 permanecem documentados separadamente.

A homologação do Windows 10 22H2 x64 fica pendente por indisponibilidade de ambiente. O NEXO Experience M2 segue com melhorias de interface e usabilidade em perfis fictícios. Para o futuro tutorial interativo, o ponto de partida é o guia contextual existente e o roteiro de primeiro uso. A orientação deve levar à tela certa e permitir sair ou retomar, com exercícios que não gerem vendas, movimentos ou cadastros reais. As validações existentes serão reutilizadas. [Matriz e pendências](docs/WINDOWS-COMPATIBILITY.md) · [Roteiro de primeiro uso](docs/USABILIDADE-M2.md)

### M2 — ajuda contextual com foco na tarefa

Na compilação local, o botão Ver esta tela passou a levar o foco à busca do catálogo, ao primeiro produto da entrada de mercadorias, ao controle de movimentações, ao valor inicial do caixa e à busca de venda. Se o controle estiver indisponível, o foco vai para o título da tela. A orientação de backup cita a guarda separada da política e da chave do NEXO Guard.

Um teste direcionado no Electron, com perfil e base temporários, confirmou os cinco destinos e o retorno do foco ao fechar com Escape. O teste não gravou produtos, vendas ou abertura de caixa. A tipagem e a compilação local passaram. Isto estende o guia existente. Os exercícios de prática com dados fictícios ficam para uma etapa posterior do tutorial interativo.

### M2 — prática de venda em dinheiro no tutorial

Em Ajuda e tutorial, Praticar uma venda em dinheiro calcula total, troco, estoque e caixa de treino a partir de um exercício com garrafas fictícias. O formulário usa estado local na interface, sem acesso à ponte comercial. Fechar a ajuda encerra o exercício e descarta seu estado. O guia principal continua usando suas preferências por operador e empresa.

A tipagem e a compilação local passaram. No Electron com perfil temporário, foram conferidos quantidade fora do estoque, pagamento insuficiente, pagamento válido, limpeza do resultado ao editar, retorno de foco com Escape e ausência de produtos, vendas e caixa gravados. A prática cobre venda em dinheiro. As outras rotinas do roteiro e sessões com participantes ainda precisam de evidência própria.

### M2 — abertura e fechamento no caixa de treino

A prática de venda evoluiu para um exercício contínuo de abertura, venda em dinheiro e fechamento. O participante informa o fundo inicial e o valor contado, acompanha o troco e o estoque fictício e confere a diferença no caixa. O exercício mostra que, após devolver o troco, o caixa aumenta pelo total da venda.

A tipagem e a compilação passaram. No Electron, com perfil temporário, o roteiro recusou abertura negativa e pagamento insuficiente. A venda de R$ 10,00 com R$ 20,00 recebidos gerou R$ 10,00 de troco, restaram oito garrafas e o caixa esperado foi de R$ 30,00. A contagem de R$ 29,00 apresentou diferença de −R$ 1,00. O reinício e o foco por teclado passaram. Nenhum registro comercial foi criado. Os exercícios de cadastro, entrada e consulta de contas continuam pendentes.

### M2 — rotina completa de balcão em dados fictícios

O tutorial agora encadeia cadastro, recebimento, abertura de caixa, venda em dinheiro, consulta da conta a pagar e fechamento para o responsável. Operadores praticam caixa e venda com catálogo de treino já preparado. O exercício fica em memória e reinicia quando a ajuda é fechada.

No Electron, um perfil fictício completou as seis tarefas com conta de R$ 20,00, oito unidades restantes e fechamento de R$ 30,00 sem diferença. A troca de perfil pela interface confirmou as três tarefas do operador. A base temporária permaneceu sem produtos, vendas, contas ou caixa gerados pela prática. A tipagem e a compilação passaram. O teste automatizado não é uma sessão com participantes.


### M2 — tutorial interativo aprovado na candidata Windows 1.0.8

A [execução 43731330072](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43731330072) aprovou 246 testes automatizados, empacotamento e os dois perfis Windows Server 2025. No aplicativo instalado, o roteiro completou as seis tarefas da prática de balcão em ambos os perfis e verificou a igualdade dos registros comerciais antes e depois. A captura mostra o fechamento simulado de R$ 30,00, sem diferença. O ensaio não representa uma sessão com participantes.

O [ZIP 1.0.8](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43731330072/artifacts/14168893349) foi baixado e conferido. Os relatórios do build `NEXO-6B0A9FA4933420C2` passaram sem erros de interface. O NSIS tem 124.155.663 bytes e corresponde à versão, ao tamanho e ao SHA-512 de `latest.yml`. O blockmap está presente. SHA-256 do instalador: `896A66CCBEEE5D29056D18246B4872D62C25C3B4476DD83430E6A444337B9F41`. A candidata é para testes, com artefato disponível até 29/11/2026, 12h56 no horário de Brasília. A versão pública permanece 1.0.4.

### M2 — retomada da prática durante a sessão

Ao fechar a ajuda ou ir a outra área, a prática mantém a etapa e os campos de treino na sessão atual. Reiniciar prática descarta o exercício. Sair do usuário ou trocar o contexto remonta o guia. As preferências persistidas do guia e os dados da prática continuam separados.

A tipagem e a compilação passaram. No Electron em perfil temporário, foram verificadas a retomada após Esc e navegação, a preservação do produto e da quantidade digitada, o foco no reinício, o descarte na nova sessão e a ausência de produtos gravados. A revisão ainda não integra o ZIP 1.0.8 já publicado como artefato de teste.


### M2 — retomada do tutorial na candidata Windows 1.0.9

A [execução 43743070192](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43743070192) aprovou 246 testes em Windows Server 2025. Nos dois perfis fictícios, o roteiro fechou a ajuda durante o recebimento, navegou para Vender e reabriu a prática com a etapa e o vencimento preservados. As seis tarefas foram concluídas e os registros comerciais permaneceram iguais.

O [ZIP 1.0.9](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43743070192/artifacts/14173905565) foi baixado. O instalador de 124.155.777 bytes e seu SHA-512 correspondem ao manifesto. O blockmap está presente, e os dois relatórios do build `NEXO-2EE2C72849C11E4A` passaram sem erros de interface. SHA-256: `96BFD60D5A32B176E98D44AF8B926E77F3007A09935F48909A84D1A40F64445E`. Artefato disponível até 29/11/2026, 15h02 no horário de Brasília. A versão pública permanece 1.0.4.

### M2 — feedback nas operações de caixa

A tela de caixa identifica a operação em andamento e distingue espera pela autorização de registro do movimento. No Electron com base temporária, o Guard exibiu a espera durante um suprimento, cancelar preservou os campos e o saldo de R$ 20,00, e uma nova tentativa com PIN válido registrou R$ 5,00 uma única vez. A tipagem e a compilação passaram. O ajuste é posterior ao pacote 1.0.9.

### M2 — feedback nas baixas do financeiro

Pagar e Receber agora informam quando aguardam autorização do Guard ou registram uma operação. A confirmação nativa de estorno também passa a mostrar o cancelamento ao voltar. No Electron com base fictícia, foram verificados o estado de espera, a preservação do método escolhido e a ausência de alteração no caixa após cancelar pagamento e recebimento. Na nova tentativa autorizada, os saldos passaram de R$ 10,00 para R$ 8,00 no pagamento e para R$ 11,50 depois do recebimento. A tipagem e a compilação passaram. A mensagem da confirmação nativa de estorno não foi exercitada neste roteiro.

O cancelamento de estorno também foi exercitado na interface do Electron. Em um perfil temporário, a automação respondeu Voltar às confirmações nativas de pagamento e recebimento. As duas operações exibiram Estorno cancelado, mantiveram o motivo digitado e deixaram as contas baixadas e o saldo de R$ 11,50 intactos.


### M2 — candidata Windows 1.0.10

A [execução 43745162436](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436) passou com 246 testes e duas verificações de aplicativo instalado no Windows Server. A candidata inclui as mensagens de autorização, processamento e cancelamento de caixa e contas, exercitadas em testes direcionados na compilação local. Os dois perfis instalados passaram no roteiro de atualização, operações comerciais e retomada da prática. O teste dirigido no executável extraído está registrado abaixo.

O [ZIP 1.0.10](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436/artifacts/14174511359) foi baixado e conferido. O build `NEXO-576BB6253FF853C7` inclui o instalador de 124.155.887 bytes, o blockmap e o manifesto com SHA-512 correspondente. SHA-256 do instalador: `4CD4A2445912F8740AC1857F6EB0BBB7F0051D0A592727030A4F2E048877087C`. Artefato disponível até 29/11/2026, 15h21 no horário de Brasília. A release pública permanece 1.0.4.


### Verificação dirigida da 1.0.10 no Windows 11 cliente

A carga x64 extraída do instalador conferido da 1.0.10, build `NEXO-576BB6253FF853C7`, passou nos testes de feedback de suprimento, pagamento e recebimento no Windows 11 Pro x64 26300.9974, em três perfis temporários. A interface informou a espera pelo PIN. O cancelamento preservou os campos e o caixa. As novas tentativas autorizadas registraram os valores previstos.

Os dois cancelamentos de estorno exibiram a mensagem correspondente, preservaram os motivos, mantiveram as contas baixadas e conservaram o caixa em R$ 11,50. Os diálogos nativos foram respondidos por automação. O ensaio usou o executável extraído, sem executar o NSIS nem acessar a instalação pessoal. [Artefato de origem](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43745162436/artifacts/14174511359)

### M2 — feedback na venda com desconto

A finalização indica espera pelo PIN ou registro da venda e anuncia o estado na região de retorno. No Electron com base fictícia, cancelar o Guard manteve o desconto de R$ 1,00, duas unidades em estoque, caixa de R$ 10,00 e zero vendas. A nova tentativa com PIN válido gravou uma venda de R$ 4,00, baixou uma unidade e elevou o caixa a R$ 14,00. Tipagem e compilação passaram. O ajuste é posterior ao ZIP 1.0.10.

### M2 — prévia do Excel durante a autorização

A importação distingue espera pelo PIN de processamento da planilha. Cancelar a autorização da confirmação mantém a prévia disponível. Erros de confirmação que podem ter invalidado a prévia continuam exigindo selecionar a planilha outra vez. No Electron com arquivo e perfil fictícios, o teste confirmou zero produtos após cancelar e uma importação após autorizar a nova tentativa com a mesma prévia. Compilação e tipagem passaram. O ajuste é posterior ao ZIP 1.0.10.


### M2 — venda e prévia Excel na candidata Windows 1.0.11

A [execução 43747340730](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730) aprovou 246 testes e dois perfis no Windows Server 2025. Em ambos, cancelar a confirmação protegida do Excel manteve a prévia e o catálogo sem o produto fictício. Autorizar a nova tentativa importou um produto, preservado ao reabrir. A mensagem da venda com desconto foi verificada em perfil temporário na compilação local.

O [ZIP 1.0.11](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730/artifacts/14175212566) foi baixado. O build `NEXO-B4FBEDEBFCC6D0E8` inclui o instalador de 124.155.850 bytes, o blockmap e o manifesto com versão e SHA-512 correspondentes. SHA-256 do instalador: `8A4CC5AD3C8FDFBB7B8AB7048BC7E91C3779BB92DC68D8C59A119F1186EF6962`. Artefato disponível até 29/11/2026, 15h47 no horário de Brasília. A versão pública permanece 1.0.4.

### Atualização para a candidata 1.0.11

Os dois relatórios da execução 43747340730 confirmam a atualização instalada para a 1.0.11 no Windows Server 2025, a partir da 1.0.4 pública e da 1.0.5 de teste com Guard. Em ambos os perfis fictícios, o atualizador rejeitou o instalador com hash divergente, gerou backup antes de fechar e reabriu a candidata com os mesmos usuários, vínculos e registros comerciais. O perfil com Guard manteve a política e o PIN de origem. O perfil de origem pública também repetiu a instalação após interromper o NSIS, preservando registros e política do Guard. O canal da candidata foi isolado. O ensaio HTTPS público baixou e verificou separadamente o instalador 1.0.4. [Relatórios e pacote](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43747340730/artifacts/14175212566)

### Candidata Windows 1.0.12 · acessibilidade do Guard

O diálogo do NEXO Guard expõe quantos dígitos foram preenchidos em uma região de anúncio, sem expor os números. A compilação local em perfil fictício confirmou a atualização da contagem na árvore de acessibilidade e o cancelamento por Escape. A devolução do foco ao controle que abriu o diálogo e a sessão com leitor de tela ainda precisam de validação. A [execução Windows 43795531364](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43795531364) aprovou 246 testes e os dois roteiros instalados no Windows Server 2025, incluindo a verificação da contagem e a atualização a partir da 1.0.4 e da 1.0.5 com Guard. O [ZIP da 1.0.12](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43795531364/artifacts/14193569832) foi baixado e conferido. Build NEXO-920D260F754C3F6D. O instalador de 124.156.011 bytes confere com versão, tamanho e SHA-512 do manifesto. O blockmap está presente. SHA-256 do ZIP: `06423556ADD30ABBFE21DFE773C3E49308C18545514B6E7413B9DD78757267C7`. Artefato disponível até 30/11/2026 às 00h13 de Brasília. A versão pública permanece 1.0.4 e a instalação controlada em Windows cliente segue pendente.

### Candidata Windows 1.0.13 · foco ao cancelar o Guard

Na venda com desconto, Enter abre o Guard e Escape cancela a autorização, preserva o desconto e devolve o foco a Concluir venda quando o diálogo deixa o foco no documento. O roteiro confirmou que o histórico não ganhou outra venda. Os 246 testes e os dois roteiros instalados no Windows Server 2025 passaram, incluindo atualização em canal isolado a partir da 1.0.4 e da 1.0.5 com Guard. O ZIP baixado confere com o SHA-256 do GitHub. O instalador de 124.156.041 bytes corresponde ao SHA-512, tamanho e versão do manifesto, com blockmap presente. Build NEXO-2BC1CFAE0D6D5B7A. SHA-256 do ZIP: `A4B23F8FFDA4C00BE7326FAECEB1700E5B1356814D683B68A5C3E1ABDD989860`. Artefato disponível até 30/11/2026 às 00h31 de Brasília. O ensaio de foco cobre a tela de venda. A instalação e a atualização controladas em Windows cliente seguem pendentes. [Execução](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333) · [ZIP](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43797179333/artifacts/14195233556)

### Candidata Windows 1.0.14 · padronização visual

O CSS compartilha valores de tipografia, espaçamento, bordas e estados dos controles. Em comparação local no Windows 11, os controles de venda e do Guard mantiveram geometria, contraste e foco nos estados ensaiados. No Windows Server 2025, os 246 testes e dois roteiros com aplicativo instalado passaram. O ZIP baixado confere com o SHA-256 do GitHub. O instalador de 124.156.279 bytes confere com a versão, o tamanho e o SHA-512 do manifesto. O blockmap está presente. Build NEXO-CB3B8787C105EA55. SHA-256 do ZIP: `0FE55A553E0DE4A369C2D4AD628FB0F1C6A1BC26C795816250F648403DFC1769`. Artefato disponível até 30/11/2026 às 00h58 de Brasília. [Execução](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43799796173) · [ZIP](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43799796173/artifacts/14196268479)

### Cabeçalho sem seletor de empresa

O cabeçalho do Balcão mostra apenas o nome da loja ativa. A troca de loja fica em Configurações → Lojas vinculadas e aparece somente para perfis legados com acesso a mais de uma loja. A validação local usou bancos fictícios com uma e duas lojas. Nenhuma migração ou operação sobre dados reais foi necessária.

### Primeiro acesso e dados da loja

A instalação de loja única pede o nome da loja e do responsável. O responsável pode renomear a loja em Configurações, com auditoria e permissão verificadas na camada local. Bases legadas mantêm todos os dados e vínculos e exibem Lojas vinculadas apenas para quem tem acesso a mais de uma loja. O esquema comercial permanece o mesmo. [Compatibilidade e impacto](docs/WINDOWS-COMPATIBILITY.md#uma-loja-por-instalação-e-compatibilidade-com-bases-antigas)

A candidata **1.0.15**, build NEXO-FD5CDB9C5524DE58, passou em 246 testes e dois roteiros no Windows Server 2025. O ZIP baixado confere com o digest do GitHub. O instalador confere com a versão, o tamanho e o SHA-512 do manifesto. O Windows 11 executou o binário extraído em perfil fictício e confirmou que operador não renomeia loja, cancelamento do Guard preserva o rascunho e PIN válido autoriza a gravação. A versão pública segue em 1.0.4. [Execução](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43864949498) · [ZIP](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43864949498/artifacts/14226196510)

### Versão pública 1.0.15

A **1.0.15** foi publicada como versão principal no GitHub Releases. O repositório oferece o instalador, o blockmap, o manifesto e as somas SHA-256. No Windows 11, o executável extraído da 1.0.4 consultou o canal público em perfil descartável, detectou a 1.0.15 e concluiu o download. O instalador baixado pelo atualizador corresponde ao SHA-256 e aos 124.156.857 bytes da release. O NSIS não foi executado nesse perfil do Windows cliente. [Release pública](https://github.com/EduT3/nexo-gestao-comercial/releases/tag/v1.0.15)
