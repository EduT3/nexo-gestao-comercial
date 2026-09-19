/goal

Construir um sistema completo de gestão comercial, estoque, PDV e financeiro para os negócios JG, inicialmente atendendo duas operações distintas:

1. Depósito JG
2. Adega JG

O sistema deve funcionar como uma plataforma única, porém permitir que cada empresa/operação possua seus próprios produtos, estoque, caixa, vendas, clientes, fornecedores, usuários, configurações, relatórios e CNPJ.

O proprietário deve conseguir alternar facilmente entre as empresas e também possuir uma visão consolidada das operações quando possuir permissão administrativa.

==================================================
OBJETIVO PRINCIPAL
==================================================

Criar uma aplicação moderna, rápida, simples de operar e visualmente profissional que centralize:

- Frente de caixa / PDV
- Vendas
- Estoque
- Produtos
- Clientes
- Fornecedores
- Compras
- Financeiro
- Contas a pagar
- Contas a receber
- Fluxo de caixa
- Controle de recebimentos
- Orçamentos
- Relatórios
- Indicadores gerenciais
- Controle de perdas
- Controle de usuários
- Operação de múltiplas empresas/CNPJs
- Recursos específicos para Depósito JG
- Recursos específicos para Adega JG

A aplicação não deve ser apenas um protótipo visual.

O objetivo final é possuir um sistema realmente utilizável no dia a dia da empresa, com persistência de dados, controle de permissões, histórico, auditoria e arquitetura preparada para evolução futura.

==================================================
1. ESTRUTURA MULTIEMPRESA
==================================================

O sistema deverá suportar múltiplas empresas.

Inicialmente:

- Depósito JG
- Adega JG

Cada empresa deverá possuir isoladamente:

- CNPJ
- Nome fantasia
- Razão social
- Endereço
- Configurações
- Produtos
- Estoque
- Clientes
- Fornecedores
- Caixa
- Vendas
- Compras
- Financeiro
- Funcionários
- Relatórios

Usuários administrativos autorizados poderão visualizar:

- Resultado consolidado das empresas
- Faturamento total
- Lucro estimado
- Estoque total
- Contas a pagar
- Contas a receber
- Fluxo financeiro
- Comparação entre unidades

Nunca misturar movimentações de empresas diferentes sem deixar isso explicitamente indicado.

==================================================
2. DASHBOARD
==================================================

Criar uma dashboard realmente útil para gestão.

Exibir, conforme empresa e período selecionados:

- Faturamento do dia
- Faturamento do mês
- Quantidade de vendas
- Ticket médio
- Lucro bruto estimado
- Margem
- Entradas
- Saídas
- Contas a receber
- Contas a pagar
- Caixa atual
- Produtos mais vendidos
- Produtos menos vendidos
- Produtos com estoque baixo
- Produtos sem estoque
- Produtos parados
- Perdas
- Compras recentes
- Vendas recentes

Adicionar gráficos úteis, evitando elementos puramente decorativos.

Permitir filtros por:

- Hoje
- Ontem
- Semana
- Mês
- Período personalizado
- Empresa
- Loja/unidade
- Categoria
- Produto

==================================================
3. PDV / FRENTE DE CAIXA
==================================================

Desenvolver uma tela de PDV extremamente rápida.

O operador deverá conseguir:

- Pesquisar produto por nome
- Pesquisar por código
- Utilizar código de barras
- Alterar quantidade
- Aplicar desconto autorizado
- Remover item
- Cancelar venda conforme permissão
- Selecionar cliente
- Visualizar subtotal
- Visualizar desconto
- Visualizar total
- Selecionar forma de pagamento

Formas de pagamento:

- Dinheiro
- Pix
- Débito
- Crédito
- Parcelado
- Outras formas configuráveis

Permitir pagamento misto.

Exemplo:

R$ 100:
- R$ 40 Pix
- R$ 60 cartão

Registrar:

- Operador
- Caixa
- Data/hora
- Forma de pagamento
- Empresa
- Cliente
- Itens
- Valores
- Descontos
- Custos
- Margem estimada

A venda deverá dar baixa automática no estoque.

==================================================
4. CONTROLE DE CAIXA
==================================================

Implementar:

- Abertura de caixa
- Saldo inicial
- Sangria
- Suprimento
- Entradas
- Saídas
- Fechamento
- Conferência
- Diferença de caixa
- Histórico
- Identificação do operador

Guardar auditoria completa.

Um caixa fechado não poderá ser alterado livremente sem autorização administrativa.

==================================================
5. PRODUTOS
==================================================

Cada produto deverá poder armazenar:

