/goal-update

PROJETO: NEXO
SUBTÍTULO: Gestão Comercial
VERSÃO-ALVO: MVP V1

==================================================
0. IDENTIDADE OFICIAL DO PRODUTO
==================================================

O nome oficial do sistema é:

NEXO
Gestão Comercial

"NEXO" é a marca principal do produto.

"Gestão Comercial" funciona como subtítulo e descritor.

A apresentação visual deve priorizar:

NEXO

com:

Gestão Comercial

em posição secundária.

Não utilizar "JG Gestão Comercial" como nome oficial do sistema.

Os negócios inicialmente administrados pelo NEXO são:

- Adega JG
- Depósito JG

Portanto:

NEXO = software

Adega JG / Depósito JG = empresas operadas através do software.

Aplicar a identidade NEXO em:

- logo
- tela de login
- splash screen
- janela do aplicativo
- título da aplicação
- instalador
- Menu Iniciar
- atalhos
- documentação
- roadmap
- builds
- rodapé
- arquivos de distribuição

Exemplos aceitáveis:

NEXO
Gestão Comercial

NEXO — Gestão Comercial

NEXO Setup

NEXO Gestão Comercial.exe

==================================================
1. VISÃO DO PRODUTO
==================================================

Construir uma primeira versão funcional, utilizável e visualmente
diferenciada de um sistema de gestão comercial para:

- Adega JG
- Depósito JG

O objetivo desta versão NÃO é criar um ERP completo.

O objetivo é criar uma aplicação comercial simples, confiável,
rápida e agradável de utilizar diariamente.

A V1 deverá centralizar:

- produtos
- categorias
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
- auditoria básica

O produto deverá nascer tecnicamente preparado para evoluir,
mas funcionalidades futuras NÃO devem ser implementadas antecipadamente.

Prioridades:

FUNCIONAR BEM
→ SER CONFIÁVEL
→ SER SIMPLES
→ SER RÁPIDO
→ SER AGRADÁVEL DE USAR
→ TER IDENTIDADE PRÓPRIA
→ SER FÁCIL DE EVOLUIR

==================================================
2. FILOSOFIA DE PRODUTO
==================================================

O NEXO não deve parecer:

- template administrativo genérico
- painel SaaS padrão
- conjunto de CRUDs desconectados
- protótipo visual
- sistema corporativo excessivamente burocrático
- projeto criado apenas para demonstração técnica

O NEXO deverá parecer um produto real.

Aplicar a mesma mentalidade de produto utilizada no projeto Bolsario:

- identidade própria
- experiência visual coerente
- telas com propósito
- boa hierarquia
- componentes com intenção
- informações contextualizadas
- orientação clara ao usuário
- menos aparência de template
- menos páginas frias
- composição visual refinada
- interface que auxilia o raciocínio e a operação

Cada elemento da interface deve existir por uma razão.

==================================================
3. ESTADO ATUAL DO PROJETO
==================================================

Já existe uma fundação construída utilizando tecnologias web.

Não reconstruir o projeto do zero.

Preservar tudo que estiver tecnicamente correto, especialmente:

- estrutura do projeto
- banco de dados
- autenticação
- isolamento entre empresas
- componentes reutilizáveis
- base da identidade visual
- tipografia
- paleta
- seletor de empresa
- mecanismos úteis de auditoria
- regras de negócio válidas

A implementação anterior possui orientação excessiva para administração.

Refatorar incrementalmente o produto para que o centro da experiência
passe a ser:

OPERAÇÃO COMERCIAL

e não:

ADMINISTRAÇÃO DO SISTEMA

==================================================
4. FORMATO FINAL DO PRODUTO
==================================================

O NEXO NÃO deverá ser entregue ao usuário final como um site aberto
manualmente no navegador.

A V1 deverá ser uma:

APLICAÇÃO DESKTOP INSTALÁVEL PARA WINDOWS.

O usuário deverá abrir o NEXO através de:

- Menu Iniciar
- atalho do Windows
- área de trabalho, quando configurado
- executável instalado

