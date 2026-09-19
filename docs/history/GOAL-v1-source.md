/goal

PROJETO: JG GESTÃO COMERCIAL
VERSÃO-ALVO: MVP V1

\==================================================

1. VISÃO DO PRODUTO
   \==================================================

Construir uma primeira versão funcional, utilizável e visualmente
diferenciada de um sistema de gestão comercial para os negócios JG,
atendendo inicialmente:

- Adega JG
- Depósito JG

O objetivo desta versão NÃO é criar um ERP completo.

O objetivo é criar um sistema comercial simples, confiável,
rápido e agradável de utilizar no dia a dia, capaz de centralizar
as principais operações dos dois negócios:

- produtos
- estoque
- compras
- vendas
- PDV
- caixa
- clientes
- fornecedores
- financeiro básico
- relatórios
- usuários

A aplicação deverá nascer tecnicamente preparada para evoluir,
mas funcionalidades futuras não devem ser implementadas nesta fase
apenas porque podem ser úteis algum dia.

O foco absoluto da V1 é:

FUNCIONAR BEM
→ SER SIMPLES
→ SER CONFIÁVEL
→ SER AGRADÁVEL DE USAR
→ TER IDENTIDADE PRÓPRIA

\==================================================
2\. DIRETRIZ DE PRODUTO
=======================

O JG Gestão Comercial não deve parecer:

- um template administrativo genérico
- um dashboard SaaS padrão
- um conjunto de CRUDs
- um protótipo visual
- um sistema corporativo excessivamente burocrático

O sistema deve parecer um produto real, pensado especificamente
para operação comercial.

Aplicar ao projeto a mesma mentalidade de produto utilizada no Bolsario:

- identidade própria
- experiência visual coerente
- telas com propósito
- conteúdo contextual
- hierarquia forte
- componentes com intenção
- menos aparência de template
- menos páginas frias
- melhor orientação do usuário
- experiência mais refinada

A interface deve transmitir que cada elemento existe por uma razão.

\==================================================
3\. SITUAÇÃO ATUAL DO PROJETO
=============================

Caso já exista uma implementação gerada a partir do objetivo anterior:

NÃO reconstruir o sistema do zero.

Preservar tudo que estiver tecnicamente correto, especialmente:

- estrutura de projeto
- banco de dados
- autenticação
- isolamento entre empresas
- componentes reutilizáveis
- base da identidade JG
- paleta
- tipografia
- estrutura visual aproveitável
- seletor de empresa
- mecanismos de auditoria úteis

Entretanto, a implementação anterior possui uma orientação excessiva
para administração multiempresa.

Refatorar incrementalmente a experiência para que o produto passe a ser
orientado à OPERAÇÃO COMERCIAL.

A administração deverá existir, mas não dominar o produto.

\==================================================
4\. OBJETIVO OPERACIONAL DA V1
==============================

A V1 deverá permitir executar corretamente o seguinte fluxo:

Fornecedor
→ Compra
→ Entrada no estoque
→ Abertura de caixa
→ Venda
→ Pagamento
→ Baixa no estoque
→ Atualização do caixa
→ Registro financeiro
→ Dashboard
→ Relatório

Esse fluxo deve funcionar corretamente tanto para:

ADEGA JG

quanto para:

DEPÓSITO JG

Os dados das duas empresas devem permanecer isolados.

\==================================================
5\. ESTRUTURA MULTIEMPRESA
==========================

O sistema deverá atender inicialmente:

- Adega JG
- Depósito JG

Cada empresa possuirá seus próprios:

- produtos
- estoque
- vendas
- compras
- caixa
- clientes
- fornecedores
- movimentações financeiras
- usuários autorizados

Manter no cabeçalho o conceito:

"Empresa em operação"

com seletor entre:

Adega JG
Depósito JG

A empresa selecionada define o contexto operacional da aplicação.

Ao trocar de empresa, todas as telas operacionais deverão refletir
automaticamente o contexto selecionado.

Não misturar registros entre empresas.

A arquitetura deverá permitir adicionar novas empresas futuramente,
mas não criar nesta fase uma plataforma corporativa complexa.

\==================================================
6\. ARQUITETURA DE NAVEGAÇÃO
============================

Reorganizar a navegação principal para refletir a operação comercial.

Estrutura desejada:

VISÃO GERAL

- Dashboard

OPERAÇÃO

- PDV / Vendas
- Produtos
- Estoque
- Compras

