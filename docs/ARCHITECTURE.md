# Arquitetura do NEXO — Gestão Comercial · MVP V1

## Estado e objetivo

Este documento registra decisões e contratos para o [objetivo vigente](./GOAL.md). Não comprova implementação ou conclusão: resultados executados, limitações e gates pertencem a [STATUS.md](./STATUS.md).

Preservar a base válida e refatorar incrementalmente para operação comercial. O software atende Adega JG e Depósito JG, com registros isolados. Não é uma plataforma corporativa complexa. Mesas/comandas, fiscal, integrações, offline avançado e demais itens da seção 35 não serão implementados na V1. A marca oficial é **NEXO**, com **Gestão Comercial** como subtítulo; os nomes das empresas permanecem.

## 1. Decisão: monólito modular

TypeScript com API Fastify, interface React/Vite e banco relacional PostgreSQL. Um único backend e uma única transação de banco podem concluir venda, pagamento, estoque, caixa, registro financeiro e auditoria.

A separação de responsabilidades permite evoluir sem impor microserviços, eventos distribuídos ou módulos futuros vazios:

```text
src/client — telas, componentes, navegação e estados de interface
       ↓ HTTP / contratos em src/shared
src/server — autenticação, autorização e validação da API
       ↓ serviços de aplicação / regras de negócio
       ↓ unidade de transação
SQL parametrizado / migrations / PostgreSQL
```

- **Interface:** apresenta dados e intenção do usuário; não decide autorização, preço final ou saldo oficial.
- **API:** autentica, valida entrada, resolve empresa autorizada e traduz erros.
- **Serviços de aplicação:** definem casos de uso, invariantes e limites da transação.
- **Persistência:** consultas parametrizadas, constraints, migrations versionadas e adaptador transacional.
- **Contratos compartilhados:** tipos de entrada/saída e vocabulário comum, sem segredos ou dependência do driver no navegador.

Organização existente:

```text
src/client/              React, componentes, telas e estilos
src/server/              API, serviços, segurança e persistência
src/shared/              Contratos entre interface e API
migrations/              SQL versionado
tests/                   Regras, banco e API
docs/                    Objetivo, contratos, roadmap e evidências
```

Separar internamente por módulo quando surgir um caso de uso real. A modularização deve reduzir concentração de regras nos handlers e componentes; não exige recriar a aplicação. O [contrato HTTP](./API.md) precisa acompanhar cada implementação e sua autorização efetiva.

