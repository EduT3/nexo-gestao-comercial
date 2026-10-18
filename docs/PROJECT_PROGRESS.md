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