- Nome
- SKU
- Código interno
- Código de barras
- Categoria
- Subcategoria
- Unidade de medida
- Custo
- Preço de venda
- Margem
- Estoque atual
- Estoque mínimo
- Estoque máximo
- Fornecedor
- Marca
- Localização
- Descrição
- Imagem
- Status ativo/inativo

Permitir:

- Produto simples
- Variações
- Unidades diferentes
- Produtos vendidos por unidade, caixa, pacote, kg, metro etc.

Registrar histórico de alteração de preço.

==================================================
6. ESTOQUE
==================================================

Criar controle completo de estoque.

Tipos de movimentação:

- Entrada por compra
- Entrada manual
- Venda
- Devolução
- Perda
- Quebra
- Consumo interno
- Ajuste
- Transferência
- Inventário

Toda movimentação deverá possuir:

- Data
- Produto
- Quantidade
- Estoque anterior
- Estoque posterior
- Usuário
- Motivo
- Empresa

Não permitir alterar estoque simplesmente sobrescrevendo o número sem gerar movimentação e histórico.

Criar alertas para:

- Estoque baixo
- Estoque zerado
- Estoque excessivo
- Produto sem movimentação

==================================================
7. COMPRAS E FORNECEDORES
==================================================

Cadastrar fornecedores com:

- Nome
- Razão social
- CNPJ/CPF
- Telefone
- WhatsApp
- E-mail
- Endereço
- Observações
- Produtos fornecidos

Criar fluxo de compra:

Cotação
→ Pedido
→ Recebimento
→ Entrada no estoque
→ Lançamento financeiro

Registrar:

- Produto
- Quantidade
- Custo
- Frete
- Desconto
- Impostos
- Fornecedor
- Prazo
- Forma de pagamento

Manter histórico de preços de compra para auxiliar futuras negociações.

==================================================
8. CLIENTES
==================================================

Cadastrar:

- Nome
- CPF/CNPJ
- Telefone
- WhatsApp
- Endereço
- E-mail
- Observações

Exibir:

- Histórico de compras
- Total comprado
- Última compra
- Ticket médio
- Produtos mais comprados
- Valores em aberto

Preparar arquitetura para:

- Fiado
- Crédito interno
- Limite de crédito

Essas funções devem possuir controle de permissões.

==================================================
9. FINANCEIRO
==================================================

Criar módulo financeiro com:

- Contas a pagar
- Contas a receber
- Fluxo de caixa
- Receitas
- Despesas
- Categorias financeiras
- Centros de custo

Exibir:

- Previsto
- Realizado
- Vencido
- Pago
- Recebido

Permitir conciliar recebimentos provenientes de:

- Pix
- Cartão
- Dinheiro
- Outros meios

Para cartões, preparar estrutura para registrar:

- Operadora
- Bandeira
- Taxa
- Número de parcelas
- Valor bruto
- Taxa
- Valor líquido
- Data prevista de recebimento
- Data efetiva de recebimento

==================================================
10. ORÇAMENTOS
==================================================

Prioridade especialmente para o Depósito JG.

Permitir criar orçamento contendo:

- Cliente
- Produtos
- Quantidades
- Preços
- Descontos
- Frete
- Observações
- Validade

Status:

- Aberto
- Enviado
- Aprovado
- Rejeitado
- Expirado
- Convertido em venda

Um orçamento aprovado deverá poder ser convertido em venda sem redigitar todos os produtos.

Preparar possibilidade futura de:

- PDF
- Impressão
- Compartilhamento por WhatsApp

==================================================
11. RECURSOS ESPECÍFICOS — DEPÓSITO JG
==================================================

Adaptar o sistema para produtos de material de construção.

Exemplos:

- Cimento
- Tijolo
- Areia
- Argamassa
- Fios
- Cabos
- Tubos
- Conexões
- Ferragens
- Ferramentas

Aceitar unidades como:

- Unidade
- Caixa
- Pacote
- Saco
- Metro
- Metro quadrado
- Metro cúbico
- Kg

Preparar estrutura para cálculo de entrega/frete.

Permitir colocar no orçamento:

- Endereço da obra
- Observações de entrega
- Data prevista
- Taxa de entrega

==================================================
12. RECURSOS ESPECÍFICOS — ADEGA JG
==================================================

Além do PDV tradicional, preparar a Adega para operar também como bar/estabelecimento de consumo.

Produtos como:

- Cervejas
- Destilados
- Refrigerantes
- Energéticos
- Água
- Gelo
- Combos
- Porções
- Outros itens

Controlar:

- Estoque
- Entrada
- Venda
- Perda
- Quebra
- Consumo

