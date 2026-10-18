# Reavaliação do NEXO — 18/10/2026

## Conclusão

**O núcleo comercial funciona nos cenários testados e a arquitetura serve ao uso local em um computador. A próxima evolução deve concentrar recuperação de falhas, consulta de histórico e clareza dos fluxos.**

Eu manteria a base Electron/SQLite e faria correções incrementais. Para uso cotidiano sem assistência, priorizaria os achados de alta prioridade abaixo. Não houve erro de saldo, perda de registro nem gravação parcial nos cenários executados; isso não é uma garantia para todos os estados possíveis.

| Eixo | Avaliação | Evidência desta rodada |
| --- | --- | --- |
| Estrutura | Adequada ao escopo local, com pontos de manutenção | Electron sem servidor, IPC restrito, permissões nos serviços, transações, cálculos inteiros e migrações; funcionamento offline do pacote atual |
| Funcionamento | Fluxo principal consistente; lacunas em recuperação e histórico | Compra/venda/caixa/PIX, backup/restauração e reabertura passaram; reproduzidos encerramento na abertura inválida e limite de 100 vendas |
| Facilidade de uso | Menu melhor organizado; operação ainda pede orientação | 13 estados capturados e inspecionados: falta conferência de compra, identificação da venda, antecipação do caixa e retorno visível de algumas ações |

## Escopo e método

- Código atual de D:/Projetos/ERP, preservando as alterações locais existentes. Pacote gerado para avaliação: artifacts/NEXO-Windows-1792337694225/NEXO.exe. O processo principal do pacote tem o mesmo SHA-256 do código local.
- Roteiro do Product Design/audit aplicado ao aplicativo Windows, com capturas nativas do Electron, sem usar um navegador conectado à conta do usuário. Capturas aceitas após inspeção antes da etapa seguinte na execução principal.
- Janela oculta, modo offline, LOCALAPPDATA temporário, PATH mínimo e NODE_PATH vazio. Nenhuma base real utilizada.
- Fornecedor, segundo produto e massa de 101 vendas foram preparados pela ponte local para isolar os cenários. Não representam cadastro manual de todos os dados nem observação de um operador real.
- Tipagem, build local e 34 arquivos/123 testes aprovados novamente. A suíte inclui testes locais e do legado; o número não equivale a 123 fluxos de interface.
- Novas verificações: scripts/reevaluate-local.mjs e scripts/reevaluate-startup.mjs. Reexecutados verify-local-sales-removal.mjs e verify-local-improvements.mjs no mesmo pacote atual. Nenhuma funcionalidade foi corrigida ou publicada nesta reavaliação.

## Achados prioritários

### F1 — Alta: falha na abertura não oferece recuperação ao usuário

**Reprodução:** com um arquivo SQLite artificial ilegível, o executável encerrou com código 0 e escreveu somente `Falha ao abrir NEXO: file is not a database` na saída técnica. Uma base artificial com versão 12 também foi recusada e encerrou, com mensagem técnica de versão incompatível.

A proteção contra abrir dados incompatíveis está correta. A lacuna é a recuperação: a janela só é criada depois da preparação da base; a exceção encerra o app. O botão Restaurar backup fica dentro da interface que não abre nesse cenário. Para quem usa um ZIP pelo Windows, o motivo pode não ser visível.

**Recomendação:** uma entrada de recuperação independente da abertura bem-sucedida da base, com mensagem clara e opções para selecionar backup, localizar dados e guardar o diagnóstico. Preservar o arquivo original e exigir confirmação antes de substituí-lo.

Fonte: [main.cjs](/D:/Projetos/ERP/electron/main.cjs:219). Evidência: [teste de abertura](/D:/Projetos/ERP/artifacts/reevaluation-startup-2026-10-18-1792338665293/result.json). Sem captura dessa falha: não há janela criada nesse caminho; a conclusão combina o log do teste e a ordem do código.

### F2 — Alta: histórico não permite identificar ou alcançar todas as vendas

Duas vendas reais de R$5,00, em dinheiro e com R$5,00 de troco, geraram linhas idênticas com ação Cancelar venda. A lista não mostra data/hora, número interno, cliente nem detalhes dos itens. O serviço já seleciona a data, mas a interface não a apresenta.

