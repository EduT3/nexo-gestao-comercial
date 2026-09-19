# Contrato HTTP — fundação, cadastros, estoque, compras e PDV

Todas as respostas JSON, erros `{error:{code,message,requestId?}}`. IDs UUID; datas ISO UTC. Cookie opaco HttpOnly SameSite=Strict; `csrfToken` fica apenas na memória da UI. Requisições mutáveis exigem `Origin` igual ao APP_ORIGIN; após login exigem também `X-CSRF-Token`. Não há CORS permissivo. Empresa sempre explícita no caminho e validada contra vínculo ativo.

| Método /api | Corpo / resposta |
| --- | --- |
| GET /health | `{status:'ok'}` (consulta banco) |
| POST /auth/login | `{email,password}` → Session |
| GET /auth/session | Session; 401 sem sessão |
| POST /auth/logout | `{ok:true}` |
| POST /auth/password | `{currentPassword,newPassword}` → `{ok:true}`; revoga todas as sessões e exige novo login |
| GET /companies | `{companies: Company[]}` |
| POST /companies | `{name,legalName,taxId?,kind,address?}` → `{company: Company}`; somente systemAdmin; cria unidade principal e vínculo admin |
| GET /companies/:companyId/overview | CompanyOverview |
| PATCH /companies/:companyId | `{name,legalName,taxId,kind,address,timezone}` → `{company: Company}`; company.update |
| GET /companies/:companyId/users | `{users: Member[]}`; users.read |
| POST /companies/:companyId/users | `{name,email,password,role}` → `{user: Member}`; users.manage; cria usuário e vínculo, email já existente retorna conflito sem vincular automaticamente |
| PATCH /companies/:companyId/users/:membershipId | `{role,active}` → `{user: Member}`; users.manage; protege próprio acesso e último administrador |
| GET /companies/:companyId/audit?limit=50&offset=0&q=texto | `{events: AuditEvent[],total:number}`; audit.read; busca por ação, responsável, entidade ou ID |
| GET /roles | `{roles: [{key,label,permissions: Permission[]}]}`; autenticado; perfis V1: ADMIN e OPERADOR |
| GET /consolidated | Endpoint administrativo legado mantido para compatibilidade; não aparece na navegação V1 |
| GET /companies/:companyId/categories?q=&active=true&limit=50&offset=0 | `{categories: Category[],total,limit,offset}`; products.read |
| POST /companies/:companyId/categories | `{name,description}` → `{category}`; products.manage |
| PATCH /companies/:companyId/categories/:categoryId | Campos de categoria e `active` → `{category}`; products.manage |
| GET /companies/:companyId/products?q=&active=true&limit=50&offset=0 | `{products: Product[],total,limit,offset}`; products.read; omite `costCents` sem cost.read |
| POST /companies/:companyId/products | Nome, códigos, categoria, unidade, custo/preço em centavos, estoque mínimo e fornecedor → `{product}`; products.manage |
| PATCH /companies/:companyId/products/:productId | Campos alterados e/ou `active` → `{product}`; products.manage |
| GET /companies/:companyId/suppliers?q=&active=true&limit=50&offset=0 | `{suppliers: Supplier[],total,limit,offset}`; vínculo ativo |
| POST /companies/:companyId/suppliers | Dados cadastrais → `{supplier}`; products.manage |
| PATCH /companies/:companyId/suppliers/:supplierId | Campos alterados e/ou `active` → `{supplier}`; products.manage |
| GET /companies/:companyId/customers?q=&active=true&limit=50&offset=0 | `{customers: Customer[],total,limit,offset}`; vínculo ativo |
| POST /companies/:companyId/customers | Dados cadastrais → `{customer}`; products.manage |
| PATCH /companies/:companyId/customers/:customerId | Campos alterados e/ou `active` → `{customer}`; products.manage |
| GET /companies/:companyId/inventory?q=&status=all&limit=50&offset=0 | `{inventory: InventoryItem[],total,limit,offset}`; inventory.read; `status`: all, normal, low ou zero |
| GET /companies/:companyId/inventory/movements?productId=&limit=50&offset=0 | `{movements: InventoryMovement[],total,limit,offset}`; inventory.read |
| POST /companies/:companyId/inventory/movements | `Idempotency-Key: UUID`; `{productId,type,direction,quantity,notes}` → `{movement,replayed}`; inventory.manage; tipos manuais: ENTRY_MANUAL, LOSS e ADJUSTMENT |
| GET /companies/:companyId/purchases?limit=50&offset=0 | `{purchases: Purchase[],total,limit,offset}` com itens e título vinculado; purchases.manage |
| POST /companies/:companyId/purchases/receive | `Idempotency-Key: UUID`; `{supplierId,items:[{productId,quantity,unitCostCents}],notes,payable?}` → `{purchase,replayed}`; purchases.manage |
| GET /companies/:companyId/cash/current | `{cashRegister: CashRegister|null}` com saldo inicial, vendas, entradas, saídas e dinheiro esperado; cash.manage |
| POST /companies/:companyId/cash/open | `Idempotency-Key: UUID`; `{openingCents,notes}` → `{cashRegister,replayed}`; cash.manage |
| GET /companies/:companyId/cash/movements | `{movements: CashMovement[]}` com histórico recente do caixa; cash.manage |
| POST /companies/:companyId/cash/movements | `Idempotency-Key: UUID`; `{type: ENTRY|EXIT,amountCents,notes}` → `{movementId,cashRegister?,replayed}`; cash.manage; somente operador responsável |
| POST /companies/:companyId/cash/close | `Idempotency-Key: UUID`; `{countedCents,notes}` → `{cashRegister,replayed,differenceCents}`; cash.manage; somente operador responsável |
| GET /companies/:companyId/finance?limit=50 | `{payables,receivables,entries,totals}`; finance.read; títulos e lançamentos recentes, totais calculados sobre todos os registros da empresa |
| POST /companies/:companyId/finance/receivables | `Idempotency-Key: UUID`; `{customerId?,description,category,amountCents,dueDate,notes}` → `{receivableId,replayed}`; finance.manage; cliente opcional ativo da mesma empresa |
| POST /companies/:companyId/finance/receivables/:receivableId/receive | `Idempotency-Key: UUID`; `{paymentMethod,notes}` → `{receivableId,replayed}`; finance.manage; dinheiro exige caixa aberto do operador |
| POST /companies/:companyId/finance/payables/:payableId/pay | `Idempotency-Key: UUID`; `{paymentMethod,notes}` → `{payable,replayed}`; finance.manage; dinheiro exige caixa do operador e saldo suficiente |
| GET /companies/:companyId/sales?limit=50&offset=0 | `{sales: Sale[],total,limit,offset}`; sales.create; custo histórico omitido sem cost.read |
| POST /companies/:companyId/sales | `Idempotency-Key: UUID`; `{customerId?,items:[{productId,quantity}],discountCents,paymentMethod,notes}` → `{sale,replayed}`; sales.create |