**Runtime:** Node.js 24. No PowerShell usar `npm.cmd`. Comandos-base: `npm.cmd ci`, `npm.cmd run db:migrate`, `npm.cmd run db:seed`, `npm.cmd run dev`; validação: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e`. Existência de script não significa teste aprovado.

## 2. Banco e ambientes

### Produção

PostgreSQL é o banco de produção. Validar conexão, migrations, constraints, concorrência, privilégios do runtime, backup e restore em PostgreSQL real antes de liberação operacional. O papel de migrations deve ser separado do papel de runtime, que recebe o mínimo necessário.

### Local e teste

PGlite é exclusivamente local/teste. O adaptador comum expõe consultas parametrizadas e transações; serviços não conhecem o driver. Banco temporário de teste nunca reutiliza dados empresariais. Browser usa Edge e banco temporário.

PGlite não comprova concorrência entre processos/terminais, TLS, privilégios ou recuperação de PostgreSQL. Registrar as evidências separadamente.

O diretório está no OneDrive. O padrão local existente `%LOCALAPPDATA%\JG-ERP\development` continua sendo uma localização técnica, substituível por `DATA_DIR`. A mudança de marca não autoriza mover ou apagar banco existente. Banco ativo, sessões, dumps empresariais e segredos ficam fora da árvore sincronizada. Diretório temporário autorizado é aceitável para testes e não comprova persistência no diretório padrão.

### Migrations e demonstração

- SQL explícito, ordem, checksum e exclusão mútua; reaplicação não modifica dados nem oculta divergências.
- Mudanças de esquema preservam registros existentes; teste de banco novo e atualização acompanha cada migration.
- Seed é explícito e local; não roda automaticamente em produção.
- Credenciais de demonstração são provisionadas localmente, fora dos artefatos compartilhados; nenhuma senha fixa real entra no código.
- Dados realistas de produtos, categorias, pessoas, compras, vendas, estoque e financeiro entram progressivamente por fluxos consistentes.
- Demonstração é identificada e separada da operação. Falha de API/banco não pode acionar fallback para dados fictícios.

## 3. Empresa explícita e isolamento

`User` é identidade global. `Company` contém o cadastro de cada empresa. O vínculo ativo usuário–empresa define o perfil; o mesmo usuário pode ter acessos diferentes em cada empresa.

Toda entidade de negócio tem `company_id` obrigatório, incluindo categorias, pessoas, produtos, compras, vendas, pagamentos, caixa e financeiro. Auditoria de negócio também tem empresa; eventos de autenticação anteriores ao contexto podem ser globais e identificados como tais.

1. A API coloca a empresa no caminho: `/api/companies/:companyId/...`.
2. Cada request exige sessão válida, vínculo ativo e autorização no servidor.
3. A empresa é explícita por requisição, não uma única “empresa atual” mutável na sessão. Abas diferentes podem operar contextos distintos.
4. Toda consulta filtra pela empresa autorizada.
5. Entidades referenciáveis têm chave única `(company_id, id)`; relações usam FKs compostas, por exemplo `(company_id, product_id)`.
6. Código interno, código de barras e demais unicidades operacionais são locais à empresa quando aplicável.
7. Não mudar a empresa de uma operação já registrada nem aceitar associação de IDs de outra empresa.
8. Troca na interface limpa/recarrega dados dependentes, sem aceitar resposta atrasada do contexto anterior.

Unidades/filiais e estruturas administrativas que já existam e sejam válidas podem ser preservadas internamente; não ampliar a V1 para multifilial complexo. **Consolidado** sai da navegação principal. A opção futura “Todas as empresas” no dashboard não será antecipada.

Provisionamento de empresa não concede leitura automática de empresas preexistentes. A capacidade administrativa técnica existente deve continuar distinta dos vínculos de acesso comercial.

## 4. Autenticação e autorização simples

- Senhas recebem hash com salt individual e parâmetros de custo. Senha, hash e tokens não entram em logs/respostas.
- Sessão usa token opaco aleatório em cookie; banco guarda seu hash, expiração e revogação.
- Cookies `HttpOnly`, `SameSite` e `Secure` em HTTPS de produção. Exceção HTTP é apenas local.
- Mutações validam origem permitida e proteção CSRF; SameSite é defesa complementar.
- Logout, expiração, desativação e revogação devem impedir reutilização indevida.
- Limitar tentativas de login e payload; erro de autenticação não revela existência de usuário.
- Validar no backend antes de ler/alterar; negar por padrão.

Perfis da V1, definidos na própria tela de usuários:

| Perfil | Acesso |
| --- | --- |
| ADMIN | Acesso completo nas empresas em que possui vínculo ativo. |
| OPERADOR | PDV, caixa, consulta de produtos e operações necessárias ao atendimento. |

Permissões granulares podem continuar como mecanismo interno, sem módulo principal independente. Mapeamento dos perfis legados exige migração explícita e teste, preservando isolamento e evitando elevação silenciosa. Limites de desconto e demais ações sensíveis devem ser aplicados no servidor de acordo com o perfil; a interface não concede exceção por enviar um papel no payload.

## 5. Auditoria e histórico

Mutação de negócio e auditoria compartilham a transação. Falha ao auditar provoca rollback. Eventos registram usuário, empresa, data/hora do servidor, ação, entidade e registro afetado; estados anterior/posterior sanitizados e motivo acompanham ações em que são necessários.

- Eventos são append-only: a aplicação não atualiza nem remove auditoria.
- Proteger alteração/remoção no banco e restringir privilégios de runtime.
- Auditar produto/preço, movimentos de estoque, vendas/cancelamentos, compras, caixa e administração.
- Não registrar senha, hash, cookie, token ou informação pessoal sem necessidade.
- Diferenciar tentativa negada de operação comercial confirmada.
- Inativar cadastro e cancelar/estornar operação preservando original. Não apagar histórico para corrigir saldo.

Consulta de auditoria é simples, pesquisável e protegida por empresa/perfil. Não implementar uma plataforma de monitoramento ou trilha externa como recurso comercial antecipado da V1.

## 6. Dinheiro, quantidade, estoque e tempo

### Representação exata

- Dinheiro em **centavos inteiros**; validação de inteiros e limites antes de cálculo/gravação.
- Quantidades aceitam **até três casas decimais**, representadas em decimal exato no banco e formato controlado na API; o cálculo pode usar milésimos inteiros.
- Unidades iniciais: unidade, pacote, caixa, saco, kg, metro e litro. Não presumir conversões automáticas de embalagem.
- Não totalizar valores financeiros com ponto flutuante binário. Preço/custo em centavos multiplicado pela quantidade exige arredondamento determinístico testado ao centavo.
- Regra de arredondamento/desconto deve ser centralizada, documentada junto ao serviço e reconciliar subtotal, desconto e total. Não duplicar a regra no PDV e no financeiro.
- Venda e compra guardam valores históricos de preço/custo, quantidade e descrição/unidade relevantes. Editar produto não reescreve operações anteriores.
- Data/hora do evento vem do servidor; banco usa timestamp com fuso. Relatórios usam período e fuso comercial explícitos; vencimento é data civil.

### Estoque

Saldo inicial zero; qualquer entrada/saída exige movimento. Tipos V1: compra, entrada manual, venda, perda e ajuste. Cada movimento informa produto, quantidade, tipo, usuário, empresa, data e observação; registrar anterior/posterior facilita reconciliação.

**Política inicial: não permitir estoque negativo.** Atualização usa bloqueio ou condição atômica no banco, sem ler saldo e sobrescrever depois. Duas vendas simultâneas do último saldo não podem ser ambas aprovadas. Saldo materializado, quando usado, muda na mesma transação dos movimentos e deve reconciliar com eles.

### Caixa e financeiro

Caixa aberto é pré-condição da venda. Registrar operador, abertura, saldo inicial, movimentos, vendas, saldo esperado e fechamento. Distinguir totais por meio de pagamento e dinheiro físico: Pix/cartão não aumentam dinheiro na gaveta.

A receita financeira originada na venda referencia o pagamento já lançado. Nunca gerar uma segunda entrada de caixa ao gravar, consultar ou liquidar essa mesma receita. Compra recebida que exige pagamento futuro gera conta a pagar vinculada, na mesma transação.

Correções usam registros compensatórios ligados à origem, motivo e autorização. Caixa fechado não recebe alteração silenciosa. Não ampliar esse contrato para conciliação bancária, antecipação de cartão, parcelas, crédito interno ou contabilidade.

## 7. Limites dos módulos V1

| Módulo | Responsabilidade |
| --- | --- |
| Identidade/acesso | Usuário, sessão, vínculos e perfis ADMIN/OPERADOR. |
| Empresas | Cadastro e contexto operacional autorizado. |
| Catálogo | Produtos, categorias, unidades iniciais, códigos, custo/preço e status. |
| Pessoas | Clientes/fornecedores e histórico de operações por empresa. |
| Estoque | Movimentos e saldo, único caminho para mudar disponibilidade. |
| Compras | Fornecedor/itens/custo/recebimento e obrigação a pagar quando necessária. |
| PDV/vendas | Pesquisa, carrinho, desconto autorizado, quatro meios e confirmação atômica. |
| Caixa | Abertura, entradas/saídas, vendas, saldo esperado e fechamento. |
| Financeiro | Receitas, despesas, contas a pagar/receber, datas, status e liquidação. |
| Dashboard/relatórios | Consultas reais por empresa/período, sem lógica paralela de saldos. |
| Auditoria | Eventos transacionais e pesquisa autorizada. |

Contratos relacionais iniciais: Company, User/vínculo, Product, Category, Supplier, Customer, InventoryMovement, Sale, SaleItem, Payment, CashRegister, CashMovement, Purchase, PurchaseItem, AccountPayable, AccountReceivable e AuditLog. A implementação pode compartilhar estruturas de títulos/lançamentos quando isso simplificar o modelo sem perder as regras. Não é necessário criar uma tabela por nome sugerido antes do uso.

## 8. Transações e reexecução segura

### Compra recebida

```text
Autorizar empresa → validar fornecedor/itens
→ transação: compra + itens + movimentos de entrada
             + custo aplicável + conta a pagar necessária + auditoria