Adicionar módulo opcional de atendimento por mesas/comandas.

Funções:

- Abrir mesa
- Abrir comanda
- Adicionar produtos
- Identificar atendente
- Transferir itens
- Transferir mesa
- Unir mesas
- Dividir conta
- Dividir pagamento
- Fechar conta

Preparar fluxo:

Garçom
→ lança pedido
→ pedido aparece na área responsável
→ preparo
→ pronto
→ entrega
→ fechamento da conta

Criar conceito de setores de produção:

- Bar
- Cozinha
- Caixa

Preparar estrutura futura para impressão automática dos pedidos em impressoras específicas.

==================================================
13. USUÁRIOS E PERMISSÕES
==================================================

Criar sistema RBAC de permissões.

Perfis iniciais:

ADMINISTRADOR
- acesso completo

GERENTE
- gestão operacional e relatórios

CAIXA
- vendas e caixa

ESTOQUE
- estoque e compras

GARÇOM
- mesas/comandas/pedidos

Permissões sensíveis:

- Cancelar venda
- Alterar preço
- Aplicar desconto
- Ajustar estoque
- Cancelar pedido
- Reabrir caixa
- Excluir movimentação
- Visualizar custo
- Visualizar lucro
- Visualizar financeiro

==================================================
14. AUDITORIA
==================================================

Toda operação importante deverá gerar log.

Registrar:

- Usuário
- Data/hora
- Empresa
- Ação
- Entidade afetada
- Valor anterior
- Valor posterior

Auditar especialmente:

- Exclusões
- Descontos
- Cancelamentos
- Alterações de preço
- Alterações de estoque
- Alterações financeiras
- Permissões

Não implementar exclusões destrutivas desnecessárias.

Preferir:

- cancelamento
- inativação
- estorno

mantendo o histórico.

==================================================
15. RELATÓRIOS
==================================================

Implementar relatórios de:

VENDAS
- vendas por período
- vendas por produto
- vendas por categoria
- vendas por funcionário
- vendas por forma de pagamento

ESTOQUE
- estoque atual
- estoque baixo
- ruptura
- produtos parados
- giro
- perdas
- histórico de movimentação

FINANCEIRO
- receitas
- despesas
- contas a pagar
- contas a receber
- fluxo de caixa

GERENCIAL
- faturamento
- lucro bruto
- margem
- ticket médio
- produtos mais vendidos
- produtos mais lucrativos
- desempenho por empresa

Permitir exportação futura para:

- PDF
- Excel
- CSV

==================================================
16. EXPERIÊNCIA DE USO
==================================================

A interface não deve parecer um dashboard genérico criado por IA.

Criar identidade visual própria para o sistema JG.

Princípios:

- limpa
- moderna
- profissional
- rápida
- legível
- poucos cliques
- fácil para funcionário com pouca experiência técnica

Priorizar desktop no PDV e administração.

Garantir responsividade para:

- celular
- tablet
- notebook
- desktop

Utilizar componentes consistentes.

Evitar excesso de:

- cards
- gradientes
- animações
- informações irrelevantes

A experiência deve se aproximar de softwares comerciais reais.

==================================================
17. PESQUISA GLOBAL
==================================================

Adicionar busca rápida no sistema.

Permitir pesquisar:

- Produto
- Cliente
- Fornecedor
- Venda
- Pedido
- Orçamento

Preferencialmente com atalho de teclado.

==================================================
18. FUNCIONAMENTO OFFLINE / INSTABILIDADE
==================================================

Projetar a arquitetura para que uma queda temporária de internet não destrua a operação do caixa.

Avaliar e implementar uma estratégia segura de:

- cache local
- fila de operações
- sincronização posterior

Nunca criar sincronização offline que possa duplicar:

- vendas
- pagamentos
- estoque

Tratar conflitos explicitamente.

Caso uma implementação offline completa seja complexa demais para a primeira versão, preparar a arquitetura desde o início e documentar a implementação futura.

==================================================
19. INTEGRAÇÕES FUTURAS
==================================================

Preparar arquitetura desacoplada para posteriormente integrar:

- Pix
- TEF
- Stone
- Mercado Pago
- WhatsApp
- emissão fiscal
- NFC-e
- NF-e
- impressão
- leitor de código de barras
- balança
- impressoras térmicas
- catálogo digital
- e-commerce

Não utilizar integrações fictícias.

Durante o desenvolvimento, criar interfaces/adapters e mocks quando a integração real exigir credenciais externas.

==================================================
20. EMISSÃO FISCAL
==================================================

Não tentar improvisar emissão fiscal.