A experiência final não deverá exigir:

- abrir navegador
- acessar localhost
- executar npm run dev
- iniciar servidor manualmente
- utilizar terminal
- digitar URLs

Durante o desenvolvimento, localhost e ferramentas web podem continuar
sendo utilizadas internamente.

Isso é apenas ambiente de desenvolvimento.

==================================================
5. STACK DESKTOP
==================================================

Preferir:

TAURI
+
React
+
TypeScript

caso a arquitetura atual seja compatível.

Reutilizar o frontend React existente.

Não reconstruir a interface simplesmente para transformá-la em desktop.

Utilizar Tauri principalmente para:

- empacotamento desktop
- janela nativa
- integração com Windows
- armazenamento/configuração local quando necessário
- comunicação segura
- impressão futura
- periféricos futuros
- atualizações futuras
- gerenciamento do ciclo de vida do aplicativo

Preferir Tauri a Electron quando possível por:

- menor consumo de memória
- menor tamanho
- inicialização rápida
- menor overhead

Caso outra tecnologia seja tecnicamente superior para o projeto,
documentar a justificativa antes da mudança.

==================================================
6. EXPERIÊNCIA DESKTOP
==================================================

O NEXO deve se comportar como aplicativo desktop.

Implementar adequadamente:

- janela própria
- ícone NEXO
- título NEXO
- tamanho mínimo
- maximização
- restauração
- comportamento ao fechar
- atalhos de teclado
- foco de campos
- navegação por teclado
- diálogos apropriados

A interface não deve parecer apenas um website dentro de uma janela.

Dar atenção especial ao PDV para operação com:

- teclado
- leitor de código de barras
- mouse

Reduzir cliques desnecessários.

==================================================
7. OBJETIVO OPERACIONAL DA V1
==================================================

A V1 deverá executar corretamente:

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

Esse fluxo deverá funcionar para:

- Adega JG
- Depósito JG

sem manipulação manual de banco.

==================================================
8. ESTRUTURA MULTIEMPRESA
==================================================

O sistema deverá atender inicialmente:

- Adega JG
- Depósito JG

Cada empresa possui separadamente:

- produtos
- categorias
- estoque
- vendas
- compras
- caixa
- clientes
- fornecedores
- financeiro
- usuários autorizados

Manter no cabeçalho:

Empresa em operação

com seletor entre:

Adega JG
Depósito JG

Ao trocar de empresa, todas as telas operacionais devem refletir
automaticamente o novo contexto.

Nunca misturar registros de empresas diferentes.

Preparar arquitetura para novas empresas futuramente sem construir
agora uma plataforma corporativa complexa.

==================================================
9. ARQUITETURA DE NAVEGAÇÃO
==================================================

A navegação principal deverá refletir a operação real.

Estrutura:

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

DESENVOLVIMENTO

- Roadmap

A seção Desenvolvimento deverá aparecer apenas para:

- ambiente de desenvolvimento
- demonstração autorizada
- administrador apropriado

Remover como módulos principais da V1:

- Consolidado
- Permissões

Caso futuramente seja necessária visão consolidada, poderá existir
opção "Todas as empresas" no Dashboard administrativo.

==================================================
10. PRINCÍPIOS DE UX
==================================================

Ao entrar em qualquer tela, o usuário deverá entender rapidamente:

- onde está
- qual empresa está ativa
- o que aquela tela faz
- quais informações são importantes
- qual ação principal está disponível
- qual é o próximo passo

Evitar páginas compostas apenas por:

título
+ botão
+ tabela
+ espaço vazio

Cada tela deve possuir contexto e intenção.

==================================================
11. IDENTIDADE VISUAL NEXO
==================================================

Preservar a base visual existente:

- verde escuro
- tons neutros
- bege/off-white
- tipografia limpa
- sidebar
- seletor de empresa
- aparência sóbria

Porém, evoluir significativamente a linguagem visual.

O NEXO deve possuir mais:

- personalidade
- presença
- profundidade
- hierarquia
- contraste
- identidade
- intenção visual