Com 101 vendas fictícias registradas no Depósito, o banco manteve 101 e a API/tela devolveu 100, sem paginação ou aviso do recorte. **Não houve exclusão de dados**, mas uma venda fora do recorte não fica alcançável por essa lista para consulta/cancelamento. Limites semelhantes de 100 aparecem no código de compras e caixas; o caso acima de 100 foi reproduzido nesta rodada para vendas.

**Recomendação:** identificação inequívoca da venda, detalhes antes de cancelar, filtros e paginação real no serviço/tela. Separar a tarefa Nova venda da tarefa Consultar histórico para evitar uma longa lista abaixo do PDV.

Fontes: [consulta limitada](/D:/Projetos/ERP/src/local/sales.ts:58), [tabela de vendas](/D:/Projetos/ERP/src/client/LocalSales.tsx:70). Capturas 07/10 e contagens no resultado principal.

### F3 — Média: compra confirma estoque e conta sem total prévio

A compra de 2 unidades a R$2 e 3 a R$3 foi gravada corretamente por R$13,00. Antes da confirmação, a tela não apresenta subtotal por linha nem total da compra. Também só permite remover o último item, dificultando corrigir uma linha anterior sem retrabalho.

**Recomendação:** subtotal e total calculados com as regras exatas existentes, remoção individual de item e conferência simples do fornecedor/vencimento antes de receber. Não requer novo módulo.

Fonte: [formulário de compras](/D:/Projetos/ERP/src/client/LocalPurchases.tsx:47). Captura 05.

### F4 — Média: o PDV revela condições necessárias tarde demais

A venda com caixa fechado foi corretamente bloqueada e o rascunho sobreviveu à ida ao Caixa. Entretanto, a condição só apareceu depois de Concluir venda, com prefixos técnicos como `Error invoking remote method 'nexo:confirm-sale'`.

**Recomendação:** mostrar estado/responsável do caixa antes da conclusão, orientar a abertura e converter erros em mensagens simples e acionáveis. O seletor de produtos é uma lista nativa por nome, sem campo próprio de busca por nome/código no PDV; avaliar uma busca com teclado para catálogos maiores. Não foi medido tempo de seleção com catálogo empresarial grande.

Fonte: [PDV](/D:/Projetos/ERP/src/client/LocalSales.tsx:63). Captura 06.

### F5 — Média: algumas ações concluem sem confirmação visível

Após salvar produto, a linha aparece e o formulário fecha, mas a mensagem `Produto salvo no computador` fica dentro da seção escondida. O teste registrou `productSavedFeedbackVisible=false`. Após restaurar, o hash da base coincidiu com o backup e o acesso voltou ao login, mas sem mensagem explicando o sucesso e a necessidade de entrar novamente.

**Recomendação:** mensagens de resultado em uma região visível e acessível, independente do formulário recolhido; aviso específico no retorno ao login após restauração.

Fonte: [salvamento de produto](/D:/Projetos/ERP/src/client/LocalApp.tsx:171), seção de status em LocalApp e LocalLogin. Capturas 04/12.

### F6 — Média: o financeiro reúne tarefas diferentes em uma página longa

Resumo do dia, contas a receber e resumo financeiro/contas a pagar ficam empilhados. Na entrada, o resumo ocupa a primeira tela; pagar/receber exige rolagem. Datas de tabela em ISO, como 2026-10-21, diferem do formato do formulário. Alguns botões de estorno/cancelamento usam apresentação pequena/padrão do navegador, diferente das ações principais.

**Recomendação:** subáreas claras dentro de Financeiro — Pagar, Receber e Resumo — com filtros por situação/vencimento e datas em português. Preservar a navegação principal curta. Padronizar controles e foco, sem adicionar gráficos ou cartões desnecessários.

Fonte: [Financeiro](/D:/Projetos/ERP/src/client/LocalFinance.tsx:19) e LocalApp. Capturas 08/09.

## Estrutura: o que manter e o que evoluir

