# Engenharia NEXO — aplicativo local Windows

- Leia docs/GOAL.md, ROADMAP.md e STATUS.md. Objetivo vigente: SQLite local, uma instalação por computador, sem HTTP/servidor remoto na execução final.
- Reaproveite React, TypeScript, contratos/regras/testes úteis. Electron executa camada local via IPC limitado; contextIsolation e renderer sem Node. Legado Fastify/PostgreSQL é referência até adaptar os fluxos.
- Banco ativo fora de OneDrive/instalação, em LOCALAPPDATA/NEXO. Testes em bases temporárias. Migração empresarial somente sobre cópia com comparação antes de substituir.
- Empresa, vínculo e permissão conferidos na camada local a cada operação, não apenas no seletor. Não alegar proteção contra administrador do computador. Relações compostas preservam isolamento.
- Negócio e auditoria na mesma transação. Inativar/cancelar/estornar sem apagar histórico. Saldo muda com movimento. Dinheiro centavos inteiros; quantidades em milésimos inteiros; preços/custos históricos.
- Senhas/sessões fora de logs/localStorage. IPC não expõe SQL, caminhos arbitrários ou código ao renderer.
- Backup consistente e restore validado/confirmado com cópia anterior fazem parte da etapa 1. Excel é intercâmbio, não banco ou backup completo.
- Node 24 apenas desenvolvimento; usuário final não deve instalá-lo. Use npm.cmd. Tipagem/testes/build pertinentes e pacote Windows verificado.
- Prévia web fictícia sem base real ou sucesso simulado. Não publicar versões novas sem solicitação.
- Atualize STATUS/PROJECT_PROGRESS com evidências e limites. Legado green/compilar não conclui etapa local. Avance por funcionalidade demonstrável sem acumular falhas.
