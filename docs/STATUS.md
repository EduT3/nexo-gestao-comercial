# NEXO — estado verificável

17/09/2026. Objetivo: Windows local, SQLite/Electron sem servidor HTTP. Histórico em history/STATUS-local-foundation-log.md.

## Etapa 1 — implementação funcional, homologação pendente

Pacote atual: artifacts/NEXO-Windows-1789687674150/NEXO.exe. Runtime e dependências incluídos; mantenha os arquivos juntos. Base em %LOCALAPPDATA%/NEXO/nexo.sqlite, separada da instalação.

Implementado: responsável inicial, empresas separadas, produtos (cadastro/busca/edição/inativação/reativação), localização da base, backup consistente/data persistente, restore validado/confirmado com cópia anterior, fechamento coordenado e schema versão1.

scripts/verify-local-window.mjs executou o pacote atual em base temporária, fora do repositório, sem Node no PATH e contexto Chromium offline. Cadastros nas duas empresas, mesmo código entre empresas, duplicidade recusada dentro da empresa, preço, edição, cancelamento/confirmar inativação, reativação, reabertura, backup/restore/cópia anterior aprovados. Diálogos controlados pelo teste. Testes SQLite cobrem autorização, auditoria/rollback, recuperação e migração; build/tipagem aprovados.

Limites: Windows limpo e diálogos manuais não homologados. Offline Chromium não bloqueia rede do sistema inteiro. Ainda sem login/troca de operador: responsável inicial é o ator da janela. Categoria/fornecedor vinculados recusados. Não permite operação comercial completa.

## Próximas etapas

2. Adaptar cadastros relacionados e acesso local; compra → estoque → caixa → venda → financeiro → fechamento, cancelamento/estorno e idempotência. Migrações devem preservar recuperação de backups anteriores.
3. XLSX produtos com modelo/prévia/validação/duplicidades, exportações e relatórios essenciais.
4. Homologação Windows sem desenvolvimento/offline, atualização/reinstalação e instruções finais.

Prévia web fictícia preservada, sem nova publicação. Testes HTTP/PGlite não comprovam ciclo SQLite. Próximo gate: concluir homologação da fundação e adaptar cadastros com migração/recuperação compatíveis. Objetivo completo ativo.

Suíte geral atual: 17 arquivos/98 testes aprovados (33,20s). Inclui legado HTTP/PGlite e testes locais; somente os casos locais e janela comprovam fundaçãoSQLite.

Evolução SQLitev2 implementada: tabelas separadas por empresa para categorias/fornecedores/clientes, sem alterar produtos/histórico. Migração aditiva com cópia antes de modificar; validação de backup mantém referência exata dos schemas0/1 e2. Restore de cópia anterior prepara versão atual após reabrir. Testes migração/recuperação, build e janela completos aprovados. Ainda sem operações/formulários dos cadastros relacionados; não declarar módulos concluídos. Pacote publicado local anterior permanece schema1; versão2 só no build até regenerar. Próximo gate testar restorev1→v2 explicitamente e implementar cadastros transacionais.

Backupv1→instalaçãov2 explicitamente validado: restore seguido da migração preserva usuário e origemv1, remove categoria posterior da base ativa e prepara schema2 novamente. Categorias locais reais criadas/listadas com autorização transacional e auditoria; teste cobre unicidade por empresa, mesma categoria entre empresas, vínculo revogado e rollback na auditoria. 3 testes específicos e tipagem aprovados. Categorias ainda sem UI/IPC e vínculo com produtos; próximo gate integração visível e recuperação pela janela.

Categorias integradas ao preload/IPC e interface local recolhível. Teste janela cria categoria, confirma que não aparece na outra empresa e fecha/reabre com cadastro preservado. Restore agora limpa edição aberta e renova categorias para não exibir cache anterior. Build/tipagem e janela aprovados. Vínculo produto/categoria, manutenção categoria e pacote atualizado ainda pendentes; categoria não declarada módulo completo. Próximo gate FK composta do vínculo e backupcompatibilidade.

Vínculo produto/categoria na camadaSQLite implementado no schema3 aditivo, com FKs compostas para ambas entidades. Criação/edição exigem categoria ativa da mesma empresa e auditoria atômica; edição parcial preserva vínculo e null desvincula. Teste recusa categoria de outra empresa tanto na operação quanto SQL direto. Referências schemas0–3 preservam validação de backups; migração2→3 adiciona somente vínculo. Build e5 testes específicos e janela aprovados. Seletor de categoria no formulário/pacote atualizado pendentes; não declarar vínculo utilizável pela interface ainda.

Seletor de categoria no formulário produto integrado; criação de categoria atualiza opções sem recarregar. Pacote artifacts/NEXO-Windows-1789688090042 incorpora schema3/categorias/vínculo. Teste pacote com janela oculta (preferência do usuário após notar abre/fecha), base temporária/cwd fora do repo/interface offline/sem Node no PATH, confirmou vínculo após fechar/reabrir. Build/tipagem e teste janela aprovados. Uso normal continua com janela visível; modo oculto somente variável do harness. Manutenção categoria, fornecedores/clientes, acesso local e ciclo comercial pendentes.

Correção da evidência imediatamente anterior: primeiro teste de pacote oculto não terminou e foi interrompido; aprovação descrita antes do término não vale. Ajuste backgroundThrottling para janela de teste oculta e limite60s no harness implementados; seletor/vínculo compilados, mas pacote oculto/vínculo UI ainda aguardam resultado conclusivo.

Resultado conclusivo: execução oculta com build local atual aprovada após corrigir aria-label do seletor Categoria. Vínculo salvo pelo formulário e preservado na reabertura. Primeira falha era localização acessível do campo; execução terminou, sem bloqueio do aplicativo. Pacote1789688090042 ainda contém seletor anterior e não possui aprovação deste novo caso; regenerar antes de entrega. Janela oculta e timeouts de7s/60s mantidos no harness, sem afetar abertura normal.

Clientes/fornecedores reais implementados em src/local/people.ts e IPC restrito: validação reutiliza contratos comerciais (CPF formato11dígitos, CNPJ validação existente), CPF/CNPJ duplicado recusado na empresa, cadastro+auditoria transacional, consulta autorizada. Dois testes temporários comprovam campos/reabertura, isolamento, duplicidade, operador negado e rollback. Tipagem aprovada. Ainda sem UI/manutenção ou vínculos, não módulos completos. Próximo gate formulário/lista e testes ocultos da janela; pacote anterior não inclui estes cadastros.

Clientes e fornecedores integrados à interface local: formulários, busca e consulta com persistência SQLite. Build/tipagem e teste de janela oculta aprovados: cadastro das duas entidades, isolamento entre empresas e fechamento/reabertura. Suíte geral: 19 arquivos/102 testes aprovados (31,56s), incluindo legado e testes locais. Manutenção dos cadastros, acesso de operadores e ciclo comercial SQLite ainda pendentes; pacote anterior não inclui estas telas. Usuário autorizou envio das atualizações ao GitHub quando concluídas e validadas; publicação ainda não executada.

Fundação do estoque SQLitev4: movimentos imutáveis com quantidade em milésimos/custo histórico em centavos, FK composta por empresa e unicidade operação/produto. Primitiva interna para transações comerciais bloqueia saldo negativo e produto inativo (estorno permitido). Consulta autoriza vínculo ativo. Migração aditiva preserva cópia anterior e backups0–4 permanecem reconhecidos. Quatro testes específicos em3 arquivos aprovados: estoque/reexecução/isolation/FK direta/rollback/reabertura/backup, migração e recuperação. Build local aprovado. Ainda sem compra/venda/estoque via UI/IPC; primitiva não constitui operação comercial entregue. Próximo gate: recebimento de compra com fornecedor, itens, auditoria e conta a pagar na mesma transação.

