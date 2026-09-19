# Roadmap técnico — NEXO · Gestão Comercial · MVP V1

## Regra de avanço

Este roadmap implementa as 58 seções do [objetivo vigente](./GOAL.md). **NEXO** é o software, **Gestão Comercial** é o subtítulo, e **Adega JG** e **Depósito JG** são as empresas operadas com dados isolados.

O trabalho avança verticalmente por M0–M7. Uma tarefa só conta como concluída quando código, integração, fluxo e testes relevantes passam. O estado e os percentuais verificáveis ficam em [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md); evidências e limitações correntes ficam em [STATUS.md](./STATUS.md).

Antes de cada incremento: objetivo → impacto → dados → dependências → implementação → testes → integração → UX → documentação. Erro estrutural no fluxo principal impede o avanço. A prioridade é: integridade dos dados, correção funcional, simplicidade operacional, experiência do usuário, manutenibilidade, performance, qualidade visual e recursos adicionais.

## M0 — Fundação técnica

**Objetivo:** sustentar o produto e entregar o primeiro shell Windows funcional.

**Entregas**

- Monólito modular TypeScript com `client`, `server` e contratos compartilhados.
- Banco relacional, migrations, seed, autenticação, empresas, usuários e auditoria transacional.
- Empresa explícita na API, vínculo ativo e autorização conferidos no servidor.
- PostgreSQL em produção; PGlite somente em desenvolvimento e testes isolados.
- Shell Tauri reutilizando o frontend React, janela e identidade NEXO.
- Build Windows inicial reproduzível.

**Gate:** o NEXO abre como aplicativo Windows, autentica e alterna corretamente entre Adega JG e Depósito JG. A execução apenas em navegador não conclui M0.

## M1 — Experiência e identidade NEXO

**Objetivo:** oferecer uma experiência comercial coerente, clara e própria.

**Entregas**

- Marca NEXO com Gestão Comercial em posição secundária.
- Navegação por Visão geral, Operação, Financeiro, Cadastros, Gestão e Administração.
- Design system para cabeçalhos, formulários, tabelas, filtros, ações, estados, diálogos e mensagens.
- Contexto permanente da empresa em operação, foco, teclado e feedback visual.
- Dashboard base com ações e alertas que apontam para fluxos reais.
- Páginas existentes refinadas sem permitir que a administração domine a operação.

**Gate:** revisão renderizada confirma hierarquia, contexto, ação principal, próximo passo e consistência; o sistema não se apresenta como painel administrativo genérico.

## M2 — Cadastros comerciais

**Objetivo:** preparar os dados necessários à operação diária.

**Entregas**

- Produtos, categorias, clientes e fornecedores por empresa.
- Busca, filtros, consulta, criação, edição e inativação com histórico preservado.
- Valores monetários em centavos e quantidades decimais exatas.
- Unidades iniciais e dados de demonstração coerentes com cada empresa.
- Estoque exibido apenas a partir de movimentos; sem edição silenciosa de saldo.

**Gate:** os quatro cadastros funcionam no backend e na interface, nas duas empresas, com acessos permitidos e negados, isolamento, persistência e estados de interface validados.

## M3 — Estoque e compras

**Objetivo:** executar fornecedor → compra → recebimento → estoque rastreável.

**Entregas**

- Movimentos de entrada por compra, entrada manual, perda e ajuste; saída de venda entra no M4.
- Saldo anterior e posterior, quantidade, tipo, usuário, empresa, horário e observação.
- Estados normal, baixo e zerado; bloqueio de saldo negativo.
- Compra com fornecedor, itens, quantidade, custo, confirmação e recebimento.
- Recebimento transacional com entrada em estoque, custo histórico, auditoria e conta a pagar quando aplicável.
- Idempotência para impedir recebimento duplicado.

**Gate:** uma compra recebida aumenta o estoque exatamente uma vez e conserva todo o histórico. Qualquer falha reverte compra, itens, estoque, título e auditoria.

## M4 — PDV e vendas

**Objetivo:** vender com rapidez e consistência por teclado, leitor e mouse.

**Entregas**

- Pesquisa por nome, código interno e código de barras.
- Carrinho, quantidade, remoção, cliente opcional, desconto autorizado e total exato.
- Dinheiro, Pix, débito e crédito.
- Venda, itens, pagamento, baixa de estoque, movimento de caixa, registro financeiro e auditoria na mesma transação.
- Idempotência, cancelamento rastreável e preservação de preços/custos históricos.
- Núcleo mínimo de caixa: abertura, saldo inicial e recebimento da venda.