Cadastros operacionais seguem o mesmo escopo explícito `/companies/:companyId`. `active` aceita `true`, `false` ou `all`; a resposta padrão traz ativos. Relações de produto usam chaves compostas e rejeitam categoria/fornecedor de outra empresa como recurso inexistente. Valores monetários são centavos inteiros; `stockMin` é decimal textual com até três casas e não representa saldo atual.

Tipos compartilhados em `src/shared/contracts.ts`. Recursos de negócio e permissões reservadas aparecem apenas no roadmap; não há endpoints fictícios. Estrutura de erros não inclui detalhes SQL, senhas ou cookies.

Movimentações de estoque são imutáveis. Entrada manual sempre usa `IN`, perda sempre usa `OUT`, e ajuste declara o sentido. Quantidade é texto decimal positivo com até três casas. O saldo é bloqueado e atualizado na mesma transação do movimento e da auditoria; saída que deixaria saldo negativo retorna `INSUFFICIENT_STOCK`. Repetir a mesma chave com o mesmo comando retorna o movimento anterior; reutilizá-la com outro comando retorna `IDEMPOTENCY_CONFLICT`.

O recebimento calcula cada total em centavos com arredondamento de meia unidade para cima, preserva quantidade e custo unitário históricos, atualiza o custo corrente do produto e cria uma entrada de estoque por item. A conta a pagar é opcional e nasce vinculada à compra. Compra, itens, movimentos, saldos, custos, título e auditoria confirmam ou revertem juntos.

A empresa possui no máximo um caixa aberto. A venda exige o caixa do operador autenticado, preserva preço/custo e confirma itens, pagamento, baixa de estoque, movimento de caixa, receita e auditoria na mesma transação. Dinheiro aumenta o saldo físico esperado; Pix, débito e crédito aparecem no total de vendas sem aumentar dinheiro. Entradas e saídas manuais exigem motivo e caixa do operador; saída acima do dinheiro esperado é recusada. Desconto exige `sales.discount`. Repetição idêntica não duplica efeitos.