Resultado desejado:

MODERNO
+
SÓBRIO
+
AUTORAL
+
PREMIUM
+
FUNCIONAL

Evitar:

- neon
- glassmorphism exagerado
- gradientes sem função
- excesso de animações
- aparência futurista artificial
- cards decorativos
- estilo Dribbble pouco funcional
- aparência de template pronto

==================================================
12. DESIGN SYSTEM
==================================================

Criar uma linguagem consistente para:

- cabeçalhos
- cards
- tabelas
- listas
- formulários
- filtros
- botões
- ações
- badges
- status
- alertas
- modais
- drawers
- empty states
- loading
- erros
- confirmações
- tooltips
- mensagens contextuais

Os componentes devem parecer pertencentes ao NEXO.

Não criar estilos desconectados para cada módulo.

==================================================
13. CABEÇALHOS DAS TELAS
==================================================

Utilizar cabeçalhos fortes e funcionais.

Exemplo:

OPERAÇÃO

Produtos

Gerencie o catálogo e acompanhe os itens disponíveis na Adega JG.

[ Novo produto ]

Utilizar quando apropriado:

- contexto da seção
- título
- descrição
- empresa ativa
- filtros
- ação principal

Evitar linguagem excessivamente técnica ou burocrática.

==================================================
14. ESTADOS VAZIOS
==================================================

Quando não existirem dados, não exibir apenas uma tabela vazia.

Criar estados vazios orientativos.

Exemplo:

Nenhuma compra registrada.

Registre sua primeira compra para adicionar produtos ao estoque
e começar a acompanhar custos.

[ Registrar primeira compra ]

Estados vazios devem ensinar o próximo passo.

==================================================
15. DASHBOARD
==================================================

Transformar a Visão Geral em uma central operacional.

Exibir conforme houver dados:

- vendas do dia
- faturamento do mês
- quantidade de vendas
- ticket médio
- saldo do caixa
- receitas
- despesas
- estoque baixo
- produtos zerados
- produtos mais vendidos
- últimas vendas
- últimas compras
- contas próximas do vencimento
- atividades importantes

Criar ações rápidas:

- Nova venda
- Abrir caixa
- Novo produto
- Registrar compra

Criar alertas úteis:

- caixa não aberto
- estoque baixo
- estoque zerado
- contas vencendo
- inconsistências importantes

Não criar gráficos apenas para preencher espaço.

==================================================
16. PRODUTOS
==================================================

Campos:

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

Exemplos Adega:

- cerveja
- refrigerante
- energético
- água
- gelo
- destilados

Exemplos Depósito:

- cimento
- tijolo
- areia
- argamassa
- fio
- tubo

Permitir:

- pesquisa
- filtros
- edição
- inativação
- consulta de estoque
- consulta de preço
- identificação de estoque baixo

==================================================
17. ESTOQUE
==================================================

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
- data/hora
- usuário
- empresa
- observação

Venda reduz estoque.

Compra recebida aumenta estoque.

Nunca alterar quantidade silenciosamente.

Toda alteração deve gerar movimentação.

Destacar:

- estoque normal
- estoque baixo
- estoque zerado

==================================================
18. PDV / VENDAS
==================================================

O PDV é uma das áreas mais importantes do NEXO.

Priorizar:

VELOCIDADE
+
CLAREZA
+
TECLADO
+
POUCOS CLIQUES

Permitir:

- pesquisa de produto
- pesquisa por código
- leitura de código de barras
- adicionar item
- alterar quantidade
- remover item
- cliente opcional
- desconto autorizado
- subtotal
- total
- forma de pagamento
- finalização

Pagamentos iniciais:

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

Finalização:

1. salvar venda
2. salvar itens
3. registrar pagamento
4. atualizar estoque
5. atualizar caixa

Operação obrigatoriamente transacional.

==================================================
19. CAIXA
==================================================

Implementar:

- abertura
- saldo inicial
- vendas
- entradas
- saídas
- saldo esperado
- fechamento

Exibir:

