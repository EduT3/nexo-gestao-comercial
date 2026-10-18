# Compras, orientação do caixa e financeiro — 18/10/2026

## Resultado

F3, F4 e F6 da reavaliação foram implementados no NEXO local Windows. O aviso de produto salvo (restante de F5) também passou a ficar visível. Recuperação e histórico de vendas da etapa anterior foram preservados. Não houve mudança de esquema SQLite, exclusão de histórico ou uso de dados reais.

| Área | Comportamento entregue |
| --- | --- |
| Compras | Subtotal por item, total exato, fornecedor/vencimento em uma conferência antes de salvar; remoção de qualquer linha com identidade e foco preservados |
| Vender | Situação do caixa antes da conclusão; caixa próprio, fechado, de outro operador e falha de consulta tratados distintamente; atalho Ir ao caixa mantém o rascunho |
| Caixa | Nome do responsável e ocultação das ações que exigem ser dono da sessão; sessão aberta permanece incluída mesmo com mais de cem fechamentos |
| Financeiro | Pagar, Receber e Resumo separados dentro do menu existente; uma tarefa visível por vez, com consultas apenas da área ativa |
| Contas | Busca sem acento, situação, intervalo de vencimento e vencidas em aberto; datas brasileiras, contexto da conta antes de baixar/estornar e páginas de cinquenta na interface |
| Retorno das ações | Mensagens legíveis nas áreas alteradas; produto salvo confirmado fora do formulário que acabou de fechar; erro corrigido de item não permanece como aviso antigo |

## Uso

### Compras

Escolha o fornecedor e preencha os itens. Os subtotais usam arredondamento comercial por item, igual ao serviço de gravação, com centavos e milésimos inteiros. Remover item corrige qualquer posição; ao remover a única linha, uma linha vazia nova substitui a anterior. O foco vai para o produto seguinte ou anterior.

Confira fornecedor, total e vencimento no quadro antes de Receber compra. Total incompleto não aparece como soma final de itens parcialmente válidos. Quantidade zero, formato inválido e produto repetido são recusados; custo zero continua permitido conforme a regra existente, mas uma conta a pagar precisa ter valor positivo. Estoque e compras anteriores ficam em Consultar estoque e compras recebidas. Alternar telas da mesma empresa mantém o rascunho; trocar empresa ou fechar continua descartando os campos não gravados.

### Vender e Caixa

É possível preparar a venda sem caixa aberto, mas Concluir venda só fica disponível após conferir um caixa aberto para o usuário atual. Ir ao caixa permite abrir a sessão e voltar aos itens, cliente e observações já preenchidos. Se a consulta falhar, a conclusão fica bloqueada e há uma nova tentativa de conferência; falha de leitura não é apresentada como caixa fechado.

Uma consulta local específica lê somente a sessão aberta e seus movimentos, com autorização de empresa e leitura transacional. Retorna responsável, permissão para vender e saldo físico exato, sem carregar todo o histórico de sessões para o PDV. A lista da tela Caixa prioriza a sessão aberta dentro do recorte histórico existente.

A condição é renovada ao entrar/voltar à tela e após os eventos relevantes. Não há consulta periódica contínua. Se o caixa mudar depois da conferência, o serviço continua validando a condição na gravação; o erro legível mantém o rascunho e a situação é consultada novamente. Outro operador não pode movimentar nem fechar a sessão, inclusive por IPC; não foi criado um atalho administrativo para ignorar essa regra.

### Financeiro

- Pagar inicia com contas em aberto. A lista identifica fornecedor, referência da compra, vencimento, valor e situação. A seleção para pagamento/estorno repete o contexto da conta antes da confirmação.
- Receber inicia pela lista. Nova conta a receber abre o cadastro sob demanda; mudar de tarefa conserva o rascunho da mesma empresa. Cadastrar com sucesso fecha o formulário, limpa filtros para exibir contas em aberto e confirma o resultado.
- Resumo contém o resumo diário por data e o resumo financeiro acumulado. Esses totais continuam identificando seu período e distinguindo todas as formas de pagamento do dinheiro do caixa.
- Use Pagas/Recebidas ou Todas para consultar baixas. Somente vencidas em aberto considera vencimento anterior ao dia local de hoje, excluindo contas baixadas e contas que vencem hoje. Datas inicial/final são inclusivas.

A busca, os filtros e a paginação de contas são da interface sobre a coleção devolvida pelo serviço atual. Esta etapa não converteu o financeiro em consultas SQL paginadas nem mediu uma base empresarial grande.

## Implementação e integridade

LocalFinancialWorkspace organiza os componentes de pagar, receber, resumo diário e resumo acumulado. LocalWorkspace preserva os componentes visitados; useLocalQuery bloqueia leituras escondidas e invalida respostas antigas ou de outra empresa. O contêiner financeiro remonta por empresa/restauração para não levar campos ou operações para outro contexto. A navegação principal permaneceu com os mesmos itens.

O serviço financeiro passou a devolver o fornecedor das contas a pagar usando relações compostas por empresa. Dinheiro, estoque, auditoria, pagamentos e estornos continuam nos serviços transacionais existentes. O novo estado can_operate na consulta do caixa orienta a interface; a autorização real permanece no serviço. A ponte só ganhou cashAvailability, sem SQL ou caminhos livres expostos.

Os componentes alterados foram revisados quanto a hooks, consultas ativas, identidade das linhas, preservação dos campos, mensagens, rótulos e controles de teclado. Tabelas com rolagem própria aceitam foco por teclado. Isso não substitui uma homologação manual com leitor de tela.

## Evidências concluídas