Preparar módulo e estrutura de dados para:

- NFC-e
- NF-e
- documentos fiscais

A implementação real deverá utilizar posteriormente um provedor/API fiscal adequado e respeitar as regras fiscais brasileiras.

==================================================
21. ARQUITETURA
==================================================

Construir com arquitetura profissional e modular.

Separar adequadamente:

- Interface
- Regras de negócio
- API
- Persistência
- Autenticação
- Permissões
- Integrações

Criar banco de dados relacional bem estruturado.

Entidades principais sugeridas:

Company
Store
User
Role
Permission
Product
Category
Supplier
Customer
Inventory
InventoryMovement
Sale
SaleItem
Payment
CashRegister
CashMovement
Purchase
PurchaseItem
AccountPayable
AccountReceivable
Quote
QuoteItem
Table
Order
OrderItem
AuditLog

Garantir relacionamento correto entre empresa e registros.

==================================================
22. SEGURANÇA
==================================================

Implementar:

- autenticação
- sessão segura
- hash de senha
- proteção de rotas
- autorização server-side
- validação de dados
- sanitização
- rate limiting onde necessário

Nunca confiar apenas na interface para validar permissões.

==================================================
23. QUALIDADE
==================================================

O sistema deverá possuir:

- TypeScript quando aplicável
- tipagem forte
- validação
- tratamento de erros
- loading states
- empty states
- mensagens claras
- logs adequados
- migrations
- seed de desenvolvimento
- testes das regras críticas

Não esconder erros utilizando dados falsos.

==================================================
24. DADOS DE DEMONSTRAÇÃO
==================================================

Criar uma base de demonstração realista para as duas empresas.

DEPÓSITO JG:
- cimento
- areia
- tijolos
- fios
- tubos
- argamassa

ADEGA JG:
- cerveja
- refrigerante
- energético
- água
- gelo
- destilados

Criar:

- produtos
- categorias
- fornecedores
- clientes
- vendas
- movimentações
- contas

para que todas as telas possam ser avaliadas.

==================================================
25. ESTRATÉGIA DE DESENVOLVIMENTO
==================================================

Não tentar construir tudo superficialmente ao mesmo tempo.

Desenvolver em etapas.

FASE 1 — FUNDAÇÃO
- arquitetura
- banco
- autenticação
- empresas
- usuários
- permissões
- design system

FASE 2 — OPERAÇÃO PRINCIPAL
- produtos
- categorias
- estoque
- clientes
- fornecedores

FASE 3 — PDV
- caixa
- vendas
- pagamentos
- baixa de estoque

FASE 4 — GESTÃO
- compras
- financeiro
- orçamento
- dashboard
- relatórios

FASE 5 — ADEGA
- mesas
- comandas
- pedidos
- setores de produção

FASE 6 — RECURSOS AVANÇADOS
- offline
- integrações
- fiscal
- e-commerce
- WhatsApp

Cada fase deve estar funcional antes de iniciar complexidade desnecessária na próxima.

==================================================
26. CRITÉRIO DE SUCESSO
==================================================

O projeto será considerado bem-sucedido quando for possível executar o fluxo completo:

DEPÓSITO:
Fornecedor
→ Compra
→ Entrada no estoque
→ Orçamento
→ Venda
→ Pagamento
→ Baixa de estoque
→ Caixa
→ Financeiro
→ Relatório

ADEGA:
Estoque
→ Abertura de caixa
→ Mesa/comanda ou PDV
→ Pedido
→ Pagamento
→ Baixa de estoque
→ Fechamento
→ Relatório

E todas essas operações devem manter:

- consistência financeira
- consistência de estoque
- identificação da empresa
- identificação do usuário
- histórico
- auditoria

==================================================
27. DIRETRIZ PARA O AGENTE
==================================================

Antes de implementar uma funcionalidade:

1. analise o impacto no restante do sistema;
2. verifique o modelo de dados;
3. identifique dependências;
4. implemente;
5. teste;
6. valide o fluxo completo;
7. corrija inconsistências antes de avançar.

Não criar funcionalidades apenas para aparentarem prontas visualmente.

Não substituir lógica real por placeholders silenciosamente.

Não declarar uma etapa concluída enquanto o fluxo principal correspondente não funcionar.

Pode revisar e refatorar decisões anteriores quando encontrar uma arquitetura melhor, desde que preserve funcionalidades válidas e explique mudanças estruturais importantes.

O objetivo não é produzir rapidamente muitas telas.

O objetivo é construir progressivamente um sistema comercial JG confiável, utilizável e preparado para se tornar a ferramenta central de gestão do Depósito JG e da Adega JG.