**Manter:** persistência fora da pasta do programa, validação de empresa/perfil no serviço, transações com auditoria, histórico preservado, centavos/milésimos inteiros, contexto isolado, preload restrito e rascunhos preservados na navegação da mesma empresa. O operador foi recusado no financeiro e na outra empresa também por IPC.

**Evoluir em etapas posteriores:**

1. Extrair Produtos, Backup e navegação do LocalApp, hoje responsável por muitas tarefas e uma extensa expressão de renderização. Centralizar contratos da ponte em um módulo compartilhado e reduzir dependência de schemas dentro do servidor legado sem mudar as regras.
2. Medir abertura e consultas com bases grandes. A inicialização cria uma cópia consistente e valida integralmente a base em toda abertura; caixa/estoque/financeiro ainda leem históricos extensos, e a paginação do catálogo limita a renderização, não o volume SQL. São riscos de crescimento identificados no código, não lentidão comprovada com uma base empresarial nesta rodada.
3. Identificar versão/build dentro do app. O pacote continua com versão 0.1.0 e o rodapé mostra V1, enquanto diretórios de distribuição têm nomes por timestamp. Isso dificulta suporte e saber qual cópia está aberta. A atualização continua manual pelo ZIP.
4. Acrescentar regressões para F1/F2 e para mensagens visíveis. Os testes de regras atuais passaram e mesmo assim não cobriam satisfatoriamente esses estados de uso.

**Detalhe de compatibilidade:** no cenário artificial de versão 12, o hash binário mudou durante a tentativa de abertura. O banco é aberto/configurado antes de verificar a versão. O teste não contém registros financeiros e não demonstra perda de conteúdo. Recomendo preflight de compatibilidade somente leitura. No cenário de arquivo ilegível, o arquivo de entrada permaneceu idêntico.

## Percurso capturado e saúde de cada etapa

| Etapa | Tarefa | Saúde geral |
| --- | --- | --- |
| 01 | Primeiro acesso | Bom: entrada objetiva e foco no nome |
| 02 | Início e tutorial | Funciona; boas-vindas ocupa muita altura |
| 03 | Cadastro de produto | Funciona; entrada Novo produto repetida enquanto cadastro está aberto |
| 04 | Produto salvo/lista | Registro correto; confirmação escondida |
| 05 | Compra preenchida | Gravação correta; conferência prévia insuficiente |
| 06 | Venda com caixa fechado | Regra protege os dados; orientação tardia e técnica |
| 07 | Duas vendas iguais | Valores corretos; identificação insuficiente para ação de cancelamento |
| 08 | Entrada no financeiro | Resumo coerente; tarefas ficam abaixo da primeira tela |
| 09 | Pagar/receber | Valores corretos; apresentação densa e datas inconsistentes |
| 10 | Histórico com 101 vendas | Limitação reproduzida: 100 acessíveis na lista |
| 11 | Backup e diagnóstico | Bom: arquivo criado, data visível, diagnóstico sem alterar registros |
| 12 | Pós-restauração | Dados corretos e cópia anterior preservada; resultado não explicado no login |
| 13 | Operador | Bom: menu restrito e empresa permitida; bloqueios também no serviço |

## Verificações funcionais desta rodada

- Compra R$13,00: estoque de 2 águas e 3 refrigerantes, com conta a pagar.
- Duas vendas de R$5: troco R$5 em cada, estoque e caixa corretos. Caixa físico final R$10.
- Pagamento PIX de R$13 e recebimento PIX de R$2: saldo financeiro -R$1 e caixa físico ainda R$10.
- Backup/restauração: hash de todas as tabelas recuperado, produto posterior descartado da base ativa como esperado e cópia anterior preservada.
- Reabertura com dados preservados; operador sem acesso ao financeiro e a outra empresa.
- Verificação complementar de remoção de itens: teclado/foco, arredondamento, desconto excessivo, recebido insuficiente, PIX, remoção de primeiro/meio/último/único, preservação de rascunho e venda gravada. Tela de venda inspecionada em 900×650 e zoom 200%; sem transbordamento horizontal no cenário executado.
- Excel no pacote atual: biblioteca adiada; modelo, prévia sem gravação, confirmação, exportação com oito abas e isolamento passaram com arquivo real. O diálogo nativo não foi auditado visualmente.