- operador
- horário de abertura
- saldo inicial
- vendas
- entradas
- saídas
- saldo esperado

A experiência precisa ser clara e segura.

==================================================
20. COMPRAS
==================================================

Fluxo:

Fornecedor
→ Produtos
→ Quantidade
→ Custo
→ Confirmação
→ Recebimento

Ao receber:

- registrar compra
- aumentar estoque
- registrar movimentação
- atualizar custo quando apropriado
- gerar conta a pagar quando aplicável

Não implementar:

- cotação avançada
- aprovação hierárquica
- workflow empresarial complexo

==================================================
21. CLIENTES
==================================================

Campos:

- nome
- CPF/CNPJ opcional
- telefone
- WhatsApp
- endereço
- observação

Exibir quando houver:

- histórico de compras
- última compra
- total comprado

Não implementar CRM na V1.

==================================================
22. FORNECEDORES
==================================================

Campos:

- nome
- CPF/CNPJ opcional
- telefone
- WhatsApp
- e-mail
- endereço
- observação

Permitir consultar:

- histórico de compras
- última compra

==================================================
23. FINANCEIRO
==================================================

Implementar financeiro básico:

- receitas
- despesas
- contas a pagar
- contas a receber

Campos:

- descrição
- categoria
- valor
- vencimento
- pagamento/recebimento
- status
- empresa
- observação

Mostrar:

- total a pagar
- total a receber
- receitas
- despesas

Não implementar agora:

- contabilidade
- DRE completa
- OFX
- conciliação bancária
- integração bancária
- fiscal avançado

==================================================
24. RELATÓRIOS
==================================================

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

Não implementar BI avançado na V1.

==================================================
25. USUÁRIOS E ACESSOS
==================================================

Perfis iniciais:

ADMIN

- acesso completo

OPERADOR

- PDV
- caixa
- consulta de produtos
- operações necessárias ao atendimento

Configurar perfil dentro da tela de usuários.

Não criar uma tela independente e complexa de permissões.

A autorização deve ser verificada pelo backend.

==================================================
26. AUDITORIA
==================================================

Registrar operações relevantes:

- criação/alteração de produto
- ajustes de estoque
- vendas
- cancelamentos
- compras
- caixa
- alterações administrativas importantes

Registrar:

- usuário
- empresa
- data/hora
- ação
- entidade
- registro afetado

A interface de auditoria deve permitir:

- pesquisa
- filtros
- leitura clara

==================================================
27. TELAS ADMINISTRATIVAS
==================================================

Empresas, Usuários e Auditoria continuam existindo.

Porém, não devem dominar a experiência.

Evitar:

"formulário gigante dentro de uma caixa branca".

Adicionar:

- contexto
- hierarquia
- agrupamento
- apresentação refinada

==================================================
28. ARQUITETURA DE DADOS
==================================================

Embora o produto seja desktop, não acoplar os dados permanentemente
a uma única máquina caso isso inviabilize futura utilização por
múltiplos computadores.

Separar conceitualmente:

DESKTOP CLIENT

→ interface

SERVIÇOS / REGRAS DE NEGÓCIO

→ operações

PERSISTÊNCIA

→ dados

Escolher para a V1 a implementação mais simples que não crie
uma barreira arquitetural desnecessária para futura expansão.

Documentar essa decisão.

==================================================
29. ARQUITETURA TÉCNICA
==================================================

Evitar overengineering.

Separar adequadamente:

- desktop shell
- frontend
- backend/serviços
- banco
- autenticação
- validação
- regras de negócio

Utilizar banco relacional.

Entidades sugeridas:

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

==================================================
30. CONSISTÊNCIA
==================================================

Prioridade máxima para consistência entre:

- venda
- estoque
- caixa
- compras
- financeiro

Usar transações.

Nunca deixar operação crítica parcialmente gravada.

Nunca mascarar erro utilizando dados fictícios.

==================================================
31. SEGURANÇA
==================================================

Implementar:

- autenticação
- hash de senha
- sessão segura
- proteção de rotas
- autorização server-side
- validação
- sanitização