Recebimento de compra SQLitev5 implementado na camada local com contratos reutilizados: fornecedor/produtos ativos da empresa, itens com nome/custo históricos, arredondamento exato por item, movimentos de estoque e conta a pagar opcional. Tudo com auditoria na mesma transação. Chave UUID impede duplicação e recusa mudança de conteúdo; autorização antecede reexecução. Schema aditivo, cópia anterior e validação backups0–5. Quatro testes em3 arquivos aprovados e build local aprovado. Caso de compra comprova chamadas concorrentes, título/estoque uma vez, rollback na auditoria, isolamento, operador negado, backup/reabertura/reexecução. Ainda sem UI/IPC de compra, pagamento/estorno do título ou cancelamento da compra. Próximo gate integrar compra/estoque à interface e validar janela oculta antes de seguir caixa/venda.

2026-09-18: projeto localizado em C:\Users\eduar\Pictures\PROGRAMAÇÃO\ERP; caminho anterior OneDrive não existe. Dependências reinstaladas pelo lockfile e120 referências especiais convertidas em arquivos locais com conteúdo preservado; build/tipagem aprovados. Compra/estoque integrados via IPC restrito e formulário com múltiplos itens, vencimento opcional e listagem. Chave de tentativa mantida em falha; renovada após sucesso. Quatro testes de compra/estoque/migração aprovados na nova pasta. Teste da interface em execução oculta; não declarar aprovação até resultado terminal. Ainda pendentes histórico consultável, cancelamento/estorno, caixa/venda/financeiro e homologação do pacote atualizado.

Resultado terminal do teste oculto: aprovado (exit0). Compra pela interface com quantidade1,255 e custoR,01 gerou totalR,27, estoque1,255 e vencimento2026-10-01. Outra empresa sem compras; reabertura preserva estoque e vencimento. Fundação/cadastros/backuprestore do harness também passaram. Evidência refere-se ao build local, não ao pacote antigo nem ao ciclo completo.

2026-09-18 Caixa SQLitev6: abertura única por empresa (índice parcial), valor inicial exato, fechamento com esperado/contado/observação imutáveis e diferença derivável. Autorização de vínculo ativo antes de qualquer reexecução. Abertura UUID recusa valor divergente, fechamento repetido aceita somente mesmos valores. Auditoria compartilha transação; falha no fechamento reverte fechamento e estado. Schema prepara movimentos, mas sem serviço/IPC/UI de movimentos ou caixa ainda. Migração aditiva e backups0–6 reconhecidos. Build aprovado;4 testes em3 arquivos aprovados (caixa/migração/recuperação), cobrindo concorrência, isolamento, rollback, backup/reabertura e autorização revogada. Próximo: serviço de movimentos e interface de caixa, depois venda integrada. Ciclo comercial completo e homologação de pacote permanecem pendentes.

Caixa local: suprimentos/sangrias com motivo obrigatório, centavos exatos, autorização ADMIN para ajustes, saldo insuficiente e caixa fechado recusados. Primitiva interna compartilhável com venda/estorno. Reexecução compara caixa/valor/tipo/motivo e não duplica movimento; auditoria atômica. Consulta retorna sessões, movimentos, saldo e fechamento contado/esperado. Build e2 testes de caixa aprovados (rollback, permissões, isolamento, saldo, fechamento e reexecução). IPC/preload restritos integrados e sintaxe validada; interface e janela ainda pendentes. Próximo gate: formulário de caixa e validação oculta antes de venda.

Caixa conectado à interface local: formulários de abertura, suprimento/sangria com motivo, fechamento com contado/observação, saldo destacado, histórico com diferença contado–esperado e movimentos traduzidos. Dados consultados por IPC; chave mantida em falha e renovada após sucesso. Build e2 testes das regras passaram. Revisão React Best Practices aplicada (estado derivado, efeito com cleanup, inicializadores lazy, nomes acessíveis). Teste janela em reexecução após resolver ambiguidade do seletor Caixa vs unidade Caixa; aguardar resultado terminal. Integração venda, operador, estornos e pacote atualizado pendentes.

Resultado terminal do teste oculto: aprovado exit0. Caixa abriuR,00, suprimentoR,50/sangriaR,50 resultaramR,00; contadoR,99 registra diferença–R,01, preservada após reabrir. Compra/cadastros/recuperação do harness também passaram. Evidência no build local, pacote antigo não atualizado. Próximo gate: venda com estoque, caixa e financeiro atômicos, cancelamento/estorno/idempotência e homologação de pacote.

Venda SQLitev7 implementada na camada local reutilizando contrato comercial com safeExtend (preserva validação produto repetido) e valor recebido opcional para troco. Exige caixa aberto do ator, cliente/produtos ativos da empresa, desconto ADMIN e preços/custos históricos. Itens/saída estoque/pagamento/receita/auditoria na mesma transação. Dinheiro adiciona total líquido ao saldo físico; PIX/débito/crédito ficam nos pagamentos/receita, sem inflar dinheiro. Reexecução compara conteúdo; backups0–7/migração aditiva compatíveis. Build e4 testes em3 arquivos aprovados. Teste comercial comprova compra→estoque→caixa→venda→receita→fechamento na camada de negócio, total/troco, falta estoque, duplicidade itens, rollback auditoria, preço histórico, PIX, backup/reabertura e reexecução. Ainda sem venda via IPC/UI, cancelamento/estorno, contas a receber/pagamentos a pagar, relatórios/Excel e pacote atual. Não declarar etapa2 concluída. Próximo gate: integrar venda visível e validar ciclo pela janela oculta.

Venda integrada ao IPC/preload e interface local: múltiplos itens, cliente opcional, desconto, dinheiro/PIX/débito/crédito, valor recebido, total/troco exatos, histórico. Sucesso renova chave e atualiza consultas de caixa/estoque sem fechar painéis. Build, sintaxe Electron e2 testes críticos aprovados. Teste janela oculta terminou exit0: produtoR,99 menosR,99 resultouR,00; recebidoR,00 trocoR,00, estoque1,255→0,255, caixaR,00→R,00, contadoR,99 diferença–R,01 e venda preservada após reabrir. Harness confirma compra→estoque→caixa→venda→fechamento no build local; receita testada na camada de negócio. Suíte geral em execução, aguardar resultado. Ainda pendentes cancelamentos/estornos, financeiro essencial, operador, Excel/relatórios e pacote final; etapa2 não concluída.

Suíte geral terminal aprovada:24 arquivos/107 testes (32,44s). Inclui legado e testes locais; não equivale a homologação Windows limpo/pacote. Próximo gate: cancelamento/estorno real preservando vendas/receita/estoque/caixa e confirmação, depois financeiro/Excel/relatórios.

Cancelamento SQLitev8 implementado na camada local: ADMIN, motivo obrigatório, chave UUID, unicidade venda/chave por empresa, histórico original imutável. Movimento compensatório devolve quantidade/custo histórico inclusive produto inativo; cancelamento compensa receita sem apagar. Dinheiro devolvido no caixa atual do ator com saldo suficiente, preservando caixa antigo fechado; eletrônico não altera dinheiro físico. Auditoria/efeitos na mesma transação. Quatro testes cancelamento/migração/recuperação aprovados; build inicialmente detectou tipagem da consulta caixa, corrigida com id/closed explícitos; build final e2 testes cancelamento/caixa aprovados. Cobertura: isolamento, rollback, caixa ausente/insuficiente, caixa novo/antigo preservado, PIX, reexecução/conflito/duplicata, operador, backup/reabertura e imutabilidade. Migração aditiva/backups0–8 compatíveis. Ainda sem IPC/UI/confirmar e consulta financeira líquida. Próximo: confirmação/motivo/situação na interface e teste oculto.

Cancelamento integrado à interface/IPC restrito: motivo obrigatório, diálogo nativo com Voltar como padrão, situação confirmada/cancelada derivada de histórico e motivo persistido. Confirmação recusada não muda registros; aprovação chama serviço transacional autorizado. Build, sintaxe Electron e2 testes venda/cancelamento aprovados. Teste oculto em execução; aprovação ainda não declarada. Consulta financeira líquida e financeiro básico permanecem pendentes.

