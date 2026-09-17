# Engenharia NEXO — Gestão Comercial

## Produto e estado

- Leia `docs/GOAL.md`, `docs/ROADMAP.md` e `docs/STATUS.md` antes de avançar fases.
- O produto atende Depósito JG e Adega JG com registros separados por empresa. Não substituir regras ou persistência por telas/dados fictícios.
- Avance por etapas funcionais. Corrija erros estruturais e valide o fluxo da etapa antes de iniciar a seguinte.

## Arquitetura

- Monólito modular TypeScript: `src/client` interface, `src/server` API/regras/persistência, `src/shared` contratos. PostgreSQL em produção; PGlite apenas local/teste.
- Empresa é explícita no caminho da API. Autorize o vínculo ativo e a permissão no servidor a cada chamada. Nunca derive autorização apenas do seletor da interface.
- Toda entidade de negócio pertence a uma empresa. Relações entre entidades da mesma empresa exigem chaves estrangeiras compostas.
- Mutações de negócio e auditoria compartilham a transação. Não apagar histórico: inativar/cancelar/estornar. Não sobrescrever saldo de estoque sem movimento.
- Valores monetários em centavos inteiros; quantidades com escala decimal explícita. Não usar ponto flutuante em totais financeiros. Guardar custo/preço históricos nas operações.
- Dados de sessão e senhas não vão para logs nem localStorage. Segredos reais não vão para código, exemplos ou seeds.
- PostgreSQL real, restore e concorrência precisam de homologação própria; testes PGlite não substituem essa validação.

## Execução e validação

- Node.js 24. Use `npm.cmd` no PowerShell.
- `npm.cmd ci`, `npm.cmd run db:migrate`, `npm.cmd run db:seed`, `npm.cmd run dev`.
- `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e`.
- Testes de browser usam banco temporário e navegador Edge; nunca usar uma base empresarial para testes.
- Testar casos permitidos e negados, isolamento, rollback e reexecução quando afetar regras críticas. Não mascarar erro com dados de demonstração.
- Atualizar `docs/STATUS.md` com implementação, evidência, limitações e próximo gate. Não declarar fase concluída enquanto o fluxo principal falhar.
- Este diretório está no OneDrive. Mantenha banco ativo fora dele e não inicialize/publicize repositórios remotos sem solicitação.
