# NEXO — roadmap da versão local Windows

## Etapa 1 — Programa local utilizável · concluída

- [x] Electron + React/TypeScript sem servidor HTTP.
- [x] SQLite em `%LOCALAPPDATA%\NEXO`, fora da instalação e do OneDrive.
- [x] primeiro acesso, senha local, seleção explícita de empresa e persistência após reabrir.
- [x] produtos, categorias, clientes e fornecedores separados por empresa.
- [x] backup consistente, restauração validada e cópia do estado anterior.
- [x] pacote autocontido que abre sem Node.js, banco ou internet.

## Etapa 2 — Operação comercial · concluída

- [x] compra, entrada de estoque e conta a pagar na mesma transação.
- [x] abertura, suprimento, sangria e fechamento de caixa por operador.
- [x] venda com desconto, pagamento, troco, estoque, caixa e financeiro atômicos.
- [x] cancelamento de venda, pagamento/recebimento e estornos compensatórios.
- [x] idempotência, rollback, valores exatos e histórico imutável.
- [x] isolamento entre Adega JG e Depósito JG.
- [x] perfis Administrador e Operador validados na camada local.

## Etapa 3 — Excel, consultas e usabilidade · concluída

- [x] saldo e histórico paginado de estoque.
- [x] contas a pagar e receber e resumo financeiro consolidado.
- [x] resumo diário por data, forma de pagamento e produto.
- [x] modelo Excel e importação de produtos com prévia, erros e duplicidades.
- [x] exportação Excel de produtos, estoque, vendas, contas e financeiro.
- [x] navegação local com atalhos de módulos, empresa e estado offline visíveis.

## Etapa 4 — Entrega · concluída em 18/09/2026

- [x] pacote executável `NEXO-Windows-1789781786817` com instruções atualizadas.
- [x] atualização simulada da versão anterior para a atual preservando a base temporária.
- [x] ciclo comercial completo, backup/restauração, operador, relatórios e Excel verificados no pacote.
- [x] prévia web fictícia, identificada e somente leitura compilada sem servidor de produção.
- [x] README, arquitetura, riscos, status e instruções alinhados à versão local.

## Limites mantidos

Um computador por instalação, sem sincronização em rede/nuvem. Emissão fiscal, integrações bancárias, e-commerce, delivery, CRM, BI avançado e inteligência artificial ficam fora da V1. O pacote não possui instalador tradicional nem assinatura digital; a homologação no computador operacional continua sendo uma etapa de implantação, sem uso de dados reais nos testes automatizados.


## Correções após reavaliação — 18/10/2026

- [x] F1: recuperação independente da abertura da base, com preservação dos arquivos anteriores.
- [x] F2: histórico de vendas identificável, detalhado e paginado acima de cem registros.
- [x] F3: conferência de compras, totais e remoção individual de item.
- [x] F4: condição do caixa no PDV e mensagens legíveis nas áreas corrigidas.
- [x] F5: confirmação visível de produto salvo e de restauração no login.
- [x] F6: Pagar/Receber/Resumo separados, com filtros e datas brasileiras.
- [ ] Manutenção: identificação interna de versão/build, extração adicional de LocalApp e contratos centrais.
- [ ] Crescimento: medir bases grandes e evoluir consultas/paginação SQL dos demais históricos.

Evidências e limites em RECOVERY-HISTORY-2026-10-18.md e PURCHASES-CASH-FINANCE-2026-10-18.md. A nova organização operacional foi entregue no Windows e publicada na demonstração web em 18/10/2026. O pacote portátil v1.0.2 está preparado para download no GitHub Releases.


## Consultas financeiras — GOAL-04, 19/10/2026

- [x] Medir 100/1.000/10.000 títulos por tipo/empresa com método e orçamento fixados.
- [x] Filtros, limite, contagem, total exato e ordenação determinística em snapshot SQLite por chamada.
- [x] Preservar contratos antigos, operações/auditoria, rascunhos e isolamento de respostas.
- [x] Verificar oráculo, concorrência, permissões, todas as páginas e pacote extraído.
- [ ] Medir bases maiores e evoluir outros históricos/cadastros, separadamente.

Resultados: [FINANCIAL-PAGINATION-2026-10-19.md](FINANCIAL-PAGINATION-2026-10-19.md). Etapa somente local; GitHub/release/Vercel mantidos. Identificação de build e instalador assinado continuam no backlog.


## Aceite de atualização sintética — 20/10/2026

- [x] Qualificar v1.0.2 → candidata limpa de SHA C812A44FC7E24C0C55E9F285E5774E16802FE0EE00C57D395C6A8DDF0DF4DB79, com base criada pela versão antiga, oráculo completo, duas empresas/perfis/históricos e persistência.
- [x] Validar venda nova, idempotência, backup/restore com cancelamento/falha/cópia anterior e recuperação autenticada.
- [x] Qualificar contingência sobre backup anterior separado, preservando a base nova; registrar procedimento e aceite.
- [x] Conferir imutabilidade dos ZIPs/extratos, preservar fonte e diff preexistentes; sem publicação/instalação.
- [ ] Checkpoint externo: outro Windows limpo e diálogos manuais, ou decisão humana explícita sobre esse limite antes de distribuir. Nenhum alvo separado foi fornecido.