FINANCEIRO

- Caixa
- Financeiro

CADASTROS

- Clientes
- Fornecedores

GESTÃO

- Relatórios

ADMINISTRAÇÃO

- Empresas
- Usuários
- Auditoria

Remover "Consolidado" como módulo principal da V1.

Caso seja necessário visualizar informações das duas empresas,
isso poderá futuramente ocorrer através do Dashboard com opção:

"Todas as empresas"

para usuários administrativos.

Remover "Permissões" como módulo independente principal.

Na V1, permissões e perfis devem ser administrados dentro da gestão
de usuários.

\==================================================
7\. PRINCÍPIOS DE UX
====================

A interface deve ser orientada ao uso diário.

Ao entrar no sistema, o usuário deverá perceber imediatamente:

- onde está
- qual empresa está operando
- situação atual do negócio
- ações disponíveis
- informações importantes
- próximo passo

Cada página deve responder implicitamente:

"Por que esta tela existe?"

e:

"O que o usuário deve conseguir fazer aqui?"

Evitar páginas compostas apenas por:

título

- tabela
- botão
- muito espaço vazio

Criar composição visual com propósito.

\==================================================
8\. IDENTIDADE VISUAL
=====================

Preservar a identidade já iniciada do JG:

- verde escuro
- tons neutros
- bege/off-white
- tipografia limpa
- aparência profissional
- sidebar
- seletor de empresa
- marca JG

Porém, evoluir essa base.

A aplicação deverá possuir mais:

- presença visual
- profundidade
- personalidade
- hierarquia
- contraste
- intenção na composição

Não transformar o sistema em algo excessivamente chamativo.

Evitar:

- excesso de gradientes
- glassmorphism exagerado
- animações desnecessárias
- neon
- visual futurista
- efeitos decorativos sem função
- cards excessivos
- estética de "dashboard de Dribbble" sem usabilidade

O resultado deverá ser:

MODERNO
\+
SÓBRIO
\+
AUTORAL
\+
PROFISSIONAL
\+
FUNCIONAL

\==================================================
9\. DESIGN SYSTEM
=================

Criar e utilizar padrões consistentes para:

- cabeçalhos
- seções
- cards
- tabelas
- formulários
- filtros
- ações principais
- ações secundárias
- badges
- status
- alertas
- modais
- drawers
- estados vazios
- loading
- erros
- confirmações
- mensagens contextuais

Os componentes devem parecer pertencentes ao JG Gestão.

Evitar criar um componente visual completamente diferente para
cada nova tela.

\==================================================
10\. CABEÇALHOS DE PÁGINA
=========================

Os cabeçalhos devem possuir boa presença visual.

Utilizar quando apropriado:

- contexto da seção
- título
- descrição curta
- empresa ativa
- ação principal
- filtros relevantes

Exemplo:

OPERAÇÃO

Produtos

Gerencie o catálogo e acompanhe os itens disponíveis na Adega JG.

[ Novo produto ]

Evitar descrições burocráticas ou excessivamente técnicas.

\==================================================
11\. ESTADOS VAZIOS
===================

Estados sem dados não devem parecer páginas quebradas ou abandonadas.

Quando uma seção estiver vazia, apresentar:

- explicação breve
- finalidade da funcionalidade
- próximo passo recomendado
- ação principal

Exemplo:

Nenhuma compra registrada ainda.

Registre sua primeira compra para adicionar produtos ao estoque
e começar a acompanhar custos.

[ Registrar primeira compra ]

\==================================================
12\. DASHBOARD
==============

Transformar a Visão Geral em uma verdadeira central operacional.

A página inicial NÃO deve continuar parecendo apenas uma página
institucional da empresa.

Ela deve apresentar o estado atual do negócio.

Exibir conforme os dados existirem:

- faturamento do dia
- faturamento do mês
- quantidade de vendas
- ticket médio
- saldo esperado do caixa
- receitas
- despesas
- produtos com estoque baixo
- produtos zerados
- produtos mais vendidos
- últimas vendas
- últimas compras
- atividades importantes

Adicionar:

AÇÕES RÁPIDAS

Exemplos:

- Nova venda
- Abrir caixa
- Novo produto
- Registrar compra

Criar alertas relevantes.

Exemplos:

- Caixa ainda não aberto
- 4 produtos com estoque baixo
- 2 produtos sem estoque
- 3 contas vencendo