Nunca depender somente do frontend para proteger funcionalidades.

==================================================
32. QUALIDADE
==================================================

Manter:

- TypeScript
- tipagem forte
- tratamento de erros
- migrations
- seeds
- validação
- loading states
- empty states
- mensagens claras
- testes das regras críticas

Evitar dívida técnica desnecessária.

==================================================
33. DADOS DE DEMONSTRAÇÃO
==================================================

Criar dados realistas.

ADEGA JG:

- cerveja
- água
- refrigerante
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
- estoque
- movimentações
- financeiro

O ambiente de demonstração deverá parecer vivo.

==================================================
34. BUILD E INSTALAÇÃO
==================================================

O projeto deverá possuir processo reproduzível de build.

Gerar:

- .exe
ou
- .msi

preferencialmente também um instalador amigável:

NEXO-Setup.exe

Documentar:

1. desenvolvimento
2. testes
3. build
4. localização do build
5. instalação

O usuário final não deverá depender do ambiente de desenvolvimento.

==================================================
35. FORA DO ESCOPO DA V1
==================================================

NÃO implementar agora:

- NF-e
- NFC-e
- SAT
- TEF
- integração Stone
- Pix automático
- integração bancária
- conciliação bancária
- WhatsApp automático
- e-commerce
- catálogo online
- delivery
- comandas
- mesas
- cozinha
- impressão automática de pedidos
- fidelidade
- aplicativo mobile nativo
- offline avançado
- sincronização distribuída
- BI avançado
- multi-filial complexo
- contabilidade
- folha de pagamento
- CRM
- automações por IA

Essas funcionalidades pertencem a versões futuras.

==================================================
36. MILESTONES
==================================================

O projeto deverá possuir milestones oficiais e verificáveis.

Estados:

NÃO INICIADO
EM DESENVOLVIMENTO
EM VALIDAÇÃO
CONCLUÍDO
BLOQUEADO

Cada milestone deve possuir:

- objetivo
- tarefas
- progresso
- critérios de conclusão
- pendências
- bloqueios
- última atualização
- próxima ação

Não marcar como concluído apenas porque existem telas.

==================================================
37. M0 — FUNDAÇÃO TÉCNICA
==================================================

Objetivos:

- estrutura do projeto
- banco
- migrations
- autenticação
- empresas
- usuários
- isolamento por empresa
- shell desktop
- build inicial

Critério de conclusão:

O NEXO abre como aplicativo Windows, permite autenticação e alternância
correta entre Adega JG e Depósito JG.

Localhost isoladamente NÃO conclui M0.

==================================================
38. M1 — EXPERIÊNCIA E IDENTIDADE NEXO
==================================================

Objetivos:

- identidade oficial NEXO
- design system
- navegação definitiva
- sidebar
- cabeçalhos
- estados vazios
- feedback visual
- Dashboard base
- experiência desktop
- refinamento das páginas existentes

Critério de conclusão:

O sistema deixou de parecer um admin panel genérico e apresenta
linguagem visual própria e consistente.

==================================================
39. M2 — CADASTROS COMERCIAIS
==================================================

Objetivos:

- produtos
- categorias
- clientes
- fornecedores

Critério:

É possível cadastrar, pesquisar, editar, consultar e inativar os
registros necessários para a operação.

==================================================
40. M3 — ESTOQUE E COMPRAS
==================================================

Objetivos:

- estoque
- movimentações
- estoque mínimo
- compras
- recebimento
- atualização automática

Critério:

Uma compra confirmada aumenta corretamente o estoque e gera todo
o histórico relacionado.

==================================================
41. M4 — PDV E VENDAS
==================================================

Objetivos:

- PDV
- carrinho
- pesquisa
- código de barras
- pagamentos
- venda
- baixa automática

Critério:

Uma venda completa produz corretamente:

Venda
+
Itens
+
Pagamento
+
Baixa de estoque

de forma transacional.

==================================================
42. M5 — CAIXA E FINANCEIRO
==================================================

Objetivos:

