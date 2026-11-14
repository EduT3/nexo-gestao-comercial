
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