Não adicionar gráficos apenas para preencher espaço.

Gráficos somente quando ajudarem uma decisão.

\==================================================
13\. PRODUTOS
=============

Permitir cadastro de produtos com:

- nome
- código interno
- código de barras
- categoria
- unidade
- custo
- preço de venda
- estoque atual
- estoque mínimo
- fornecedor principal
- status

Unidades iniciais:

- unidade
- pacote
- caixa
- saco
- kg
- metro
- litro

Exemplos para o Depósito:

- cimento
- tijolo
- areia
- argamassa
- fio
- tubo

Exemplos para a Adega:

- cerveja
- refrigerante
- energético
- água
- gelo
- destilado

A tela de produtos deve permitir rapidamente:

- pesquisar
- filtrar
- consultar estoque
- consultar preço
- identificar estoque baixo
- cadastrar produto
- editar produto

Evitar formulários visualmente burocráticos.

\==================================================
14\. ESTOQUE
============

Registrar movimentações de estoque.

Tipos iniciais:

- entrada por compra
- entrada manual
- venda
- perda
- ajuste

Registrar:

- produto
- quantidade
- tipo
- data
- usuário
- empresa
- observação

Venda reduz estoque automaticamente.

Compra recebida aumenta estoque automaticamente.

Nunca alterar estoque silenciosamente.

Toda alteração deve possuir uma movimentação correspondente.

Destacar visualmente:

- estoque normal
- estoque baixo
- estoque zerado

\==================================================
15\. PDV / VENDAS
=================

Criar uma experiência de PDV rápida e direta.

Essa será uma das telas mais importantes do sistema.

Priorizar velocidade sobre decoração.

Permitir:

- pesquisar produto
- localizar por código
- utilizar código de barras
- adicionar itens
- alterar quantidade
- remover item
- selecionar cliente opcional
- aplicar desconto autorizado
- visualizar subtotal
- visualizar total
- escolher forma de pagamento
- finalizar venda

Formas iniciais:

- dinheiro
- Pix
- débito
- crédito

Registrar:

- itens
- quantidades
- preços
- descontos
- total
- pagamento
- operador
- empresa
- data/hora

Ao finalizar uma venda:

1. salvar venda
2. salvar itens
3. registrar pagamento
4. atualizar estoque
5. atualizar caixa

A operação deve ser transacional.

Caso qualquer etapa falhe, não deixar dados parcialmente gravados.

\==================================================
16\. CAIXA
==========

Implementar:

- abrir caixa
- saldo inicial
- entradas
- saídas
- vendas
- saldo esperado
- fechamento

Exibir claramente:

- operador
- horário de abertura
- saldo inicial
- vendas
- entradas
- saídas
- saldo esperado

A experiência de caixa deve ser extremamente clara.

\==================================================
17\. COMPRAS
============

Criar fluxo simples:

Selecionar fornecedor
→ adicionar produtos
→ quantidade
→ custo
→ confirmar recebimento

Ao receber:

- aumentar estoque
- registrar movimentações
- registrar compra
- atualizar custo quando apropriado
- gerar conta a pagar quando necessário

Não implementar nesta fase:

- cotação complexa
- aprovação hierárquica
- pedidos de compra empresariais avançados

\==================================================
18\. CLIENTES
=============

Cadastrar:

- nome
- CPF/CNPJ opcional
- telefone
- WhatsApp
- endereço
- observação

Exibir quando existir:

- histórico de compras
- última compra
- total comprado

Não implementar CRM nesta fase.

\==================================================
19\. FORNECEDORES
=================

Cadastrar:

- nome
- CPF/CNPJ opcional
- telefone
- WhatsApp
- e-mail
- endereço
- observação

Permitir consultar:

- compras realizadas
- última compra

\==================================================
20\. FINANCEIRO
===============

Criar financeiro básico e operacional.

Permitir:

- receitas
- despesas
- contas a pagar
- contas a receber

Campos básicos:

- descrição
- categoria
- valor
- vencimento
- data de pagamento/recebimento
- status
- empresa
- observação

Mostrar:

- total a pagar
- total a receber
- receitas
- despesas

Não implementar nesta fase:

- contabilidade
- DRE completa
- conciliação bancária
- OFX
- conexão bancária
- fiscal avançado

\==================================================
21\. RELATÓRIOS
===============

Criar relatórios úteis e simples.

VENDAS

- por período
- por produto
- por forma de pagamento