- abertura
- entradas
- saídas
- vendas vinculadas
- fechamento
- contas a pagar
- contas a receber

Critério:

O ciclo financeiro diário pode ser realizado integralmente pelo NEXO.

==================================================
43. M6 — DASHBOARD E RELATÓRIOS
==================================================

Objetivos:

- faturamento
- vendas
- ticket médio
- estoque
- compras
- receitas
- despesas
- relatórios

Critério:

O administrador consegue compreender a situação operacional básica
do negócio através dos dados reais registrados.

==================================================
44. M7 — ESTABILIZAÇÃO DA V1
==================================================

Objetivos:

- testes dos fluxos críticos
- revisão de UX
- revisão visual
- bugs
- erros
- performance
- consistência
- build final
- instalador
- teste de instalação

Critério:

O fluxo:

Fornecedor
→ Compra
→ Estoque
→ Caixa
→ Venda
→ Pagamento
→ Financeiro
→ Dashboard
→ Relatório

funciona dentro do NEXO instalado no Windows.

==================================================
45. ROADMAP VISUAL
==================================================

Criar uma área:

DESENVOLVIMENTO
→ ROADMAP

Disponível somente para:

- desenvolvimento
- demonstração autorizada
- administrador apropriado

Apresentar visualmente:

NEXO
Gestão Comercial

Progresso da V1

M0 Fundação técnica
M1 Experiência e identidade
M2 Cadastros comerciais
M3 Estoque e compras
M4 PDV e vendas
M5 Caixa e financeiro
M6 Dashboard e relatórios
M7 Estabilização

Exemplo visual:

M0 Fundação técnica          ██████████ 100%
M1 Experiência               ███████░░░  70%
M2 Cadastros                 ███░░░░░░░  30%
M3 Estoque                   ░░░░░░░░░░   0%

Utilizar linguagem visual NEXO.

Não criar uma tabela técnica feia.

Preferir:

- timeline
- barras de progresso
- cards de milestone
- indicadores
- detalhes expansíveis

==================================================
46. DETALHE DO MILESTONE
==================================================

Ao abrir um milestone:

M3 — Estoque e Compras

Status:
EM DESENVOLVIMENTO

Progresso:
55%

CONCLUÍDO

✓ modelo de movimentação
✓ entrada manual
✓ estoque mínimo

EM DESENVOLVIMENTO

● compras
● recebimento

PENDENTE

○ histórico
○ testes transacionais

BLOQUEIOS

Nenhum

PRÓXIMO PASSO

Finalizar fluxo de recebimento.

==================================================
47. PROGRESSO REAL
==================================================

Nunca inventar progresso.

O percentual deve ser baseado em tarefas verificáveis.

Exemplo:

10 tarefas
7 concluídas
≈ 70%

Uma tarefa só está concluída quando:

- código existe
- integração funciona
- fluxo funciona
- testes relevantes passam

Código iniciado não significa tarefa concluída.

==================================================
48. FONTE DE VERDADE DO PROGRESSO
==================================================

Manter arquivo versionado:

docs/PROJECT_PROGRESS.md

Esse documento deverá registrar:

- milestone atual
- progresso
- tarefas concluídas
- tarefas em desenvolvimento
- tarefas pendentes
- bugs conhecidos
- bloqueios
- decisões relevantes
- próxima ação
- última atualização

O Roadmap visual deverá refletir conceitualmente essa mesma informação.

==================================================
49. ATUALIZAÇÃO OBRIGATÓRIA
==================================================

Ao concluir trabalho relevante:

1. validar implementação
2. executar testes
3. atualizar milestone
4. atualizar progresso
5. atualizar PROJECT_PROGRESS.md
6. registrar pendências
7. registrar próxima tarefa

Ao final de cada sessão significativa apresentar:

MILESTONE ATUAL

PROGRESSO

CONCLUÍDO

EM DESENVOLVIMENTO

PENDENTE

BLOQUEIOS

PRÓXIMO PASSO

==================================================
50. PROIBIÇÃO DE PROGRESSO ARTIFICIAL
==================================================