→ confirmar resultado
```

Recebimento simples, sem cotação ou aprovação hierárquica. Repetição da mesma confirmação não duplica estoque ou obrigação.

### Venda concluída

```text
Autorizar empresa → validar caixa aberto/itens/desconto/pagamento
→ transação: venda + itens históricos + pagamento
             + baixa de estoque + movimentos de caixa
             + receita financeira vinculada + auditoria
→ confirmar resultado
```

O comando carrega chave de idempotência. A API grava chave, assinatura do conteúdo e resultado por empresa/operação na mesma transação. Mesma chave/conteúdo retorna resultado original; conteúdo diferente gera conflito. Constraint única resolve confirmação concorrente. O teste cobre clique duplo, resposta perdida, rollback e reenvio.

Dinheiro, Pix, débito e crédito são registros operacionais manuais na V1. Não há confirmação externa automática. A operação depende de API disponível; perda de conexão deve mostrar erro ou estado de confirmação a consultar, nunca sucesso presumido.

Idempotência online é necessária à integridade e não implica fila offline, sincronização, outbox/inbox ou integração futura. Esses mecanismos não serão construídos antecipadamente.

### Dependências do roadmap

O [roadmap](./ROADMAP.md) mantém as milestones M0–M7. M3 antecipa o título a pagar necessário à compra. M4 antecipa abertura/núcleo de caixa e receita vinculada, necessários para uma venda válida. M5 completa gestão e fechamento. Nunca adiar o efeito financeiro obrigatório de uma compra/venda já confirmada para uma transação posterior.

## 9. Interface orientada à operação

Navegação:

| Grupo | Áreas |
| --- | --- |
| Visão geral | Dashboard |
| Operação | PDV/Vendas, Produtos, Estoque, Compras |
| Financeiro | Caixa, Financeiro |
| Cadastros | Clientes, Fornecedores |
| Gestão | Relatórios |
| Administração | Empresas, Usuários, Auditoria |

“Empresa em operação” fica visível. Administração é secundária. Perfil e permissões ficam em usuários; Consolidado não é módulo principal.

Manter verde escuro, neutros, off-white, tipografia limpa e marca Nexo. Reutilizar cabeçalhos, seções, tabelas, formulários, filtros, botões, badges, status, alertas, modais/drawers e estados. Cada página oferece contexto, ação principal e próximo passo. Não preencher espaço com cartões/gráficos decorativos ou dados artificiais.

PDV prioriza velocidade e teclado. Exibir um módulo por vez; revisar espaço, hierarquia, foco, legibilidade e comportamento responsivo. Vazio explica finalidade e ação; loading e erro são claros. Funcionalidade ainda não entregue não deve parecer operacional.

Dashboard inicial orienta para as ações realmente existentes. Métricas completas entram com os módulos de origem, reconciliadas por empresa e período. Rótulos distinguem resultado operacional, demonstração e registro manual.

## 10. Validação e evolução

Gates acumulativos verificam domínio, persistência, API e browser conforme risco. Regras críticas exigem permitido/negado, empresa cruzada, rollback e reexecução; concorrência e restore exigem PostgreSQL real.

Revisão de arquitetura checa autorização, transação, histórico, precisão e recuperação antes de ampliar escopo. Revisão visual compara a tela renderizada com o propósito comercial, não apenas com sua existência no código.

[RISKS.md](./RISKS.md) acompanha dependências e decisões. O [objetivo anterior](./history/GOAL-previous-erp.md) é histórico; não impõe entregas adicionais à V1. Criar portas de evolução apenas quando a operação atual precisar delas.