## Ordem recomendada para a próxima implementação

1. Entrada de recuperação quando a base não abre; preservar original e comunicar a causa.
2. Histórico de vendas identificável e paginado, com teste acima de 100 registros.
3. Conferência de compras e estado do caixa no PDV.
4. Mensagens visíveis, tratamento de erros e reorganização interna do financeiro.
5. Manutenção estrutural, identificação da versão e ensaios com base grande.

Não é necessário recomeçar o sistema para executar esse roteiro.

## Limites da avaliação

Esta rodada não é homologação em outro Windows limpo, teste com dados reais, observação de operador real, medição completa de contraste ou certificação de acessibilidade. O teste de teclado/foco é da venda; não comprova que toda a aplicação pode ser operada por teclado/leitor de tela. Não foi feita auditoria de segurança abrangente nem revalidação visual da demonstração web.

A primeira execução do roteiro parou por um seletor excessivamente exato no harness de teste, sem atribuir isso ao app. O seletor foi corrigido e o percurso completo foi reexecutado. Falhas de abertura são cenários intencionais e reproduzidos, não falhas acidentais do harness.

Somente roteiros/evidências/documentação foram acrescentados. Funcionalidades, dados reais, GitHub e Vercel não foram alterados.

## Evidências locais

- [Resultado do percurso](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/result.json)
- [Notas de inspeção por captura](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/inspection.md)
- [Falhas de abertura](/D:/Projetos/ERP/artifacts/reevaluation-startup-2026-10-18-1792338665293/result.json)
- [Teclado, itens e zoom](/D:/Projetos/ERP/artifacts/sales-removal-1792338665849/result.json)
- [Excel, diagnóstico e persistência](/D:/Projetos/ERP/artifacts/improvements-1792338823367/result.json)

## Capturas e notas por etapa

<details>
<summary>Etapa 01 — Entrada local em instalação temporária nova.</summary>

![Etapa 1](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/01-primeiro-acesso.png)

01 — Primeiro acesso: captura aceita. Uma tarefa, foco inicial no nome e ação Começar clara. Nenhuma falha visual no estado capturado; contraste/leitor de tela ainda não medidos.

</details>

<details>
<summary>Etapa 02 — Primeira entrada: Vender e boas-vindas do tutorial.</summary>

![Etapa 2](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/02-inicio-com-tutorial.png)

02 — Início/tutorial: captura aceita. Empresa e navegação claras, ajuda dispensável. Boas-vindas ocupa grande parte da altura e empurra o primeiro produto para fora da primeira dobra. Oportunidade de reduzir a ajuda inicial; não é bloqueio funcional.

</details>

<details>
<summary>Etapa 03 — Cadastro de produto com valores preenchidos.</summary>

![Etapa 3](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/03-cadastro-produto.png)

03 — Cadastro: captura aceita. Campos essenciais e padrões de valores claros. O botão Novo produto permanece visível abaixo do formulário já aberto, criando uma segunda entrada para a mesma tarefa. Salvar/Cancelar diferenciados; foco visível.

</details>

<details>
<summary>Etapa 04 — Produto persiste na lista; conferir se existe confirmação visível.</summary>

![Etapa 4](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/04-produto-salvo.png)

04 — Produto salvo: captura aceita. Item aparece corretamente na lista e formulário fecha. Observação confirmada: texto de sucesso existe, mas está escondido junto ao formulário; o usuário precisa inferir o sucesso pela linha da tabela. Recomendar confirmação persistente na área visível.

</details>

<details>
<summary>Etapa 05 — Compra de 2 x R$2 + 3 x R$3: avaliar total antes de confirmar e correção de item.</summary>

![Etapa 5](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/05-compra-preenchida.png)

05 — Compra: captura aceita. Quantidades/custos preenchidos para total de R$13,00, mas não há subtotal por linha nem total antes de Receber compra. Só existe Remover último item. Isso dificulta conferir uma nota e corrigir a linha do meio. Layout íntegro na captura.

</details>