**Gate:** caixa aberto → venda → pagamento → baixa de estoque → caixa/financeiro funciona nas duas empresas. Estoque insuficiente, caixa fechado e acesso negado deixam zero efeito parcial.

## M5 — Caixa e financeiro

**Objetivo:** completar o ciclo financeiro diário com rastreabilidade.

**Entregas**

- Abertura, entradas, saídas, vendas vinculadas, saldo esperado e fechamento.
- Separação clara entre dinheiro físico e os demais meios.
- Receitas, despesas, contas a pagar e contas a receber.
- Vencimento, realização, status, origem comercial e liquidação rastreável.
- Estornos e correções sem apagar histórico.

**Gate:** abrir → vender → movimentar → conferir → fechar caixa e pagar/receber títulos conserva valores, origem e histórico; repetição não duplica efeitos.

## M6 — Dashboard e relatórios

**Objetivo:** transformar operações reais em uma visão básica e confiável do negócio.

**Entregas**

- Vendas, faturamento, ticket médio, caixa, receitas, despesas, estoque e vencimentos.
- Alertas e ações rápidas baseados em estado real.
- Relatórios de vendas, estoque, compras e financeiro com filtros necessários.
- Auditoria pesquisável das operações relevantes.

**Gate:** indicadores e relatórios conciliam com as fontes, empresas, períodos, cancelamentos e liquidações. Ausência de dados gera orientação, nunca números inventados.

## M7 — Estabilização da V1

**Objetivo:** validar, empacotar e testar a V1 instalada.

**Entregas**

- Testes dos fluxos críticos, acessos, isolamento, rollback, reexecução e concorrência.
- Revisões de UX, visual, acessibilidade, teclado, desempenho e erros.
- Homologação própria em PostgreSQL real, incluindo migrations e backup restaurado.
- Build final, instalador NEXO, atalhos e teste em Windows limpo.
- Documentação de desenvolvimento, teste, build, instalação e recuperação.

**Gate:** instalado no Windows, o fluxo fornecedor → compra → estoque → caixa → venda → pagamento → financeiro → dashboard → relatório funciona nas duas empresas com autenticação, histórico e consistência.

## Dependências entre milestones

```mermaid
flowchart LR
  M0[M0 Fundação] --> M1[M1 Experiência]
  M1 --> M2[M2 Cadastros]
  M2 --> M3[M3 Estoque e compras]
  M3 --> M4[M4 PDV e vendas]
  M4 --> M5[M5 Caixa e financeiro]
  M5 --> M6[M6 Dashboard e relatórios]
  M6 --> M7[M7 Estabilização]
  M3 -. núcleo de contas a pagar .-> M5
  M4 -. núcleo de caixa e receita .-> M5
```

M0 e M1 permanecem abertos enquanto o shell desktop e a revisão visual completa não forem homologados. Isso não autoriza pular os gates funcionais: cada módulo novo depende dos contratos e controles já validados.

## Rastreabilidade das 58 seções

| Seções | Tema | Milestones principais |
| --- | --- | --- |
| 0–7 | Identidade, visão, fundação existente, desktop e fluxo operacional | M0, M1, M7 |
| 8–14 | Multiempresa, navegação, UX, identidade, design system e estados | M0, M1 |
| 15–27 | Dashboard e módulos comerciais/administrativos | M2–M6 |
| 28–34 | Dados, arquitetura, consistência, segurança, qualidade, demonstração e build | M0–M7 |
| 35 | Fora do escopo | Todos os gates |
| 36–44 | Governança e definição de M0–M7 | M0–M7 |
| 45–49 | Roadmap visual e progresso verificável | M1 e documentação contínua |
| 50–54 | Foco vertical, identidade, escopo, processo e autonomia | Todos os gates |
| 55–58 | Pronto da V1, critério visual e prioridades finais | M7 |

## Limite de escopo e homologação

Os itens da seção 35 não entram na V1: fiscal, TEF/Pix automático, bancos, WhatsApp, e-commerce, delivery, comandas/mesas/cozinha, impressão automática, fidelidade, aplicativo móvel nativo, offline avançado, sincronização distribuída, BI avançado, multi-filial complexo, contabilidade, folha, CRM e IA.

Não criar telas, tabelas, filas ou adaptadores antecipados para esses recursos. PostgreSQL, concorrência, restore, credenciais, instalação e periféricos reais exigem homologação própria; testes locais em PGlite não substituem essas evidências. Decisões e riscos permanecem em [RISKS.md](./RISKS.md).
