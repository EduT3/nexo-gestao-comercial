# NEXO — progresso local

17/09/2026. Evidências em STATUS.md; histórico em history/PROJECT_PROGRESS-local-foundation-log.md.

| Etapa | Estado | Evidência / pendência |
|---|---|---|
| 1 — Programa local | Implementação funcional; homologação pendente | Pacote testado: produtos nas duas empresas, manutenção, persistência e recuperação. Falta Windows limpo/diálogos manuais. |
| 2 — Comercial | Em preparação | Contratos/cálculos reutilizáveis; cadastros relacionados, login por operador e ciclo SQLite pendentes. |
| 3 — Excel/consultas | Pendente | XLSX/importação/relatórios locais não entregues. |
| 4 — Entrega final | Pendente | Homologação sem ambiente dev/offline e instruções dependem do ciclo completo. |

Pacote: artifacts/NEXO-Windows-1789687674150. Sem percentuais artificiais ou nova publicação externa.

Preparação comercial: schema2 aditivo para cadastros relacionados criado e migração/recuperação compatíveis iniciadas. Sem telas/operações desses cadastros; testes e janela aprovados, restorev1→v2 específico ainda pendente.

Cadastros relacionados: categorias na camadaSQLite com autorização/auditoria, teste isolamento/rollback aprovado. Recuperaçãov1→v2 validada sem alterar backup original. UI e vínculos ainda pendentes.

Cadastro/lista categorias na interface real validado na janela com isolamento e reabertura. Relação com produtos/manutenção e novo pacote pendentes.

Relação categoria/produtoSQLite validada com FKs compostas, preservação na edição e desvinculação. Schema3/backups anteriores e janela aprovados; seletor UI/novo pacote pendentes.

Categoria no formulário produto validada no pacote atualizado, com vínculo preservado após reabrir. Testes agora usam janela oculta para não interromper usuário. Demais escopo comercial/Excel/homologação pendentes.

Correção de evidência: primeiro teste oculto de pacote falhou na identificação do seletor. Build atual corrigido passou em execução oculta, vínculo preservado. Pacote aguarda regeneração com ajuste de acessibilidade.

Clientes/fornecedores SQLite/IPC criados/listados com regras existentes e auditoria atômica; 2 testes aprovados. UI e manutenção pendentes.

01/10/2026: estrutura de uso simplificada com uma tarefa por tela, formulários sob demanda e cadastros secundários em Mais opções. Tipos/builds e 114 testes aprovados; novo roteiro de navegação validado no pacote Windows, incluindo compra, venda e fechamento em base temporária.

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

18/10/2026: reavaliação atual de estrutura/funcionamento/usabilidade concluída com 123 testes, percurso offline e 13 capturas. Núcleo comercial consistente nos casos testados; priorizar recuperação em falha de abertura e histórico de vendas identificável/paginado, depois conferência de compras e clareza de mensagens/financeiro. Sem alterações funcionais ou publicação. Ver REASSESSMENT-2026-10-18.md.


18/10/2026: primeira etapa de correções da reavaliação entregue: recuperação independente da abertura da base, com senha da cópia/preservação dos originais, e histórico de vendas identificado, detalhado, filtrável e paginado. 136 testes, 20 regressões de navegador e 12 grupos no executável final aprovados offline com base temporária. Pacote NEXO-Windows-1792340357595 e ZIP de recuperação/histórico preparados. Demais prioridades permanecem em acompanhamento; sem publicação. Ver [RECOVERY-HISTORY-2026-10-18.md](RECOVERY-HISTORY-2026-10-18.md).


18/10/2026: segunda etapa de correções entregue: conferência/remoção individual de compras, orientação antecipada do caixa com rascunho preservado, Financeiro em Pagar/Receber/Resumo e mensagens visíveis/legíveis. 147 testes, 27 verificações distintas de navegador e dez grupos no pacote real aprovados, com bases fictícias. Pacote NEXO-Windows-1792341909772 e ZIP de compras/caixa/financeiro conferidos arquivo por arquivo. Sem alteração de esquema ou publicação. Ver [PURCHASES-CASH-FINANCE-2026-10-18.md](PURCHASES-CASH-FINANCE-2026-10-18.md).


18/10/2026: versão para publicação autorizada no GitHub/Vercel; demonstração alinhada à interface Windows com dados fictícios em memória e gravações bloqueadas. 152 testes e 29 verificações distintas de navegador aprovados. Endereços públicos preservados. ZIP Windows anterior não regenerado nesta entrega. Ver STATUS para escopo e validação.


18/10/2026: pacote portátil v1.0.2 preparado para download no GitHub. ZIP somente do programa e dependências, sem fontes/testes da biblioteca, bases ou credenciais. 505 arquivos conferidos após extração; 22 grupos de testes no executável extraído aprovados offline com dados temporários, incluindo reabertura e recuperação. Tipagem/build aprovados; detalhes e hash em STATUS.