<details>
<summary>Etapa 06 — Tentativa real sem caixa: registro bloqueado, instrução só aparece ao concluir.</summary>

![Etapa 6](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/06-venda-caixa-fechado.png)

06 — Venda sem caixa: captura aceita. Regra bloqueou a gravação e preservou os campos. Caixa fechado não foi antecipado no PDV; mensagem aparece só depois de concluir, com prefixo técnico Error invoking remote method. Recomendar estado do caixa e ação Abrir caixa antes da tentativa, com mensagem simples.

</details>

<details>
<summary>Etapa 07 — Duas vendas reais, mesmo total/pagamento/troco: avaliar identificação para cancelamento.</summary>

![Etapa 7](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/07-historico-duas-vendas.png)

07 — Vendas concluídas: captura aceita. Total e troco corretos, registro confirmado e campos reiniciados. Duas linhas de R$5,00 são visualmente iguais e oferecem Cancelar venda, sem data/hora, número, cliente ou detalhes dos itens na lista. Risco de escolher a venda errada; botão de cancelamento também difere do padrão visual.

</details>

<details>
<summary>Etapa 08 — Entrada no financeiro: resumo do dia, recebíveis recolhidos e resumo geral abaixo.</summary>

![Etapa 8](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/08-financeiro-inicio.png)

08 — Financeiro/início: captura aceita. Resumo por data coerente com duas vendas/R$10. O resumo ocupa toda a primeira dobra; contas a pagar/receber ficam abaixo e exigem bastante rolagem. Recomendar priorizar contas e separar resumo/receber/pagar em subáreas, preservando menu curto.

</details>

<details>
<summary>Etapa 09 — Contas pagas/recebidas por PIX; ISO na data e blocos da mesma tela.</summary>

![Etapa 9](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/09-financeiro-contas.png)

09 — Contas: captura aceita. Pagamento e recebimento por PIX reconciliados sem alterar dinheiro físico. Data de vencimento está em ISO na tabela, diferente do formato brasileiro do formulário. Botões de estorno usam aparência padrão menor, enquanto criar conta ocupa grande área. Mensagem de sucesso está visível neste módulo.

</details>

<details>
<summary>Etapa 10 — 101 vendas preservadas no banco, 100 disponíveis na lista e nenhuma página seguinte.</summary>

![Etapa 10](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/10-historico-limite-100.png)

10 — Histórico longo: captura aceita. Rodapé da lista sem paginação nem aviso de limite. Teste comprovou 101 vendas no SQLite e 100 devolvidas/listadas; nenhum registro foi apagado. A limitação impede operar pelo histórico sobre vendas fora do recorte. Recomendar paginação real/filtros e identificação do registro.

</details>

<details>
<summary>Etapa 11 — Backup real criado e diagnóstico não altera registros.</summary>

![Etapa 11](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/11-backup-e-diagnostico.png)

11 — Backup/diagnóstico: captura aceita. Último backup aparece no cabeçalho e no painel; diagnóstico tem resultado e horário legíveis. Hash dos registros não mudou com Verificar dados. Arquivo SQLite real criado. Diálogos nativos foram conduzidos pelo harness e não avaliados visualmente.

</details>

<details>
<summary>Etapa 12 — Restauração retorna ao login; avaliar confirmação do resultado.</summary>

![Etapa 12](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/12-pos-restauracao.png)

12 — Pós-restauração: captura aceita. Retorno ao login protege a sessão, e o hash da base restaurada coincidiu com o backup. Não aparece aviso de restauração concluída nem motivo do retorno ao acesso. Recomendar confirmação em linguagem simples no login.

</details>

<details>
<summary>Etapa 13 — Perfil operador: menus limitados à operação; primeiro tutorial específico.</summary>

![Etapa 13](/D:/Projetos/ERP/artifacts/reevaluation-2026-10-18-1792338082079/13-operador.png)

13 — Operador: captura aceita. Apenas Vender/Caixa/Estoque/Produtos, sem menus financeiros, equipe ou backup, empresa permitida visível. A diferença de perfil é clara. A ajuda inicial continua ocupando grande área; permissões serão conferidas também pela ponte local.

</details>