- Tipagem e build desktop aprovados; prévia fictícia compilada separadamente, sem regenerar os dados de demonstração nem publicar.
- **38 arquivos / 147 testes de regras e funções aprovados**. Onze testes novos cobrem arredondamento/precisão, inválidos, filtros, mensagens, acesso por empresa/operador, saldo do caixa, leitura sem auditoria adicional e sessão aberta após 101 fechamentos.
- **23 regressões de interface aprovadas**, com ponte fictícia: vinte adaptadas/preservadas e três novas para caixa indisponível/de outro operador, áreas financeiras/rascunho e correção da linha da compra. Respostas e erros atrasados, snapshots anteriores à gravação e troca de empresa continuam cobertos.
- **Quatro regressões anteriores aprovadas**, em execução distinta: empresa/rascunho, Excel e tutorial da demonstração. Total desta rodada: 27 verificações de navegador, sem contagem duplicada.
- Executável final NEXO-Windows-1792341909772 testado offline, com janela oculta, LOCALAPPDATA temporário, PATH mínimo e NODE_PATH/NODE_OPTIONS vazios: **dez grupos completos aprovados**, sem erro do renderer.
- Compra A/C: 1,255 x R$1,01 = R$1,27 e 0,500 x R$3,33 = R$1,67; total gravado R$2,94, estoque exato e conta a pagar do mesmo valor. Item do meio removido sem alterar os demais; campos e foco preservados, inválidos sem compra parcial.
- Venda com caixa fechado ficou bloqueada antes da tentativa, mantendo campos. Caixa fechado posteriormente à conferência também foi recusado pelo serviço, sem venda parcial nem prefixo técnico. Abertura pelo atalho e retorno ao rascunho aprovados.
- Pagamento PIX de R$2,94, recebimento PIX de R$7,50 e venda em dinheiro de R$2,00: resumo financeiro líquido R$6,56 e caixa físico R$12,00, incluindo R$10,00 de abertura. Pagamento e recebimento foram estornados e refeitos, preservando registros compensatórios. Recusar o confirmador de estorno manteve a baixa.
- 55 contas abertas alcançadas em páginas 50/5, com busca sem acento, situação e vencimento. Uma conta recebida foi encontrada com filtro por dia. Somente uma tarefa apareceu por vez; outra empresa não recebeu os registros.
- Operador sem financeiro na tela e por IPC. Ao existir caixa de outro usuário, o administrador recebeu orientação e também foi impedido de fechá-lo pelo serviço.
- Fechar/reabrir preservou compra, venda, 56 contas, compensações, totais e responsável pelo caixa.

Roteiro e recibo principal: scripts/verify-local-commerce-usability.mjs e artifacts/commerce-usability-1792341919145/result.json. Sete capturas na mesma pasta foram inspecionadas: compra, PDV, Pagar, Receber, Resumo, 900x650 e 200%. Não houve transbordamento horizontal da página nos estados medidos; a tabela dispõe de sua própria rolagem quando necessária. Diálogos nativos foram respondidos pelo roteiro.

Ocorrências de validação: uma expectativa aritmética do teste grande foi corrigida para o arredondamento ao centavo já definido; a implementação permaneceu exata. Testes antigos foram alinhados aos destinos novos e ao histórico de compras recolhido. Na primeira execução nativa, o teste de reabertura conservava um localizador da janela antiga; a referência foi corrigida e o pacote final passou integralmente. A inspeção visual identificou um aviso de item já corrigido ainda visível, e o formulário passou a limpar esse aviso na edição antes do pacote final.

Regressões adicionais concluídas no mesmo pacote: carrinho/remoção de itens em dez grupos (artifacts/sales-removal-1792342088784/result.json), navegação comercial (scripts/verify-local-navigation.mjs), tutorial em quatro aberturas com hash lógico comercial preservado (artifacts/tutorial-1792342182594/result.json) e restauração pelo menu normal com confirmação no login (artifacts/restore-feedback-1792342293039/result.json). Todas passaram, sem erro do renderer.

## Distribuição

Pacote: artifacts/NEXO-Windows-1792341909772/NEXO.exe.
ZIP: artifacts/NEXO-Windows-compras-caixa-financeiro-2026-10-18.zip.

ZIP conferido em todas as 1.079 entradas de arquivo por SHA-256 contra o pacote: 173.637.032 bytes. Recibo: artifacts/zip-commerce-usability-2026-10-18.json. SHA-256 do ZIP: 84C5474074F3AA86217CD8065F5E5E4CF7073F2B08093B912DCE13723ABFC7DB.

Gere um backup, feche o NEXO anterior, extraia o ZIP e abra o novo NEXO.exe com os demais arquivos juntos. Os dados ficam em %LOCALAPPDATA%/NEXO e não devem ser movidos nem apagados. As instruções do pacote e do tutorial foram atualizadas.

O pacote continua portátil, sem instalador tradicional ou assinatura digital. Não houve publicação GitHub/Vercel. A prévia foi verificada quanto à regressão; a nova organização operacional está no aplicativo Windows.

## Limites e continuidade

Não foram usados dados reais, outra máquina Windows limpa, leitor de tela manual ou ensaio com base de grande volume. Reabertura foi validada no mesmo pacote; não alegar uma migração empresarial ou homologação em outra máquina. Recuperação e histórico anteriores seguem cobertos pelos testes de regra; suas evidências nativas anteriores permanecem no relatório da etapa precedente.

Continuam como evolução estrutural: identificação da versão/build dentro do app, extração adicional de LocalApp, contratos centrais da ponte, medição de inicialização/consultas com bases grandes e paginação SQL de outros históricos. Histórico de vendas ainda fica abaixo da nova venda; seu acesso paginado continua disponível. Esses itens não foram declarados concluídos por esta correção de uso.