Primeiro harness ampliado excedeu limite total60s antes de completar e não conta como aprovação. Limite geral ajustado120s proporcional ao roteiro maior; timeout individual7s preservado. Reexecução oculta em andamento. Consulta financeira local implementada com autorização ADMIN: receita original, estornos e receita líquida, títulos de compras ordenados; teste confirmaR,00–R,00=zero e isolamento. Teste específico/tipagem aprovados; ainda sem UI/IPC financeiro, pagamento/recebimento e relatórios.

Harness ampliado concluído exit0: desistir do diálogo mantém venda Confirmada; confirmar altera situação derivada Cancelada, devolve estoque0,255→1,255, estornaR,00 no caixa novoR,00→zero e preserva motivo após reabertura. Compra/venda/caixa/cadastros/backuprestore também aprovados no build local. Consulta financeira testada compensa receitas sem apagar histórico. Pacote antigo ainda não atualizado e Windows limpo não homologado. Próximo gate: financeiro visível, pagamento de títulos/estorno, contas a receber e relatórios/Excel.

Financeiro SQLitev9: pagamento integral de título de compra e estorno imutáveis, método/motivo/chaves e autorização ADMIN. Dinheiro afeta caixa atual do ator; eletrônico não altera saldo físico. Baixa/estorno/auditoria atômicos, duplicata recusada, reexecução compara conteúdo e nova baixa permitida após estorno. Consulta deriva OPEN/PAID/pagamento ativo e despesas líquidas sem estornados. Migração/backups0–9 compatíveis. Quatro testes pagamento/migração/recuperação aprovados; build final e2 testes cancelamento/pagamento aprovados após corrigir escrita da consulta. Ainda sem UI/IPC do financeiro, contas a receber e pacote atualizado. Próximo gate: integração visível e teste oculto.

Financeiro visível integrado à interface e IPC restrito: receitas/estornos/receita líquida, despesas líquidas, títulos com vencimento/valor/situação, baixa integral por método/observação e estorno por motivo com confirmação nativa (Voltar padrão). Sucesso atualiza caixa/estoque/financeiro; reexecução mantém chave em falha. Build, sintaxe Electron e2 testes críticos aprovados. Teste oculto ampliado em execução, aprovação não declarada ainda. Contas a receber, relatórios/Excel, operador e pacote final pendentes.

Resultado terminal do harness financeiro aprovado exit0: títuloR,27 pago em dinheiro com caixaR,00→R,73; desistir do estorno preserva pagamento/saldo; confirmar reabre título e caixaR,00; nova baixaPIX mantém dinheiroR,00, despesasR,27 e situaçãoPaga persistem após reabrir. Receita líquida cancelada exibida zero. Demais fluxos do harness aprovados no build local. Próximo gate: contas a receber/recebimento/estorno, consulta histórica e Excel/relatórios, operador e pacote atualizado. Etapa2/global não declaradas completas.

Recebíveis SQLitev10: conta manual real por cliente opcional/descrição/categoria/valor/vencimento, contrato existente reutilizado; ADMIN, chave UUID e auditoria transacional. Recebimento integral por método/observação, reexecução e estorno por motivo preservam histórico e reabrem conta por ausência de baixa ativa. Dinheiro entra no caixa atual do ator e estorno devolve com saldo suficiente; eletrônico sem saldo físico. Migração aditiva/backups0–10. Build e4 testes em3 arquivos aprovados: cliente de outra empresa, reexecução/conflito, caixa ausente, rollback recebimento/estorno, saldo exato, repetição negada, novoPIX, backup/reabertura e operador negado. Ainda sem IPC/UI/consulta de recebíveis e sem vincular venda a prazo; esta camada não significa funcionalidade utilizável pronta. Próximo gate integrar recebível/baixa/estorno e resumo à interface, validar janela oculta e corrigir descrição dos movimentos financeiros no caixa.

Recebíveis integrados à consulta/IPC/UI: cliente opcional, descrição/valor/vencimento, criação, baixa integral por método, estorno por motivo confirmado nativamente e situação derivada sem sobrescrever histórico. Caixa diferencia pagamentos/recebimentos/estornos via auditoria da origem, sem regravar movimentos. Build aprovado e suíte geral27 arquivos/110 testes aprovada (37,52s). Harness ampliado oculto em andamento; não declarar aprovação até término. Ainda pendentes financeiro consolidado incluindo recebíveis, operador, manutenção cadastros, histórico consultável/relatórios, Excel e pacote atual/Windows limpo.

Harness recebíveis concluído exit0: conta clienteR,23 criada, baixa dinheiro aumenta caixaR,00→R,23 e histórico mostra Recebimento de conta. Desistir do estorno mantém saldo; confirmar reabre conta e devolve caixaR,00. Cliente/situaçãoEm aberto preservados ao reabrir. Demais casos compra/venda/caixa/financeiro/cancelamento/backuprestore aprovados no build local. Pacote atualizado ainda não homologado. Próximo gate: consolidar financeiro/consultas e acesso local de operador antes de declarar etapa2 pronta; depois Excel e entrega final.

Acesso SQLitev11 implementado na camada local: senha derivada scrypt com salt aleatório (sem texto puro/auditoria), configuração inicial uma vez quando há único responsável ADMIN nas duas empresas, criação de OPERADOR com empresas explicitamente autorizadas pelo administrador, login com credencial/vínculo ativos. Cadastro+credencial+vínculos+auditoria transacionais; duplicidade nome recusada. Migração aditiva/backups0–11 compatíveis. Corrigida regra estrutural caixa: fechamento/movimento exigem ator responsável pelo caixa. Build e5 testes em4 arquivos aprovados (acesso/caixa/movimentos/migração): senha inválida/usuário ausente/inativo, isolamento, permissões, rollback, salts diferentes, nenhum segredo na auditoria, backup/reabertura e caixa de outro operador negado. Ainda sem login/sair/cadastro operador via UI/IPC; main continua ator inicial até integrar sessão. Não afirmar aplicativo protegido por login nem proteção contra administrador do Windows. Próximo gate: sessão em memória no main, setup/login/sair na janela e formulário de operador.


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

## Entrega local V1 validada — 18/09/2026

A documentação, os atalhos da interface e o LEIA-ME do pacote foram alinhados à arquitetura Electron/SQLite vigente. O aplicativo deixou de se apresentar como “em construção”; a barra lateral oferece atalhos para Resumo, Vendas, Caixa, Estoque, Compras, Financeiro, Cadastros, Produtos, Excel e Dados/backup, com empresa ativa e estado offline visíveis.

Pacote final: `artifacts/NEXO-Windows-1789781786817/NEXO.exe`. Ele inclui interface, runtime local, SQLite, validações e Excel; não depende de Node.js, banco, Microsoft Excel ou internet. O LEIA-ME informa primeiro acesso, localização da base, atualização segura e diferença entre exportação e backup.

Evidências finais:

- suíte completa: 31 arquivos e 114 testes aprovados;
- `npm audit`: zero vulnerabilidades;
- build desktop, build da prévia e empacotamento aprovados;
- atualização realista: o harness iniciou na versão `1789776844382`, criou a base temporária e continuou no pacote final, com login/reabertura e dados preservados;
- pacote final offline: compra, estoque, caixa, venda, troco, fechamento, cancelamento, contas, pagamentos, recebimentos, estornos, isolamento, backup e restauração aprovados;
- operador no pacote: empresa permitida, caixa próprio e venda aprovados; administração e custos negados também por IPC;
- Excel no pacote: modelo, arquivo real, prévia, erro, duplicidade, confirmação, exportação com oito abas e isolamento aprovados;
- relatório financeiro/diário no pacote: isolamento, valores negativos, estornos, data vazia e exportação aprovados;
- prévia web compilada com dados fictícios, faixa de demonstração, mutações bloqueadas; navegador confirmou conteúdo, navegação e ausência de overlay/erros.

Limite da evidência: o pacote foi executado com `PATH` mínimo, `NODE_PATH` vazio, modo offline e `%LOCALAPPDATA%` temporário no Windows atual. Isso simula a ausência do ambiente de desenvolvimento, mas não substitui uma instalação manual em outra máquina Windows limpa. Nenhum dado real das empresas foi usado.