Ver [UPDATE-QUALIFICATION-v1.0.2-v1.0.3-2026-10-20.md](UPDATE-QUALIFICATION-v1.0.2-v1.0.3-2026-10-20.md). Qualificação sintética aprovada não representa atualização da instalação ou autorização de release.


## Candidato Windows atual — 22/10/2026

- [x] Congelar fonte vigente com as cinco correções financeiras e construir desktop em staging novo.
- [x] Criar candidato por data, conferir os 392 arquivos e manter versão interna 0.1.0.
- [x] Qualificar o executável extraído: 29 grupos e atualização sintética específica em sete fases/23 verificações.
- [x] Preservar fontes/pacotes anteriores e remover somente perfis/dados sintéticos desta campanha.
- [ ] Gate externo: Windows separado sem ferramentas de desenvolvimento e diálogos manuais.
- [ ] Decisão humana específica para distribuição/atualização operacional; nenhuma publicação automática.

Evidências e SHA do candidato atual em [CANDIDATO-WINDOWS-2026-10-22.md](CANDIDATO-WINDOWS-2026-10-22.md). Os aceites e manifestos dos candidatos anteriores continuam associados aos respectivos arquivos.


## Identificação de compilação — 22/10/2026

- [x] Versão NEXO real, data e identificador derivados do manifesto, disponíveis em Ajuda/Sobre.
- [x] Fallback para ausência/corrupção, ponte somente leitura e conferência no empacotamento.
- [x] Nove testes novos, 19 regressões, builds e sete grupos nativos.
- [ ] Gerar/qualificar candidato atualizado com a correção Excel e a identificação, em etapa separada.
- [x] Distinguir escala CSS de zoom nativo: conteúdo900×650 em fatores1/2 e1440×1000 em fator2 conferidos pelas APIs reais, sem transbordamento. O diagnóstico CSS de31px não foi usado para propor alteração de layout.
- [ ] Windows separado, diálogos manuais e decisão de distribuição continuam externos.

Ver [BUILD-IDENTIFICATION-2026-10-22.md](BUILD-IDENTIFICATION-2026-10-22.md). Nenhum pacote ou publicação foi produzido por esta unidade de código.


## Candidato atualizado com Excel e identificação — 22/10/2026

Novo ZIP **NEXO-Windows-candidato-atualizado-2026-10-22.zip**, 164024818bytes/395arquivos, SHA-256 **FB96E2AFDB29DE21E4D7B44CC62745A07EA23FAB8B7E8E96ED928E805231D65C**. Incorpora as cinco correções financeiras, orientação de XLSX inválido e Sobre o NEXO. Versão interna0.1.0; ID NEXO-64467B6F30C28A65; gerado2026-10-22T21:40:40.461Z.

Build, 28 testes locais, 45 UI com ponte sintética, campanhas nativas de núcleo(7/12/10 grupos), Excel(11), identificação em cópia descartável(7), zoom nativo no executável principal(3) e atualização sintética específica(7 fases/23 verificações, 27tabelas) aprovados. Arquivo/extração/fonte congelada conferidos após os testes. Quatorze ZIPs antigos preservados; dados/perfis sintéticos desta etapa removidos após recibos. Sem mudança funcional nesta unidade, instalação, dados reais ou publicação. Windows separado, diálogos manuais e Excel manual permanecem pendentes externos. [Relatório, evidências e limites](CANDIDATO-WINDOWS-ATUALIZADO-2026-10-22.md).

- [x] Gerar e qualificar candidato atualizado com Excel e identificação, incluindo o próprio ZIP nas campanhas nativas e de atualização.
- [ ] Homologar em outro Windows e executar diálogos/Excel manuais.
- [ ] Decisão específica sobre publicação/distribuição e atualização operacional.


## Históricos paginados de compras e caixa — 23/10/2026

Implementadas consultas/telas com busca, período e páginas de50, contagem na mesma transação autorizada e desempate data/ID. Sessão ativa e ações separadas do histórico; somas/fechamentos restritos aos IDs consultados. Serviços comerciais/esquema/dependências preservados. APIs legadas ainda mantêm LIMIT100 por compatibilidade; as telas usam três canais novos de leitura.

Validação desta entrega:10 testes SQLite (6 novos/4 regressões),7 da prévia,51 casos distintos de Edge com ponte fictícia (49 na suíte e2 corrigidos em ensaio direcionado),10 grupos reais no executável extraído e capturas nativas de leitura. Compra, movimento/fechamento/abertura, perfis/empresas e reabertura com oráculo de27 tabelas conferidos. Falhas de roteiro e build acidental no dist de desenvolvimento registradas; candidato final construído em staging novo.

