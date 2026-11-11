/goal

# NEXO — Gestão Comercial local, simples e utilizável

## Objetivo principal

Redirecionar o NEXO para um aplicativo de uso local no Windows, voltado à operação cotidiana da Adega JG e do Depósito JG.

A entrega deve ser um programa que o usuário consiga abrir, utilizar e fechar normalmente, com dados salvos no computador e interface amigável. Manter uma versão web para visualizar a evolução do produto.

A prioridade é: funcionamento real, facilidade de uso e acabamento visual. Não transformar o projeto em uma plataforma empresarial complexa.

## 1. Corrigir a direção sem descartar o trabalho útil

Antes de implementar, verificar o estado atual e identificar o que pode ser aproveitado: telas, regras comerciais, cálculos, validações e testes.

Adaptar o necessário para funcionamento local. Não reescrever tudo por preferência tecnológica.

Ao adotar este objetivo, atualizar GOAL, ROADMAP, STATUS e AGENTS para remover conflitos com a nova arquitetura. Exigências anteriores de PostgreSQL em produção e API HTTP obrigatória deixam de orientar esta versão local.

Preservar as regras de integridade e separação das empresas. Não substituir funcionalidades existentes por simulações.

## 2. Uso local de verdade

O produto final deve:

- Abrir por um atalho ou executável do Windows.
- Funcionar sem internet nas operações diárias.
- Salvar automaticamente os registros no computador.
- Manter os dados depois de fechar, reiniciar e reabrir.
- Não exigir terminal, comandos, Node.js, Docker ou banco de dados instalado pelo usuário.
- Não depender de servidor remoto, serviço do Windows ou servidor HTTP em localhost, mesmo que escondido pelo instalador.
- Incluir os recursos necessários para executar a interface sem depender de serviços externos.

Ferramentas de desenvolvimento podem existir durante a construção, mas não fazer parte da rotina do operador.

Reaproveitar a interface web existente dentro do aplicativo. Escolher o empacotamento que permita a entrega mais simples e o melhor reaproveitamento, sem transformar a escolha tecnológica em uma nova fase extensa de pesquisa.

A primeira versão atende um computador por instalação. Não incluir sincronização entre computadores nem banco compartilhado em rede.

Adega JG e Depósito JG devem continuar com registros separados e identificação clara da empresa em uso.

## 3. Dados locais e integração com Excel

Usar um arquivo SQLite local como armazenamento principal, sem servidor de banco de dados. Excel será o formato acessível para importar cadastros e exportar consultas e relatórios.

Não é necessário exigir Excel instalado para o aplicativo funcionar.

Requisitos:

- Guardar a base ativa em uma pasta local apropriada, fora do OneDrive e da pasta de instalação.
- Disponibilizar uma tela simples mostrando onde os dados ficam.
- Exportar produtos, estoque, vendas e informações financeiras para arquivos Excel, conforme os módulos entregues.
- Começar a importação por cadastros de produtos, com modelo de planilha, prévia, validação e tratamento de duplicidades.
- Não alterar os registros internos automaticamente quando uma planilha exportada for editada.
- Não usar várias planilhas como substituto improvisado das transações de venda, estoque e caixa.

Manter valores monetários exatos, histórico de movimentações e gravações completas: uma operação não pode salvar a venda e deixar o estoque ou o caixa pela metade.

Se houver dados anteriores a migrar, preservar a origem, trabalhar sobre uma cópia e comparar os resultados antes de substituir qualquer base.

## 4. Escopo comercial essencial

Concentrar a primeira versão em:

- Produtos, categorias, clientes e fornecedores.
- Compras e entradas de mercadoria.
- Estoque e histórico de movimentações.
- Venda simples, com itens, descontos e formas de pagamento.
- Abertura, movimentação e fechamento de caixa.
- Contas a pagar e receber básicas.
- Cancelamentos e estornos, preservando o histórico.
- Resumo do dia e relatórios simples de vendas, estoque e financeiro.

Preservar os acessos de administrador e operador quando necessários, sem autenticação em nuvem ou administração complexa de permissões.

Validar empresa e permissões na camada local que executa as operações, não apenas escondendo botões. Não apresentar esses controles como proteção contra quem possui acesso administrativo ao computador.

Não adicionar módulos novos antes de concluir o fluxo comercial principal.

## 5. Interface amigável

A interface deve parecer um programa de trabalho pronto para uso, não um painel técnico.

- Português claro e termos conhecidos pelo operador.
- Empresa selecionada sempre visível.
- Navegação curta, com ações frequentes fáceis de encontrar.
- Formulários objetivos, bons padrões e pouca rolagem.
- Busca de produtos rápida e operação confortável pelo teclado.
- Totais, troco, saldo e situação do caixa bem destacados.
- Mensagens que expliquem o problema e como resolvê-lo.
- Confirmação para cancelar, estornar ou restaurar dados.
- Aparência consistente, legível e sem excesso de cartões, gráficos ou animações.