ESTOQUE

- estoque atual
- estoque baixo
- estoque zerado
- movimentações

COMPRAS

- por período
- por fornecedor

FINANCEIRO

- receitas
- despesas
- contas a pagar
- contas a receber

Não criar BI avançado na V1.

\==================================================
22\. USUÁRIOS
=============

Simplificar o modelo de acesso.

Perfis iniciais:

ADMIN

- acesso completo

OPERADOR

- PDV
- caixa
- consulta de produtos
- operações necessárias ao atendimento

O perfil deve ser configurado na própria tela de usuários.

Não criar um módulo de permissões complexo.

A arquitetura poderá permitir granularidade futura.

\==================================================
23\. AUDITORIA
==============

Manter auditoria básica das operações importantes:

- alteração de produto
- ajuste de estoque
- vendas
- cancelamentos
- compras
- movimentações de caixa
- alterações administrativas importantes

Registrar:

- usuário
- empresa
- data/hora
- ação
- entidade
- registro afetado

A tela de auditoria deve ser simples e pesquisável.

\==================================================
24\. TELAS ADMINISTRATIVAS
==========================

Empresas, Usuários e Auditoria continuarão existindo.

Porém, essas telas não devem dominar a experiência.

Mesmo as áreas administrativas deverão receber o mesmo refinamento
visual e de produto das áreas operacionais.

Evitar aparência de:

"formulário gigante dentro de uma caixa branca".

Utilizar organização, contexto e hierarquia.

\==================================================
25\. ARQUITETURA TÉCNICA
========================

Utilizar arquitetura profissional, mas evitar overengineering.

Separar adequadamente:

- frontend
- backend
- banco
- autenticação
- regras de negócio
- validações

Utilizar banco relacional.

Entidades iniciais sugeridas:

Company
User
Product
Category
Supplier
Customer
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
AuditLog

Entidades operacionais devem estar vinculadas à empresa.

\==================================================
26\. CONSISTÊNCIA DE DADOS
==========================

Dar prioridade máxima à consistência entre:

- venda
- estoque
- caixa
- compra
- financeiro

Utilizar transações de banco quando necessário.

Nunca mascarar falhas.

Nunca deixar operações críticas parcialmente concluídas.

\==================================================
27\. SEGURANÇA
==============

Implementar corretamente:

- autenticação
- hash de senha
- proteção de rotas
- sessão
- autorização no servidor
- validação
- sanitização

Nunca confiar apenas no frontend para verificar acesso.

\==================================================
28\. QUALIDADE
==============

Manter:

- TypeScript quando aplicável
- tipagem forte
- tratamento de erros
- migrations
- seed
- validação
- loading states
- empty states
- mensagens claras
- testes para regras críticas

Evitar dívida técnica desnecessária.

Refatorar quando encontrar estrutura significativamente melhor,
mas não reconstruir áreas funcionando sem necessidade.

\==================================================
29\. DADOS DE DEMONSTRAÇÃO
==========================

Manter ambiente de demonstração com dados realistas.

ADEGA JG:

- cervejas
- refrigerantes
- água
- energético
- gelo
- destilados

DEPÓSITO JG:

- cimento
- tijolo
- areia
- argamassa
- fio
- tubo

Criar exemplos de:

- fornecedores
- clientes
- compras
- vendas
- movimentações
- financeiro

O ambiente deve permitir avaliar visualmente o produto sem parecer vazio.

\==================================================
30\. FORA DO ESCOPO DA V1
=========================

NÃO implementar agora:

- NF-e
- NFC-e
- SAT
- TEF
- integração Stone
- integração Pix automática
- integração bancária
- conciliação bancária
- WhatsApp automático
- e-commerce
- catálogo online
- delivery
- comandas
- mesas
- cozinha
- impressão de pedidos
- fidelidade
- app mobile nativo
- offline avançado
- sincronização distribuída
- BI avançado
- multi-filial complexo
- contabilidade
- folha de pagamento
- CRM
- automações por IA

Preparar somente quando necessário estruturas que não dificultem
essas evoluções futuramente.

Não desenvolver essas funções antecipadamente.

\==================================================
31\. FASES DE IMPLEMENTAÇÃO
===========================

FASE 1 — FUNDAÇÃO E EXPERIÊNCIA

- revisar base existente
- preservar arquitetura válida
- reorganizar navegação
- refinar design system
- melhorar identidade visual
- refinar Dashboard inicial
- autenticação
- empresas
- usuários