Não iniciar diversos módulos simultaneamente apenas para aparentar avanço.

Priorizar conclusão vertical.

É melhor possuir:

Produtos 100% funcional

do que:

Produtos 30%
Estoque 20%
PDV 10%
Financeiro 5%

Não criar páginas vazias somente para dizer que um módulo foi iniciado.

==================================================
51. REGRA CONTRA INTERFACE GENÉRICA
==================================================

Antes de considerar uma tela finalizada, verificar:

- Parece um template?
- Parece apenas um CRUD?
- Existe identidade NEXO?
- Existe contexto?
- A hierarquia está clara?
- Existe ação principal?
- O próximo passo é evidente?
- O espaço está sendo utilizado intencionalmente?
- Os componentes parecem pertencer ao mesmo produto?
- A interface ajuda o usuário a trabalhar?

Caso a resposta seja inadequada, revisar a tela.

==================================================
52. REGRA DE CONTROLE DE ESCOPO
==================================================

Antes de implementar uma nova ideia, perguntar:

"Isso é necessário para que a Adega JG ou o Depósito JG consiga
comprar, vender, controlar estoque, caixa ou financeiro na V1?"

Se a resposta for NÃO:

não implementar agora.

Registrar como evolução futura.

==================================================
53. FLUXO DE DESENVOLVIMENTO
==================================================

Antes de cada funcionalidade:

1. entender objetivo
2. analisar impacto
3. revisar modelo de dados
4. identificar dependências
5. implementar
6. testar
7. validar integração
8. revisar UX
9. atualizar milestone
10. atualizar documentação

Não considerar uma funcionalidade pronta apenas porque sua interface
está visível.

==================================================
54. AUTONOMIA DO AGENTE
==================================================

O agente possui liberdade para:

- reorganizar componentes
- refatorar
- melhorar arquitetura
- melhorar UX
- melhorar textos
- melhorar navegação
- remover redundâncias
- corrigir inconsistências
- simplificar soluções

desde que preserve:

- objetivos da V1
- integridade dos dados
- identidade NEXO
- funcionalidades válidas
- controle de escopo

Não adicionar complexidade simplesmente por ser tecnicamente possível.

==================================================
55. DEFINIÇÃO DE PRONTO DA V1
==================================================

A V1 estará pronta quando for possível:

Instalar NEXO
→ abrir aplicativo
→ autenticar
→ selecionar empresa
→ cadastrar fornecedor
→ cadastrar produto
→ registrar compra
→ estoque aumentar
→ abrir caixa
→ registrar venda
→ estoque diminuir
→ pagamento entrar no caixa
→ fechar caixa
→ registrar financeiro
→ consultar Dashboard
→ consultar relatório

Tudo funcionando:

- na Adega JG
- no Depósito JG
- com dados isolados
- com autenticação
- com histórico
- com consistência
- através do aplicativo Windows

==================================================
56. CRITÉRIO VISUAL FINAL
==================================================

Ao abrir o NEXO, a impressão desejada é:

"Esse software foi realmente pensado para administrar este negócio."

e não:

"Esse é apenas mais um painel administrativo."

O NEXO deve possuir identidade própria sem sacrificar produtividade.

A interface deve ser bonita o suficiente para transmitir qualidade
e simples o suficiente para ser utilizada diariamente.

O visual deve servir à operação.

Nunca competir com ela.

==================================================
57. ORDEM DE PRIORIDADE
==================================================

Em caso de conflito:

1. Integridade dos dados
2. Correção funcional
3. Simplicidade operacional
4. Experiência do usuário
5. Manutenibilidade
6. Performance
7. Qualidade visual
8. Recursos adicionais

==================================================
58. PRINCÍPIO FINAL
==================================================

O objetivo não é construir o maior sistema possível.

O objetivo é construir:

NEXO
Gestão Comercial

uma primeira versão:

pequena o suficiente para terminar,
boa o suficiente para usar,
bonita o suficiente para ter identidade,
e sólida o suficiente para evoluir.
