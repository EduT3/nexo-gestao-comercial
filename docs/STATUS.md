# NEXO — Gestão Comercial · estado de implementação

Atualizado em 17/09/2026. Registros anteriores preservados em history/STATUS-before-consolidation.md.

## Objetivo e estado atual

MVP V1 de GOAL.md para Adega JG e Depósito JG, com dados isolados. Entrega final desktop Windows; prévia web visual adicional autorizada.

M5: 6/8 tarefas verificadas (75%). Cadastros, estoque, compras, venda principal, abertura/movimentação/fechamento de caixa, pagamento de títulos de compras, recebíveis e lançamentos financeiros manuais integrados à API e interface.

Estornos/correções e ciclo financeiro integral permanecem pendentes. O fluxo principal de M4 passou, mas cancelamento rastreável de venda previsto no roadmap não foi comprovado; M4 volta a EM DESENVOLVIMENTO até esse requisito passar. M0 depende do shell Windows e M1 da revisão integral de experiência. M6/M7 pendentes.

## Evidência

- Últimos checks antes da prévia: 74 testes, tipagem e build aprovados.
- Último Edge: 8 testes aprovados com banco temporário isolado; inclui cadastros 360/1440px, compras, estoque, PDV, títulos, recebíveis, lançamentos manuais 360px e fechamento.
- Contrato da conta a pagar em Compras corrigido e testado: categoria, meio, responsável e observação de liquidação retornados conforme modelo compartilhado.
- Prévia visual em revalidação: build específico aprovado; testes de isolamento e bloqueio de gravações adicionados.

## Prévia web e publicação

- Usuário definiu prévia apenas visual e renovou login GitHub.
- Repositório privado criado: https://github.com/EduT3/nexo-gestao-comercial. Envio do código ainda pendente.
- Workspace Vercel confirmado: edut3's projects. Vinculação/deploy ainda pendentes.
- build:preview gera snapshot fictício em banco em memória descartável e reutiliza as mesmas telas. Sem .env, DATABASE_URL, dados empresariais ou sessão real. Mutações comerciais recusadas; sem simular sucesso.
- vercel.json configura npm run build:preview e dist/client. Build normal permanece conectado à API real.
- Git local e workflow Node 24 preparados. CLI GitHub sem token válido; connector autenticado disponível para envio.

## Limites e próximos gates

PostgreSQL real, concorrência, privilégios e backup/restore ainda não homologados. Não há executável/instalador Windows validado. PGlite não substitui essas evidências. Dashboard, relatórios, histórico comercial de clientes/fornecedores, roadmap visual e revisão final de requisitos ainda precisam de implementação/verificação.

Concluir verificação da prévia, enviar código ao GitHub, importar na Vercel e verificar o URL publicado. Depois avançar estornos/cancelamentos preservando histórico e homologar o ciclo completo nas duas empresas.
