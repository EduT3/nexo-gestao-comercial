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