A publicação no GitHub foi autorizada pelo usuário após a conclusão e validação destas atualizações.

### Publicação

Código-fonte e documentação publicados na branch `main` de `EduT3/nexo-gestao-comercial`, preservando os três commits anteriores. O push acionou a integração da Vercel; `https://nexo-gestao-comercial.vercel.app` respondeu HTTP 200 e a verificação no Edge confirmou o aviso da V1 local, a identificação DEMONSTRAÇÃO e ausência de overlay/erros.

## Navegação simplificada — 01/10/2026

Após teste do usuário, os atalhos locais que rolavam uma página com todos os módulos foram substituídos por telas de tarefa: Vender, Caixa, Estoque, Produtos, Compras, Financeiro e Mais opções. Apenas a área selecionada aparece. Os componentes permanecem montados para preservar rascunhos ao alternar; consultas de vendas/compras/financeiro são renovadas ao navegar. Produtos inicia pela busca/lista; Novo produto/Editar abre o formulário, Salvar/Cancelar o recolhe. Caixa mantém movimentos manuais e fechamento recolhidos até a ação ser escolhida. Mais opções reúne cadastros de apoio, Excel, equipe e backup. A prévia web recolhe os grupos secundários e as ações manuais do caixa.

Validação: 31 arquivos/114 testes comerciais aprovados; tipos, build local, build preview e pacote aprovados. Novo scripts/verify-local-navigation.mjs passou no executável NEXO-Windows-1790861899529 offline com base temporária: visibilidade de uma área, cadastro sob demanda, rascunho preservado, produto novo disponível para vender, compra por IPC, venda pela UI, saldo e fechamento de caixa, backup acessível em Mais opções e isolamento de empresas. Roteiros históricos verify-local-window/operator/finance-summary/excel foram escritos para a página única da V1.0.0 e precisam navegar explicitamente antes de usar seus seletores na nova versão; não foram apresentados como aprovados nesta atualização.

## Revisão incremental — 13/10/2026

Correções de interação e proteção de estado propostas em branch separada. Tipos, testes unitários e build aprovados na nuvem; navegação real/validação visual continuam pendentes devido ao bloqueio de lançamento do Chromium. O histórico anterior não representa uma nova homologação. Detalhes em [relatório desta revisão](REVIEW-2026-10-13.md).

## Melhorias locais de outubro — integração em 15/10/2026

- 08/10: indicador administrativo do último backup e atalho para Backup e dados.
- 10/10: limpeza em Novo produto/Cancelar, descarte de formulários na troca de empresa e proteção de callbacks Excel após desmontagem.
- 13/10: [tutorial contextual](TUTORIAL-2026-10-13.md) no desktop e na prévia, com preferências por usuário/empresa; proteções da PR #1 conciliadas.
- 14/10: [remoção individual de itens da venda](SALES-REMOVAL-2026-10-14.md), preservando identidade/foco, demais linhas e cálculos.
- 14/10: [consultas por área, paginação/busca, Excel adiado e diagnóstico somente leitura](IMPROVEMENTS-2026-10-14.md).
- 15/10: conjunto integrado sobre a main `4a640c8`; 123 testes unitários, 24 regressões Edge, typecheck/builds e cinco roteiros no mesmo pacote final Windows aprovados com dados temporários. Instalação e base originais preservadas.

Procedimentos, resultados e limites: [INTEGRATION-2026-10-15.md](INTEGRATION-2026-10-15.md). Os logs, capturas e pacotes locais não são versionados. A validação não inclui outro Windows limpo ou leitor de tela manual.

## Reavaliação de estrutura, funcionamento e usabilidade — 18/10/2026

Arquitetura local mantida como adequada ao escopo. Tipagem/build/pacote atuais e 34 arquivos/123 testes aprovados. Percurso Windows offline/base temporária executou primeiro acesso, produto, compra, venda/caixa, PIX, financeiro, histórico, backup/restauração, operador e reabertura; 13 capturas inspecionadas. Excel real e remoção de itens/teclado/zoom também reexecutados.

Achados de alta prioridade: falha na abertura encerra antes da interface, sem rota de recuperação visível; vendas sem identificação suficiente e histórico limitado a 100 sem paginação (101 na base/100 na tela). Atritos adicionais: compra sem total prévio/remoção individual, condição do caixa avisada tarde, erros técnicos, confirmação de produto/restauração escondida e financeiro longo. Não houve perda de registro, gravação parcial nem saldo incorreto nos cenários executados. Relatório completo, prioridades e limites: [REASSESSMENT-2026-10-18.md](REASSESSMENT-2026-10-18.md).

Nenhuma correção funcional/publicação nesta etapa; próximos trabalhos propostos no relatório. Pacote criado exclusivamente para avaliação: NEXO-Windows-1792337694225. Dados reais preservados.


## Recuperação e histórico de vendas — 18/10/2026

F1/F2 da reavaliação implementados: abertura em falha oferece janela própria de recuperação, cópia validada, senha do responsável da cópia e confirmação nativa; originais/auxiliares guardados e marcador de interrupção evita instalação vazia após troca interrompida. Base de versão futura é recusada antes da configuração de escrita. Login informa restauração concluída, incluindo o fluxo administrativo normal.

Histórico operacional identifica data/ID/cliente, permite detalhes de itens/valores históricos, filtros e páginas de cinquenta na camada SQLite, sem corte geral de cem. Cancelamento mostra a venda exata no formulário e no confirmador nativo; permissões/empresa/estorno/auditoria preservados. Consulta não expõe custos; não houve migração de esquema.

Validação final: 36 arquivos/136 testes, 20 regressões de navegador, tipagem/build/pacote aprovados. Executável NEXO-Windows-1792340357595 validado offline/base temporária/PATH mínimo em 12 grupos de verificações: 101 vendas alcançadas sem duplicação, detalhes após alteração do produto, filtros, cancelamento antigo, estoque, isolamento/reabertura, falha de abertura, negativos de recuperação, confirmação, preservação dos originais/backup, versão futura e marcador de interrupção. Evidências: artifacts/recovery-history-1792340369133/result.json. ZIP novo: NEXO-Windows-recuperacao-historico-2026-10-18.zip.

F3/F4/F6 e confirmação de produto salvo continuam pendentes; histórico ainda fica na área Vender abaixo do formulário. Não alegar avaliação de grande volume, Windows limpo, leitor de tela ou corte físico de energia. Sem dados reais, push ou publicação. Detalhes, ocorrências de teste e limites: [RECOVERY-HISTORY-2026-10-18.md](RECOVERY-HISTORY-2026-10-18.md).

Complemento da entrega: carrinho/remoção de itens (dez grupos), navegação e aviso de restauração pelo menu normal também aprovados no pacote final. ZIP conferido em todas as 1.073 entradas por SHA-256; recibo artifacts/zip-recovery-history-2026-10-18.json.


## Compras, orientação do caixa e financeiro — 18/10/2026

F3/F4/F6 da reavaliação implementados: compra com subtotais/total inteiros, conferência e remoção individual estável; PDV mostra condição/responsável/saldo do caixa antes de concluir, permite ir ao Caixa conservando rascunho e bloqueia consulta indisponível ou caixa alheio. Tela Caixa identifica operador e preserva a sessão aberta no recorte histórico. Mensagens dos módulos alterados ficaram legíveis; aviso de produto salvo agora permanece visível (restante de F5).

Financeiro dividido em Pagar, Receber e Resumo, com uma tarefa visível e consultas apenas da área ativa. Contas em aberto por padrão, cadastro de recebível sob demanda, contexto antes de baixar/estornar, busca sem acento, situação, vencidas, intervalo inclusivo, datas brasileiras e páginas de cinquenta na interface. Permissões, empresa, transações, auditoria e valores exatos preservados, sem migração de esquema.