Priorizar telas de computador comuns. Não adiar a entrega local por refinamentos de celular que não sejam essenciais à visualização web.

## 6. Manter a visualização web

Preservar uma versão web navegável para acompanhar a aparência e a evolução do NEXO, reutilizando a mesma interface sempre que possível.

Essa versão deve:

- Exibir claramente que é uma demonstração.
- Utilizar somente dados fictícios.
- Não acessar nem enviar a base real do computador.
- Informar quando uma ação estiver indisponível.
- Nunca apresentar uma gravação simulada como operação real concluída.

A versão web não substitui o aplicativo local e não deve exigir a construção de um servidor de produção.

Não publicar novas versões nem enviar dados a serviços externos sem solicitação. O trabalho na prévia não deve atrasar o funcionamento local.

## 7. Backup e recuperação

Entregar junto da persistência local:

- Botão para gerar backup consistente da base.
- Identificação da data do último backup.
- Restauração com validação, confirmação explícita e cópia de segurança do estado anterior.
- Orientação curta para guardar uma cópia em outro dispositivo.

Exportar Excel não equivale a fazer backup completo.

Atualizar ou reinstalar o programa não pode apagar os dados. Os testes devem utilizar bases temporárias, nunca registros reais das empresas.

## 8. Ordem de entrega

### Etapa 1 — Programa local utilizável

Entregar primeiro uma versão que abra no Windows, permita selecionar a empresa, cadastrar um produto, salvar, fechar e reabrir com os dados preservados.

Incluir backup e restauração básicos. Verificar o aplicativo empacotado, não somente o ambiente de desenvolvimento.

### Etapa 2 — Operação comercial completa

Adaptar e validar o fluxo:

Compra → entrada no estoque → abertura de caixa → venda → atualização de estoque e financeiro → fechamento.

Verificar também cancelamento, estorno, tentativa duplicada e separação entre empresas.

### Etapa 3 — Excel, consultas e usabilidade

Concluir importações e exportações prioritárias, relatórios essenciais e melhorias de uso observadas no fluxo real.

### Etapa 4 — Entrega final

Entregar instalador ou pacote executável, instruções curtas, localização dos dados, procedimento de backup e limitações conhecidas.

Atualizar a visualização web para refletir o que foi realmente entregue.

## 9. Limites e critério de conclusão

Ficam fora desta versão: serviços em nuvem, múltiplos terminais sincronizados, microsserviços, emissão fiscal, integrações bancárias automáticas, e-commerce, delivery, CRM, BI avançado e inteligência artificial.

Manter testes proporcionais aos riscos reais: cálculos, integridade das gravações, isolamento das empresas, cancelamentos, recuperação e uso do aplicativo instalado. Não usar infraestrutura e testes específicos de servidores como condição para concluir um produto que não terá servidor.

Registrar o progresso por funcionalidades demonstráveis. Compilar, abrir uma página ou passar testes isolados não significa que o aplicativo está pronto.

O objetivo estará concluído quando for possível instalar ou abrir o NEXO em um Windows sem ambiente de desenvolvimento, trabalhar sem internet, executar o fluxo comercial principal, fechar e reabrir sem perder registros, exportar informações para Excel e recuperar uma cópia de segurança.

**Regra de prioridade: cada decisão deve aproximar o usuário de abrir o programa e trabalhar. Complexidade adicional só entra quando resolve uma necessidade concreta deste escopo.**

## Direção de usabilidade confirmada — 10/11/2026

Inspirar-se na clareza do Bolsário: português simples, poucas opções iniciais e descrição curta onde ajuda. Prioridade: gerenciar estoque, registrar entradas e cadastrar produtos na mesma área, sem navegação entre módulos para completar essa tarefa. Mostrar quantidade junto ao cadastro; preservar o rascunho ao cadastrar produto/fornecedor durante uma entrada. Tutorial é apoio opt-in. Manter as operações reais de compra/estoque e sua autorização; não transformar cadastro simples em movimento silencioso.


## Ajuste de uso — 10/11/2026

Áreas distinguíveis por blocos, rótulos e cores inspiradas no Bolsário. Cadastro de fornecedor não é pré-requisito para entrada de estoque; cadastro de cliente não é pré-requisito para venda. Identificação permanece disponível como opcional. Atalhos entre áreas relacionadas devem preservar o rascunho na sessão. Implementação/evidências em ROTINAS-SIMPLES-2026-11-10.md.
