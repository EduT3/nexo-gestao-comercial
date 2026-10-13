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