FASE 2 — CADASTROS

- produtos
- categorias
- clientes
- fornecedores

FASE 3 — ESTOQUE E COMPRAS

- movimentações
- estoque
- estoque mínimo
- compras

FASE 4 — OPERAÇÃO

- PDV
- vendas
- pagamentos
- baixa automática de estoque

FASE 5 — CAIXA E FINANCEIRO

- abertura
- movimentações
- fechamento
- contas a pagar
- contas a receber

FASE 6 — GESTÃO

- dashboard completo
- relatórios
- auditoria
- revisão de UX
- revisão visual
- revisão técnica

Cada fase deve estar funcional antes de avançar.

\==================================================
32\. REGRA DE CONTROLE DE ESCOPO
================================

Antes de adicionar qualquer nova funcionalidade, perguntar:

"Isso é necessário para que o Depósito JG ou a Adega JG consiga
comprar, vender, controlar estoque, caixa ou financeiro na V1?"

Se a resposta for NÃO:

não implementar.

Registrar apenas como possibilidade futura quando relevante.

\==================================================
33\. REGRA CONTRA INTERFACE GENÉRICA
====================================

Sempre que criar ou revisar uma tela, verificar:

- Parece um template genérico?
- Parece apenas um CRUD?
- Existe contexto suficiente?
- A hierarquia está clara?
- Existe uma ação principal?
- O usuário entende o próximo passo?
- O espaço está sendo usado de forma intencional?
- A tela parece fazer parte do mesmo produto?
- Existe valor visual ou apenas caixas brancas?

Se a resposta indicar uma experiência genérica, revisar antes
de considerar a tela finalizada.

\==================================================
34\. REGRA DE DESENVOLVIMENTO
=============================

Antes de implementar cada funcionalidade:

1. entender o impacto no fluxo geral;
2. revisar o modelo de dados;
3. identificar dependências;
4. implementar;
5. testar;
6. validar comportamento;
7. revisar UX;
8. revisar integração com o restante do sistema.

Não declarar uma funcionalidade concluída apenas porque a tela aparece.

Ela precisa funcionar de ponta a ponta.

\==================================================
35\. DEFINIÇÃO DE PRONTO DA V1
==============================

A V1 estará pronta quando for possível:

Cadastrar fornecedor
→ cadastrar produto
→ registrar compra
→ estoque aumentar
→ abrir caixa
→ registrar venda
→ estoque diminuir
→ pagamento entrar no caixa
→ fechar caixa
→ registrar financeiro
→ visualizar Dashboard
→ consultar relatórios

Tudo isso deverá funcionar:

- na Adega JG
- no Depósito JG
- com dados separados
- com autenticação
- com histórico
- com consistência

Além disso, a experiência final deverá parecer um produto comercial
bem acabado, e não apenas uma demonstração técnica.

\==================================================
36\. CRITÉRIO VISUAL FINAL
==========================

Ao abrir o JG Gestão Comercial, a impressão desejada é:

"Esse sistema foi criado especificamente para administrar este negócio."

e não:

"Esse é mais um painel administrativo genérico."

A interface deve ser simples o suficiente para uso diário,
mas refinada o suficiente para transmitir qualidade.

O visual deve ajudar o usuário a trabalhar.

Nunca competir com a tarefa principal.

\==================================================
37\. AUTONOMIA DO AGENTE
========================

O agente possui liberdade para:

- reorganizar componentes
- melhorar arquitetura
- refatorar código
- melhorar UX
- melhorar textos
- melhorar navegação
- corrigir inconsistências
- remover elementos redundantes

desde que respeite:

- o objetivo da V1
- os limites de escopo
- a identidade JG
- a consistência dos dados
- o funcionamento das áreas já válidas

Não adicionar complexidade apenas por ser tecnicamente possível.

\==================================================
38\. ORDEM DE PRIORIDADE
========================

Em qualquer conflito de decisão, utilizar esta ordem:

1. Correção funcional
2. Integridade dos dados
3. Simplicidade operacional
4. Experiência do usuário
5. Manutenibilidade
6. Qualidade visual
7. Recursos adicionais

O objetivo final não é possuir o maior número possível de funcionalidades.

O objetivo final é possuir uma primeira versão do JG Gestão Comercial
que seja pequena o suficiente para terminar, boa o suficiente para usar
e sólida o suficiente para evoluir.