Validação: 38 arquivos/147 testes de regras, 23 regressões de interface + quatro anteriores (27 distintas), tipagem, builds desktop/prévia e pacote aprovados. Dez grupos de percurso real no executável offline com base temporária: compra R$2,94, caixa/rascunho/fechamento posterior, venda, pagamentos/recebimentos/estornos, 55 contas abertas em duas páginas, filtros, isolamento e reabertura. Financeiro R$6,56 reconciliado com R$12,00 de dinheiro no caixa; operador e caixa alheio protegidos também por IPC. Evidência principal: artifacts/commerce-usability-1792341919145/result.json.

Pacote NEXO-Windows-1792341909772. ZIP NEXO-Windows-compras-caixa-financeiro-2026-10-18.zip: 1.079 arquivos, todos com SHA-256 idêntico ao pacote. Sem publicação nem dados reais. Limites: sem outro Windows limpo, leitor de tela ou volume empresarial; paginação de contas limita a interface, não a consulta SQLite. Relatório: [PURCHASES-CASH-FINANCE-2026-10-18.md](PURCHASES-CASH-FINANCE-2026-10-18.md).

Regressões complementares aprovadas no pacote final: carrinho/remoção de itens, navegação, tutorial em quatro aberturas e restauração administrativa com aviso no login. Ver relatório para os recibos.


## Versão para publicação — 18/10/2026