Candidato **NEXO-Windows-historicos-2026-10-23.zip**,164029662bytes/399arquivos, SHA-256 **7E5EB5587B6B3CCDC23353C423BC173DEE220318048A813DAE9C6285A0562143**, versão0.1.0, build **NEXO-F0ED4E26FEC6F090**, gerado2026-10-23T18:58:26.203Z. Quinze ZIPs anteriores preservados. Fonte aplicada e candidato local; instalação/base de uso não atualizadas. Processos próprios encerrados, dados/perfis sintéticos removidos após recibos. Sem publicação. Windows separado e validações manuais continuam externos. [Relatório e limites](HISTORICOS-PAGINADOS-2026-10-23.md).

- [x] Históricos de compras/caixa completos por consulta paginada, busca e período; sessão ativa independente.
- [x] SQLite, UI, IPC/executável e reabertura na candidata específica.
- [ ] Homologação externa Windows/manual e decisão específica de distribuição.


## Integridade da unidade do produto — 29/10/2026

- [x] Recusar troca de unidade após movimentação, mesmo com saldo zero, no serviço local autorizado e na mesma transação.
- [x] Preservar edição sem histórico, mesma unidade, empresa/perfil, valores exatos e Excel sem sobrescrita de duplicados.
- [x] Reprodução da falha,14 testes contra compilado final, tipagem e candidata de fonte/runtime isolados.
- [ ] Empacotar e qualificar esta mudança em runtime/IPC Windows e eventual UI real antes de distribuição.

Fonte aplicada; candidatas antigas e instalação preservadas. [Evidências](PRODUCT-UNIT-GUARD-2026-10-29.md).


## IPC nativo da unidade — 29/10/2026

- [x] Montar layout de teste próprio com runtime existente e compilados finais, preservando E6/BEFA/candidata aceita.
- [x] Identificar payload/appPath/preload/catálogo e provar isolamento efetivo e segurança antes das operações.
- [x] Qualificar pela ponte real a regra com/sem histórico, saldozero, edição usual,27 tabelas, empresa/perfil/sessão e reabertura do mesmo perfil.
- [x] Preservar negativos e encerrar processos próprios; sem mudança funcional ou novo ZIP.
- [ ] Aceite visual/diálogos/Windows separado e decisão específica de distribuição.

[Resultado nativo e limites](PRODUCT-UNIT-IPC-2026-10-29.md). O ZIP E6 e a instalação em uso continuam anteriores a esta regra.


## Uso simples: produtos e estoque — 10/11/2026

- [x] Início com tarefas claras, navegação curta e tutorial por escolha.
- [x] Cadastro/saldo/entrada em uma área, fornecedor inline e rascunhos preservados.
- [x] Tipagem/build isolado, helpers e fluxo funcional real de empresa/perfil/estoque/reabertura.
- [ ] Revisão visual/manual do usuário; captura automática ficou pendente por timeout.

[Entrega de teste e limites](PRODUTOS-ESTOQUE-SIMPLES-2026-11-10.md). Sem publicação ou mudança operacional.


## 10/11/2026 — áreas distintas e participantes opcionais

Build local de testes NEXO-56709C9338DD6A58: blocos/cores do Bolsário, atalhos entre áreas com rascunho preservado, fornecedor opcional real e identificação de cliente secundária. SQLite12 com backup automático antes da atualização; versões anteriores não leem a base12.38 testes dirigidos aprovados, atualização nativa11→12 preservando27 tabelas, compra/venda reais em perfil fictício e reabertura conferidas. Capturas nativas inspecionadas; aceite humano de usabilidade pendente. Perfil manual preservado durante os testes; entrada por nome mantida só nesta build. Sem publicação/instalação. Iniciador: `artifacts/teste-sem-senha-2026-11-10/Abrir NEXO Rotinas Simples.cmd`. Evidências e retorno seguro: [ROTINAS-SIMPLES-2026-11-10.md](ROTINAS-SIMPLES-2026-11-10.md).


## 10/11/2026 — revisão final e ZIP portátil

ZIP da build NEXO-56709C9338DD6A58 gerado sem dados pessoais/código-fonte. Executável extraído passou12grupos de integração (compra/venda/cancelamento/pagamento/estorno/caixa/backup/Excel/reabertura),46testes em19arquivos e tipagem aprovados. Capturas atuais inspecionadas; início conferido a1280/900px. Nenhum defeito do aplicativo encontrado no recorte; iniciador cria perfil novo na pasta extraída.403arquivos conferidos byte a byte após extração/QA; SHA256 `A9E652E74AED2E131A58D2C4BE5BCB98A52F746FB3B1246BDA5670C937BC0D10`. Sem publicação/instalação; Windows limpo e diálogos manuais não homologados. Evidências, imagens e instruções: [REVISAO-ZIP-2026-11-10.md](REVISAO-ZIP-2026-11-10.md).