19/10/2026: GOAL-04 concluído localmente: páginas/filtros/contagem/total exato no SQLite para Pagar e Receber, resumo escalar e leituras isoladas por contexto. 159 testes, 33 regressões de navegador e 29 grupos no pacote extraído aprovados. Benchmark antes/depois em 100/1.000/10.000 por tipo/empresa registrado, com oráculo e orçamento verificados. Nenhuma publicação ou acesso à base operacional. Ver FINANCIAL-PAGINATION-2026-10-19.md para medidas e limites; 152 testes/22 grupos anteriores são históricos.

20/10/2026: preparação da próxima versão, sem alteração de código ou publicação. Main/release revalidados: 95dca75/v1.0.2. Proposta v1.0.3 com escopo GOAL-04 de 28 arquivos, riscos, exclusões, notas e aceite em [RELEASE-PREPARATION-v1.0.3-2026-10-20.md](RELEASE-PREPARATION-v1.0.3-2026-10-20.md). Novas execuções isoladas aprovaram 159 testes, tipagem/builds, 33 regressões de navegador e sete grupos financeiros do pacote. Os outros 22 grupos do ZIP e as medições de desempenho permanecem históricos. ZIP/extratos íntegros, mas build limpo revela 121 assets antigos extras; necessário candidato em staging vazio e novo aceite antes de publicar. Pacote, mudanças preexistentes, instalação e dados operacionais preservados.

20/10/2026, continuação autorizada: candidato `NEXO-Windows-v1.0.3-candidato-limpo-2026-10-20.zip` preparado em staging vazio, sem mudar código/configuração. 392 arquivos/164.003.000 bytes; 121 assets antigos removidos e nenhum dos arquivos mantidos alterado. SHA-256 `C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79`. Tipagem/build/empacotamento e 29 grupos atuais no novo pacote extraído (7 financeiros + 12 recuperação/histórico + 10 comércio) aprovados com dados temporários; hashes do build e da extração conferidos. Evidências em `artifacts/clean-package-2026-10-20/validation-receipt.json` e documento de preparação atualizado. Os 159 testes/33 regressões são da revisão inicial, não repetidos nesta continuação. Pacotes/patch anteriores, dados e instalação preservados; sem publicação, deploy, commit ou instalação. Windows limpo, atualização sintética específica e versão interna 0.1.0 permanecem limites/gates.


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


## Consulta financeira após operação sem sucesso — 21/10/2026

Uma correção local: Pagar/Receber agora renovam a leitura invalidada mesmo após erro de operação ou confirmação de estorno cancelada. Quatro casos reproduzidos antes do patch; 45 regressões de UI compilada (41 existentes + 4 novas), seis testes focados, tipagem e builds isolados aprovados. Só respostas sintéticas, sem dados reais ou nova campanha de executável. Quatro correções anteriores preservadas; escopo/hash anterior de publicação precisa nova qualificação. ZIPs/instalação/produção não alterados. [Relatório e limites](FINANCIAL-INTERRUPTED-READ-2026-10-21.md).


## Candidato local atual qualificado — 22/10/2026

Gerado ZIP novo da fonte com as cinco correções financeiras de 20/21 de outubro, em staging vazio, sem instalar dependências ou renumerar a versão interna. 392 arquivos conferidos no ZIP/extração; tipagem/build desktop, 29 grupos nativos e sete fases/23 verificações de atualização sintética passaram para o SHA 63802B66B91FFEE63E20786A2EEDC5265A49F6C2ED7A3C7089C371B3153C95BA. Fonte funcional e pacotes anteriores preservados; nenhuma publicação ou atualização operacional. Outro Windows limpo/diálogos manuais permanecem externos. [Candidato, evidências e limites](CANDIDATO-WINDOWS-2026-10-22.md).


## Excel validado e orientação corrigida — 22/10/2026

Uma correção de usabilidade reproduzida no executável: erros de XLSX ilegível agora orientam em português e não mostram o prefixo interno do IPC. Dois casos novos vermelhos→verdes; cinco testes afetados, tipagem/build e 11 percursos nativos da fonte corrigida aprovados. Prévia, cancelamentos, inválidos, duplicidades, valores exatos, relatórios, isolamento e reabertura exercitados com arquivos/bases sintéticos. Candidato anterior e evidências preservados; **ZIP ainda sem esta correção e nova qualificação pendente**. Nenhum dado real, instalação ou publicação alterado. [Evidências e lacunas](EXCEL-VALIDATION-2026-10-22.md).


## Rastreabilidade da compilação — 22/10/2026

Ajuda e tutorial → Sobre o NEXO apresenta versão interna, data e ID derivados de manifesto dos arquivos preparados. Fallback explícito e API fixa somente leitura, com abertura/recovery normais. Nove testes novos, 19 regressões, tipagem/build desktop/web e sete grupos nativos aprovados. Fonte inclui Excel corrigido; novo candidato ainda precisa etapa própria de geração/qualificação. ZIP anterior, dados e recibos preservados; sem publicação. Diagnóstico CSS separado do zoom nativo: três cenários com tamanho real da janela e getZoomFactor passaram sem transbordamento; não foi mantida a classificação inicial de defeito nativo. [Evidências e limites](BUILD-IDENTIFICATION-2026-10-22.md).


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