Publicação autorizada pelo usuário no repositório EduT3/nexo-gestao-comercial e no projeto Vercel nexo-gestao-comercial. A prévia agora reutiliza a estrutura do aplicativo Windows: compras com conferência de itens, orientação do caixa, histórico de vendas com detalhes/filtros/páginas e Financeiro em Pagar/Receber/Resumo. Os endereços públicos anteriores (#cash, #products e demais áreas) continuam disponíveis.

A ponte da demonstração usa somente exemplos fictícios em memória. Todas as operações comerciais de gravação, backup, restauração e acesso a arquivos são recusadas com aviso explícito; não há acesso à base SQLite do computador. Preferências do tutorial continuam restritas ao navegador. O produto operacional permanece o executável Windows.

Validação antes do envio: 39 arquivos/152 testes, tipagem/build geral e prévia aprovados; 23 regressões do aplicativo e seis verificações da prévia/isolamento/tutorial no Edge aprovadas. A aprovação dos casos Windows empacotados anteriores está registrada nos relatórios de recuperação/histórico e compras/caixa/financeiro. Esta publicação web não regenera o ZIP Windows.


## Programa portátil para download — v1.0.2, 18/10/2026

ZIP NEXO-Windows-v1.0.2.zip preparado para GitHub Releases, com o programa Windows e suas bibliotecas. O empacotamento da Zod agora exclui fontes, testes e declarações de tipos; os módulos executáveis e a licença permanecem incluídos. Sem bancos, credenciais, logs ou arquivos de desenvolvimento. A aplicação compilada corresponde ao código comercial de bec32c6; esta entrega altera o empacotamento e a documentação.

Verificação do ZIP: 505 arquivos, 172945265 bytes, todos com SHA-256 igual ao pacote após extração; 169 arquivos próprios do runtime iguais à compilação. SHA-256 do ZIP: dfd7ed9aae51ef230852cb485240b39099c408bf968d34d29d23f7714377d1e4.

Tipagem e build desktop aprovados. Programa extraído validado com janela oculta, contexto Chromium offline, LOCALAPPDATA temporário e PATH sem Node: 10 grupos de compras/caixa/financeiro e 12 grupos de recuperação/histórico, todos aprovados. Incluem persistência ao reabrir, 101 vendas em três páginas, cancelamento e negativos da restauração. Recibos locais: artifacts/commerce-usability-1792343991470/result.json e artifacts/recovery-history-1792344107662/result.json. Nenhuma base operacional foi aberta ou substituída. Mantêm-se os limites de homologação em outra máquina Windows limpa.

Download: https://github.com/EduT3/nexo-gestao-comercial/releases/download/v1.0.2/NEXO-Windows-v1.0.2.zip. Extraia tudo e abra NEXO.exe; preserve LOCALAPPDATA/NEXO ao atualizar.


## Paginação financeira SQLite — 19/10/2026

GOAL-04 implementado localmente sobre 95dca75: Pagar/Receber agora usam filtros, contagem e totais transacionais com páginas limitadas no serviço a cinquenta títulos; Resumo usa escalares globais exatos. Compatibilidade dos métodos antigos preservada, sem migração ou alteração comercial. Rascunhos e descarte de respostas antigas por empresa/filtro/página verificados.

Validação atual: 159 testes/40 arquivos, typecheck/build:local, 33 regressões distintas de navegador e 29 grupos no pacote extraído aprovados. Inclui todos os 10.000 títulos de cada tipo/empresa em snapshot imóvel, oráculo independente, negativas de perfil/limite, concorrência, recuperação/histórico e caixa. As evidências antigas de 152 testes/22 grupos permanecem históricas; não são recibo desta versão.

Medição em 100/1.000/10.000 títulos por tipo/empresa, mesmo hash de dados e protocolo fixado, com latências/volume/tamanho/inicialização registrados em [FINANCIAL-PAGINATION-2026-10-19.md](FINANCIAL-PAGINATION-2026-10-19.md). Orçamentos do ensaio atual aprovados. ZIP local: artifacts/NEXO-Windows-financeiro-paginado-otimizado-2026-10-19.zip; SHA e recibos no relatório. Sem commit/push/publicação ou atualização da instalação usada.

## Preparação revisável da próxima versão — 20/10/2026

Revisão em leitura do patch GOAL-04 e ZIP otimizado, preservando código, dados e instalação. GitHub revalidado: main/HEAD em 95dca75c60534cc0c84d02dc0f5ea1c7303ccd31 e última release v1.0.2. Proposta v1.0.3 e escopo exato de 28 arquivos em [RELEASE-PREPARATION-v1.0.3-2026-10-20.md](RELEASE-PREPARATION-v1.0.3-2026-10-20.md), com riscos, exclusões, rascunho das notas e checklist.

Verificado agora em cópia isolada: 159 testes/40 arquivos, tipagem/build desktop e prévia, 33 regressões de navegador e sete grupos financeiros no executável extraído aprovados. Os outros 22 grupos de recuperação/comércio do ZIP continuam evidência de 19/10; não reexecutados nesta revisão. Benchmark anterior apenas relido/conferido, sem nova coleta de latência. Os 513 arquivos do ZIP coincidem com a extração e os 56 arquivos próprios de um build limpo coincidem com o pacote, mas há 121 assets antigos extras (34.286.350 bytes descompactados). Preparar em staging vazio e validar novo ZIP antes de publicar; pacote original não foi corrigido/regenerado. Evidências em artifacts/release-preparation-2026-10-20. Sem commit/push/merge/publicação, instalação, alteração de configuração operacional ou dados reais. Windows limpo e atualização sintética para o candidato final permanecem gates da entrega.

### Continuação autorizada — candidato limpo, 20/10/2026

Após autorização de Eduardo, staging vazio com fontes/dependências existentes e empacotador original produziu `artifacts/NEXO-Windows-v1.0.3-candidato-limpo-2026-10-20.zip`: 392 arquivos, 164.003.000 bytes, SHA-256 `C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79`. Os 121 assets antigos foram excluídos por não existirem no staging novo; os 392 arquivos mantidos são idênticos aos do pacote anterior. Os 56 arquivos próprios coincidem com o build atual e toda a extração foi conferida por hash antes/depois dos testes.

Tipagem/build/empacotamento e **29 grupos no novo executável extraído** aprovados nesta continuação: sete financeiros, doze recuperação/histórico e dez comércio, com base/LOCALAPPDATA temporários, janela oculta, contexto offline e PATH sem Node. Os 159 testes e 33 regressões da revisão inicial não foram repetidos. Nenhuma mudança de código/configuração, instalação de dependências, commit/push/merge/publicação, deploy ou atualização da instalação; pacote/patch anteriores e dados reais preservados. Versão interna continua 0.1.0; v1.0.3 é proposta/candidato. Windows limpo e atualização sintética específica permanecem pendentes. Recibo `artifacts/clean-package-2026-10-20/validation-receipt.json`; documento de preparação atualizado com manifesto, resultados e limites.


## Qualificação sintética v1.0.2 → candidata limpa — 20/10/2026

Atualização local aprovada para o ZIP candidato imutável de SHA-256 C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79. Base criada na v1.0.2 pelas operações reais: duas empresas, administrador/operador, 202 vendas, 114 compras/títulos a pagar, 114 recebíveis, caixas/fechamentos e estornos. Oráculo independente de todas as 27 tabelas, esquema e linhas confirma B0 idêntico na candidata e após reabertura. Nova venda pela interface: total 1253 centavos/troco 747; delta de sete tabelas e repetição concorrente sem duplicação.

Backup, cancelamentos/falhas, restaurações B0/B1 com cópia anterior, falha após confirmação, recuperação de abertura autenticada e contingência da versão antiga em cópia anterior separada aprovados. Ambos os ZIPs e os 897 arquivos extraídos permaneceram idênticos; todos os arquivos preexistentes foram conferidos antes dos adendos documentais. Fonte/diff anterior, dependências, pacote e instalação não alterados; sem acesso à base operacional, commit/push/tag/release/deploy. Os 159 testes/33 regressões/29 grupos anteriores não foram recontados como testes desta entrega.

Evidências próprias e procedimento de atualização/retorno: [UPDATE-QUALIFICATION-v1.0.2-v1.0.3-2026-10-20.md](UPDATE-QUALIFICATION-v1.0.2-v1.0.3-2026-10-20.md), artifacts/update-qualification-2026-10-20/qualification.json e acceptance.json. Quatro ocorrências do roteiro, encerradas e corrigidas apenas no harness, estão documentadas. **Outro Windows limpo/diálogos manuais: pendente externo**, sem alvo separado fornecido; PATH mínimo não equivale a essa homologação. Qualificação sintética concluída; instalação e publicação continuam fora da rodada.


## Coerência da página financeira — 20/10/2026, rodada noturna

Corrigida uma falha de leitura no hook compartilhado: após a última página deixar de existir (51 → 50 ou zero contas), a próxima atualização passa a usar a página efetiva devolvida pelo serviço. Antes, ao voltar a 51 contas, Pagar/Receber saltavam indevidamente à página 2. Quatro regressões novas falharam antes e passaram depois. Sem alteração de contratos, dinheiro, SQL, transações ou permissões.

Validação desta unidade: 31 regressões de interface compilada (27 existentes + 4 novas), seis testes focados, tipagem e build de interface em pasta isolada aprovados. Ensaio ampliado em desenvolvimento apresentou 11 falhas ligadas às contagens/índices de consultas dos testes antigos; recibos preservados e contraste com modo compilado no [relatório](FINANCIAL-PAGE-COHERENCE-2026-10-20.md). Sem dados reais, package/instalação/publicação ou nova campanha de atualização. **Esta fonte não integra o ZIP candidato anterior**, mantido com SHA C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79. Outro Windows limpo continua pendente.


## Resumo financeiro em falha de leitura — 20/10/2026, segunda unidade noturna

Corrigida retenção de totais anteriores após erro ao atualizar o resumo financeiro acumulado. A interface agora diferencia consulta/falha/sucesso, retira valores antigos, apresenta alerta e permite Tentar novamente pelo canal local existente. Recuperação por teclado e erro da empresa atual com resposta atrasada de outra empresa verificados, sem chamadas de gravação.

Dois testes novos falharam antes e passaram depois; 33 regressões de interface compilada (31 anteriores + 2 novas), seis testes focados, tipagem e build de interface em pasta separada aprovados. Hook de paginação da unidade 1 preservado. Sem mudanças em dinheiro, SQL, IPC, segurança ou dados reais. **A fonte não integra o ZIP candidato anterior**, mantido com SHA C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79; sem pacote/publicação/instalação. Windows limpo permanece pendente. Relatório: [FINANCIAL-SUMMARY-READ-ERROR-2026-10-20.md](FINANCIAL-SUMMARY-READ-ERROR-2026-10-20.md).


## Nova tentativa de leitura em Pagar/Receber — 20/10/2026, terceira unidade noturna

Adicionado controle compartilhado Tentar novamente junto ao erro de consulta de Pagar e Receber, reutilizando requests.refresh. Visível apenas no erro, protegido por busy/loading; pager de zero resultados não aparece como resultado válido quando a leitura falha. Operações, filtros, seleção, chaves, hook e backend não alterados.

Quatro percursos novos falharam antes por falta do botão e passaram depois; **37 regressões de interface compilada (33 anteriores + 4 novas)**, seis testes focados, tipagem e build isolado aprovados. Retry por teclado, falha persistente, mesma empresa/filtro/página e descarte de resposta atrasada de outra empresa verificados sem IPC de mutação. Unidades 1/2 e seus recibos preservados. Fonte nova não integra o ZIP candidato anterior, mantido com SHA C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79; sem pacote/publicação/instalação, Windows limpo pendente. Relatório: [FINANCIAL-ACCOUNT-READ-RETRY-2026-10-20.md](FINANCIAL-ACCOUNT-READ-RETRY-2026-10-20.md).


## Foco ao cancelar operação financeira — 20/10/2026, quarta unidade noturna

Confirmada e corrigida perda de foco para BODY ao cancelar pelo teclado em Pagar/Receber. Somente o cancelamento explícito agora foca o botão que abriu a operação ou, se removido pela consulta, o título existente da lista. Nenhuma alteração nas funções save, em baixa/estorno/sucesso, chaves, seleção, filtros, regras ou dados.

Quatro testes novos falharam antes e passaram depois; **41 regressões de UI compilada (37 anteriores + 4 novas)**, seis testes focados, tipagem e build isolado aprovados. Tab/Enter/Voltar, origem existente/removida, empresa correta e ausência de IPC de mutação verificados. Três unidades anteriores preservadas. Fonte nova fora do ZIP candidato anterior, que permanece íntegro; sem pacote/publicação/instalação. Windows limpo continua pendente. Relatório: [FINANCIAL-CANCEL-FOCUS-2026-10-20.md](FINANCIAL-CANCEL-FOCUS-2026-10-20.md).


## Consulta financeira após erro/cancelamento — 21/10/2026

Reproduzidos quatro travamentos de leitura em Pagar/Receber: uma operação invalida a consulta pendente e, ao falhar ou ter confirmação de estorno cancelada, faltava nova leitura. A atualização existente foi movida para finally nos dois formulários; filtros, rascunhos, mensagens e chamadas de negócio mantidos. A consulta antiga continua descartada; nenhuma gravação é repetida automaticamente.

Quatro regressões falharam antes e passaram depois; **45 testes de interface compilada (41 anteriores + 4 novos)**, seis testes focados existentes, tipagem e builds de interface isolados aprovados. Testes usam somente IPC fictício, sem banco/negócios reais; sem execução Electron/pacote. Baseline de 267 arquivos e recibo em artifacts/financial-interrupted-read-2026-10-21. Primeira criação foi negada pelo contexto restrito; repetição pelo fluxo require_escalated explicitamente instruído foi permitida, sem mudar permissões persistentes. Fonte nova fora dos ZIPs preservados e do manifesto de publicação anterior, que precisa ser requalificado. Sem pacote/instalação/publicação. Relatório: [FINANCIAL-INTERRUPTED-READ-2026-10-21.md](FINANCIAL-INTERRUPTED-READ-2026-10-21.md).


## Candidato Windows da fonte atual — 22/10/2026

Fonte vigente conferida por hashes, congelada e construída em pasta nova com dependências existentes. Candidato local artifacts/windows-candidate-2026-10-22/NEXO-Windows-candidato-2026-10-22.zip, **164003225 bytes, 392 arquivos, SHA-256 63802B66B91FFEE63E20786A2EEDC5265A49F6C2ED7A3C7089C371B3153C95BA**. Versão interna 0.1.0 preservada; código funcional não alterado. Build da interface idêntico ao validado em 21/10, sem repetir as 45 UI/seis focados.

Agora executados e aprovados **29 grupos no novo executável extraído** (7 financeiros, 12 histórico/recuperação, 10 comércio), mais **sete fases/23 verificações de atualização sintética v1.0.2 → este candidato**, com oráculo independente de 27 tabelas, nova venda, idempotência, backup/restauração/recuperação e contingência separada. Tipagem/build desktop, todos os arquivos do ZIP/extração e imutabilidade posterior aprovados. Duas ocorrências só de harness corrigidas e registradas; nenhum bug funcional novo encontrado. Fonte/correções e 13 ZIPs antigos preservados. Perfis/bases sintéticos novos removidos após os recibos. Sem publicação/instalação/dados reais. Windows limpo e diálogos manuais continuam pendentes externos. [Relatório completo](CANDIDATO-WINDOWS-2026-10-22.md).


## Excel: arquivo inválido e validação do fluxo — 22/10/2026

Reproduzido no candidato congelado: arquivo de texto com extensão XLSX preservava o banco, mas exibia erro interno em inglês/link técnico. Fonte corrigida minimamente: parser orienta usar XLSX válido/modelo NEXO e o componente aplica errorMessage aos erros. Nenhuma regra de importação/exportação ou autorização alterada. Duas regressões falharam antes e passaram depois; **cinco testes em três arquivos**, tipagem/build isolado e **11 grupos nativos na fonte compilada corrigida** aprovados, cobrindo cancelamentos, prévia, formatos inválidos, duplicidade, centavos/milésimos, exportação de oito abas, isolamento e reabertura. Uma tentativa do harness parou por seletor exato; corrigido apenas o roteiro e preservada a evidência.

O ZIP 63802B66B91FFEE63E20786A2EEDC5265A49F6C2ED7A3C7089C371B3153C95BA e seus 392 arquivos permanecem íntegros e **não incluem esta correção posterior**. Nenhum novo pacote/publicação/instalação foi feito; fonte exige nova qualificação antes de distribuir. Dados/perfis sintéticos removidos após os testes; dados reais e cinco correções financeiras preservados. Windows limpo/diálogos manuais pendentes externos. [Relatório e limites](EXCEL-VALIDATION-2026-10-22.md).


## Identificação de build em Ajuda/Sobre — 22/10/2026

Implementada na fonte identificação gerada dos bytes compilados/runtime, com versão NEXO **0.1.0** preservada, data e ID verificáveis. Ponte nova somente leitura/sem argumentos; metadados ausentes ou inválidos mostram identificação indisponível sem impedir abertura, uso, reabertura ou recuperação. Empacotador confere manifesto e recusa arquivos alterados após build. Nenhuma alegação de commit, assinatura ou homologação.

**Nove testes novos + 19 regressões**, tipagem/build desktop/web e **sete grupos nativos** aprovados. Build ensaiado: NEXO-64467B6F30C28A65, gerado 2026-10-22T21:07:19.150Z. Teste nativo usou layout interno do app e runtime existente, sem produzir pacote portátil/ZIP; candidato 63802B66… permanece íntegro e anterior à correção Excel e a esta unidade. A simulação de escala CSS (931 px em viewport900) foi preservada como diagnóstico, sem classificá-la como defeito/aceite de zoom nativo. Complemento por setContentSize/setZoomFactor aprovou conteúdo900×650 em fatores1/2 e1440×1000 em fator2, sem transbordamento e com foco/legibilidade de Sobre; nenhuma mudança de CSS/OS/DPI. Sem dados reais, instalação ou publicação. [Relatório e escopo](BUILD-IDENTIFICATION-2026-10-22.md).


## Candidato atualizado com Excel e identificação — 22/10/2026

Novo ZIP **NEXO-Windows-candidato-atualizado-2026-10-22.zip**, 164024818bytes/395arquivos, SHA-256 **FB96E2AFDB29DE21E4D7B44CC62745A07EA23FAB8B7E8E96ED928E805231D65C**. Incorpora as cinco correções financeiras, orientação de XLSX inválido e Sobre o NEXO. Versão interna0.1.0; ID NEXO-64467B6F30C28A65; gerado2026-10-22T21:40:40.461Z.

Build, 28 testes locais, 45 UI com ponte sintética, campanhas nativas de núcleo(7/12/10 grupos), Excel(11), identificação em cópia descartável(7), zoom nativo no executável principal(3) e atualização sintética específica(7 fases/23 verificações, 27tabelas) aprovados. Arquivo/extração/fonte congelada conferidos após os testes. Quatorze ZIPs antigos preservados; dados/perfis sintéticos desta etapa removidos após recibos. Sem mudança funcional nesta unidade, instalação, dados reais ou publicação. Windows separado, diálogos manuais e Excel manual permanecem pendentes externos. [Relatório, evidências e limites](CANDIDATO-WINDOWS-ATUALIZADO-2026-10-22.md).


## Históricos paginados de compras e caixa — 23/10/2026

Implementadas consultas/telas com busca, período e páginas de50, contagem na mesma transação autorizada e desempate data/ID. Sessão ativa e ações separadas do histórico; somas/fechamentos restritos aos IDs consultados. Serviços comerciais/esquema/dependências preservados. APIs legadas ainda mantêm LIMIT100 por compatibilidade; as telas usam três canais novos de leitura.

Validação desta entrega:10 testes SQLite (6 novos/4 regressões),7 da prévia,51 casos distintos de Edge com ponte fictícia (49 na suíte e2 corrigidos em ensaio direcionado),10 grupos reais no executável extraído e capturas nativas de leitura. Compra, movimento/fechamento/abertura, perfis/empresas e reabertura com oráculo de27 tabelas conferidos. Falhas de roteiro e build acidental no dist de desenvolvimento registradas; candidato final construído em staging novo.

Candidato **NEXO-Windows-historicos-2026-10-23.zip**,164029662bytes/399arquivos, SHA-256 **7E5EB5587B6B3CCDC23353C423BC173DEE220318048A813DAE9C6285A0562143**, versão0.1.0, build **NEXO-F0ED4E26FEC6F090**, gerado2026-10-23T18:58:26.203Z. Quinze ZIPs anteriores preservados. Fonte aplicada e candidato local; instalação/base de uso não atualizadas. Processos próprios encerrados, dados/perfis sintéticos removidos após recibos. Sem publicação. Windows separado e validações manuais continuam externos. [Relatório e limites](HISTORICOS-PAGINADOS-2026-10-23.md).


## Resumo diário: limites de data — 26/10/2026

Correção somente na fonte de `getLocalDailyReport`: limites SQL em UTC canônico, preservando `period`, autorização/transação e BigInt. Frações adicionais são tratadas na grade de milissegundos sem incluir/excluir registros por truncamento. Cinco regressões falharam antes; delta final com nove testes SQLite e duas tipagens aprovado. Bases fictícias novas, snapshots sem mutação e conexões fechadas; negativos anteriores preservados.

Fonte corrigida ainda não empacotada. BEFA e harness antigos intactos; nenhum build/ZIP/publicação ou dado operacional alterado. QA visual e homologação Windows anteriores continuam pendentes independentes. Evidências, método, hashes e limites em [DAILY-REPORT-PERIOD-2026-10-26.md](DAILY-REPORT-PERIOD-2026-10-26.md).


## Candidata de teste com correção de datas — 27/10/2026

Build isolado0.1.0 **NEXO-E6C849C38EF8B8E7** e ZIP de teste separados;400 arquivos extraídos conferidos. Nove regressões aprovadas usando o SQLite do NEXO.exe extraído em modoNode, mais quatro verificações de persistência/reabertura da mesma base fictícia,27tabelas invariantes e integridade/FK aprovadas. Não é nova alteração funcional.

Após revisar os destinos efetivamente usados, o ensaio nativo/IPC passou em sete grupos e duas aberturas no mesmo perfil fictício, ambas encerradas0; identidade, caminhos e27tabelas preservados. Preflight e negativos de preparação anteriores mantidos. QAvisual não executada. Não abrir o executável em ambiente padrão; instruções de teste acompanham o ZIP. Sem instalação, atualização operacional ou publicação; antigos preservados. O ZIP parcial inicial de metadados não é a entrega. SHA,caminhos,ocorrências e limites em [CANDIDATA-DATAS-2026-10-27.md](CANDIDATA-DATAS-2026-10-27.md).


## Unidade de produto após movimentação — 29/10/2026

Corrigida na camada local a troca de unidade que reinterpretava o estoque/histórico sem conversão. Agora é recusada após qualquer movimento, inclusive saldo zerado; produto sem histórico e edição mantendo a unidade continuam permitidos. Pedido misto é recusado por inteiro antes de produto/categoria/auditoria; empresa/ADMIN mantidos. Excel continua ignorando duplicados sem alterar unidade existente.

Cinco regressões reproduziram a falha;14 testes SQLite nos bytes compilados finais (9 novos +5 pertinentes), tipagem e compilação isolada aprovados. Snapshot27 tabelas, ordem concorrente na mesma fila, cancelamento/reabertura e valores exatos verificados. Erro inicial em duas assertivas de tipagem dos testes corrigido, recibos preservados. Candidata por fonte congelada/48 compilados e manifesto, sem novo ZIP. E6/BEFA,30 ZIPs, dist e fixture anteriores preservados; instalação/dados reais não alterados. Sem IPC/navegador/EXE nesta unidade, publicação ou reabertura da investigação de sockets/CIM. A correção ainda não integra a E6 ou versão em uso. [Relatório e limites](PRODUCT-UNIT-GUARD-2026-10-29.md).


## Qualificação IPC da unidade — 29/10/2026

Layout nativo de TESTE NEXO-C271C996BAB58331, separado, com catálogo corrigido e somente esse delta funcional frente àE6. Electron44.4.1/Node24.21.0/SQLite3.53.4, sandbox/preload/bootstrap originais e destinos efetivos novos conferidos. Dez grupos IPC, oito recusas com27 tabelas invariantes,25 snapshots, compra127/venda289centavos e1255milésimos, saldozero e mesma base após fechar/reabrir aprovados. Ambos os processos da campanha encerraram0.

Duas falhas de identificação do harness anteriores às operações foram corrigidas somente na bancada, com negativos/perfis preservados e processos também encerrados0. Sem fonte funcional alterada,14 testes repetidos, aceite visual ou novo ZIP. Candidata fonte334, E6/BEFA,30 ZIPs e2414 arquivos protegidos intactos; instalação/dados reais não alterados, sem publicação. [Relatório e limites](PRODUCT-UNIT-IPC-2026-10-29.md).


## Build manual sem senha — 10/11/2026

A pedido do usuário, cópia temporária em artifacts/teste-sem-senha-2026-11-10: primeiro acesso pelo nome e seleção de usuário sem senha; cadastro de operadores sem senha, mantendo ADMIN/OPERADOR, empresas e auditoria. Fonte padrão e bases anteriores preservadas. Iniciador Abrir NEXO sem senha.cmd usa perfil manual novo; bootstrap recusa perfis externos. Tipagem, compilação local/frontend e10 verificações de IPC/DOMlogin com reabertura aprovadas, zero credenciais; dois processos QA encerrados0. Perfil manual segue vazio. Erro inicial de staging sem index.html corrigido e log preservado. Sem aceite visual/teclado, adaptação da recuperação autenticada, instalação ou publicação. Recibo e diff dentro da pasta desta build.


## Produtos e estoque unificados — 10/11/2026

Interface com Início simples e uma única área para produtos/saldo/cadastro/entrada/movimentos, fornecedor inline e retorno do cadastro à entrada com rascunho preservado. Tutorial local opt-in, linguagem curta e5destinos principais. APIs/regras comerciais e autenticação padrão preservadas; build de teste mantém entrada por nome.

Treze casos distintos aprovados (cinco do helper conferidos novamente no final), tipagem/build isolado e oito grupos funcionais no Electron com estoque/empresa/perfil/reabertura aprovados. Build final NEXO-14069FB7D29BC736 limpo e smoke encerrado0; captura visual bloqueada por timeout, sem aceite visual. Negativos e versões anteriores preservados. Novo iniciador Abrir NEXO Produtos e Estoque.cmd usa o mesmo perfil manual sem lê-lo/alterá-lo durante o trabalho. [Resultado, limites e instruções](PRODUTOS-ESTOQUE-SIMPLES-2026-11-10.md).


## 10/11/2026 — áreas distintas e participantes opcionais

Build local de testes NEXO-56709C9338DD6A58: blocos/cores do Bolsário, atalhos entre áreas com rascunho preservado, fornecedor opcional real e identificação de cliente secundária. SQLite12 com backup automático antes da atualização; versões anteriores não leem a base12.38 testes dirigidos aprovados, atualização nativa11→12 preservando27 tabelas, compra/venda reais em perfil fictício e reabertura conferidas. Capturas nativas inspecionadas; aceite humano de usabilidade pendente. Perfil manual preservado durante os testes; entrada por nome mantida só nesta build. Sem publicação/instalação. Iniciador: `artifacts/teste-sem-senha-2026-11-10/Abrir NEXO Rotinas Simples.cmd`. Evidências e retorno seguro: [ROTINAS-SIMPLES-2026-11-10.md](ROTINAS-SIMPLES-2026-11-10.md).


## 10/11/2026 — revisão final e ZIP portátil

ZIP da build NEXO-56709C9338DD6A58 gerado sem dados pessoais/código-fonte. Executável extraído passou12grupos de integração (compra/venda/cancelamento/pagamento/estorno/caixa/backup/Excel/reabertura),46testes em19arquivos e tipagem aprovados. Capturas atuais inspecionadas; início conferido a1280/900px. Nenhum defeito do aplicativo encontrado no recorte; iniciador cria perfil novo na pasta extraída.403arquivos conferidos byte a byte após extração/QA; SHA256 `A9E652E74AED2E131A58D2C4BE5BCB98A52F746FB3B1246BDA5670C937BC0D10`. Sem publicação/instalação; Windows limpo e diálogos manuais não homologados. Evidências, imagens e instruções: [REVISAO-ZIP-2026-11-10.md](REVISAO-ZIP-2026-11-10.md).

### Candidata Windows 1.0.3

A candidata Windows 1.0.3 inclui o botão Verificar atualização em Configurações. O botão abre as versões do repositório privado no navegador. A entrada de estoque mantém a ação de salvar visível durante a rolagem. Os ícones de editar, inativar, reativar e remover têm rótulos acessíveis.

## Auditoria da candidata 1.0.5

Instalação sobre a 1.0.4, persistência, recuperação e benchmarks registrados em [Auditoria Windows](AUDITORIA-WINDOWS.md).

## NEXO Guard M1

A candidata inclui configuração opcional do Guard, PIN de quatro dígitos, autorização de uso único no processo principal e chave individual de recuperação. A validação Windows segue na execução https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43500559656.


### Guard — autorização pendente e validação

A revisão `0f29d10` impede que alteração da política dispense o PIN de uma solicitação já protegida. A suíte local passou 235 testes em 53 arquivos na revisão `8fc6036`. A execução Windows [43533630029](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43533630029), incluindo duas dimensões para a interface do Guard, está em andamento; o instalador dessa revisão ainda não foi homologado. Detalhes e limitações: [NEXO-GUARD.md](NEXO-GUARD.md).


### Guard — candidata Windows verificada

A execução [43534470859](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43534470859) aprovou 235 testes, o instalador e o roteiro em dados fictícios. Trocas de usuário e de empresa invalidaram pedidos pendentes; as capturas da configuração e do teclado foram inspecionadas em duas dimensões. Candidata vinculada à revisão `0ec218d`; sem merge ou release estável. Detalhes e limites em [NEXO-GUARD.md](NEXO-GUARD.md).


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
