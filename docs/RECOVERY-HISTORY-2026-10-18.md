# Recuperação e histórico de vendas — 18/10/2026

## Entrega desta etapa

As duas prioridades altas da reavaliação foram corrigidas no aplicativo local Windows. A recuperação abre independentemente de conseguir ler a base; o histórico permite consultar todas as páginas e identificar cada venda antes de cancelar. Não houve mudança de esquema, exclusão de registros comerciais nem uso de dados reais.

| Achado | Estado | Comportamento entregue |
| --- | --- | --- |
| F1 — Falha de abertura sem recuperação | Corrigido nos cenários abaixo | Janela própria, nova tentativa, selecionar backup, abrir pasta e guardar diagnóstico |
| F2 — Vendas indistinguíveis e recorte de cem | Corrigido | Data/hora, identificação completa, cliente, detalhes históricos, filtros e páginas de cinquenta na camada local |
| F5 — Restauração sem aviso no login | Corrigido neste fluxo | Confirmação da restauração e orientação para entrar com a senha da cópia |

A conferência de compras (F3), a antecipação das condições do caixa e mensagens dos demais módulos (F4), o aviso de produto salvo (restante de F5), a organização do financeiro (F6) e as melhorias arquiteturais de manutenção continuam pendentes. O histórico permanece na área Vender, em seção própria abaixo da nova venda; uma alternância dedicada entre as duas tarefas ainda pode reduzir a rolagem.

## Recuperação

- Antes de configurar escrita ou migrações, a abertura inspeciona a base em modo de leitura. Arquivos ilegíveis, vazios, de outra aplicação ou de versão superior são recusados com uma interface acessível.
- A seleção nativa copia o backup para uma área de preparação. Integridade, vínculos, esquema e presença do responsável com acesso às duas empresas são conferidos nessa cópia. O arquivo escolhido não é alterado.
- A senha é conferida contra as credenciais do responsável existentes no backup, antes da confirmação nativa. Essa rota não redefine nem recupera senha esquecida.
- A instalação guarda os arquivos anteriores em recovery-saved-UUID na pasta de dados, incluindo arquivos auxiliares presentes. Esses originais podem estar ilegíveis: são preservação para suporte, não um backup validado.
- O marcador recovery-pending.json é gravado antes de mover os originais. Se uma troca falhar, ocorre tentativa de retorno dos arquivos; se a recuperação ficar interrompida, a próxima abertura exige recuperação e evita tratar a ausência do arquivo principal como primeiro acesso.
- A janela usa conteúdo local, isolamento de contexto, sandbox, ponte limitada e conferência da origem. Não recebe SQL nem caminhos arbitrários do renderer. A substituição espera as operações pendentes no encerramento normal.
- Um erro de configuração do SQLite fecha a conexão parcial antes de propagar a falha. Falhas de inicialização fora da preparação da base mostram uma mensagem nativa.

O backup para recuperação na abertura precisa conter a senha do responsável (esquema 11). Cópias antigas sem essa senha continuam sujeitas à restauração pelo fluxo administrativo autenticado em uma instalação acessível. Sem uma cópia válida, a tela preserva os arquivos e permite diagnóstico, mas não reconstrói registros corrompidos.

## Histórico de vendas

A nova consulta faz contagem e leitura limitada na mesma transação, com autorização da empresa em cada chamada. A interface usa cinquenta registros por página e filtros por identificação/cliente, datas e situação; o período corresponde aos dias locais informados, com fim exclusivo no dia seguinte. Valores de data aceitos pela camada local são normalizados antes da comparação. Pesquisa parametrizada trata caracteres como % e aspas literalmente.

Detalhes apresenta identificação, cliente, data/hora, itens com nomes/preços históricos, quantidades, subtotal, desconto, total, pagamento, recebido, troco, observações, situação e motivo de cancelamento. Custos não são retornados por essa consulta. A confirmação nativa de cancelamento usa os dados consultados no processo principal, incluindo identificação e itens. Regras existentes de permissão, estoque, estorno, auditoria e idempotência permanecem nos serviços.

O componente foi separado de LocalSales para manter o formulário de venda independente. Respostas antigas e de outra empresa são descartadas; áreas escondidas não iniciam leituras. Busca repetida e limpar filtros repetidamente também renovam corretamente a consulta. O método legado sales continua disponível para compatibilidade, com seu recorte antigo; a tela operacional usa salesHistory, paginado.

## Validação concluída

- Tipagem, build desktop e empacotamento aprovados.
- Suíte completa: **36 arquivos / 136 testes aprovados**. Treze testes desta etapa incluem abertura ausente/corrompida/vazia/futura/estranha, marcador de interrupção, backup inválido/sem credencial, senha e perfil, instalação/retorno dos originais e consulta de 101 vendas, filtros, detalhes, autorização, cancelamento e reabertura.
- **20 regressões de navegador aprovadas**, com ponte fictícia: navegação, rascunhos, respostas/erros atrasados, snapshots anteriores à gravação e troca de empresa. São testes de interface, distintos dos testes sobre SQLite real.
- Executável final validado offline, janela oculta, LOCALAPPDATA temporário, PATH mínimo e NODE_PATH/NODE_OPTIONS vazios: **12 grupos de verificações aprovados**, sem erro do renderer.
- 101 vendas reais na base de teste foram alcançadas em páginas 50/50/1, sem repetição; busca por cliente/identificação/período e cancelamento da venda mais antiga passaram. Alterar produto não mudou o nome/preço dos itens vendidos. O estorno devolveu a quantidade exata ao estoque e o registro permaneceu cancelado após reabrir.
- Abertura com arquivo ilegível ofereceu recuperação e nova tentativa sem alterar seus bytes. Desistir da seleção, escolher arquivo inválido, fornecer senha errada e recusar a confirmação preservaram a base. A restauração confirmada recuperou as 101 vendas e o cancelamento, preservou o arquivo ilegível, manteve o backup original byte a byte e persistiu após outra abertura.
- Base de versão futura conservou o hash do arquivo. Marcador de recuperação interrompida abriu a recuperação sem criar uma instalação vazia.
- Capturas do histórico, detalhes, largura 900x650, zoom 200%, recuperação e login pós-restauração foram inspecionadas. A tabela possui rolagem horizontal própria quando necessária; não houve transbordamento horizontal da página nos estados medidos.

Evidência principal: artifacts/recovery-history-1792340369133/result.json e cinco PNGs na mesma pasta. Roteiro: scripts/verify-local-recovery-history.mjs. Os diálogos nativos foram respondidos pelo harness, sem homologação manual do seletor/confirmador do Windows.

Ocorrências corrigidas: a primeira execução encontrou um rótulo de select sem nome explícito; o atributo foi acrescentado. Uma regressão esperava duas consultas novas onde a implementação agora faz uma; a expectativa foi alinhada e a proteção contra resposta antiga foi mantida. Houve falha de captura UnknownVizError na inicialização de uma janela oculta; o roteiro repete somente essa captura antes de falhar, sem ignorar falha funcional. As execuções finais passaram.

Regressões complementares no mesmo pacote final também aprovadas: scripts/verify-local-sales-removal.mjs (dez grupos, incluindo teclado/foco, remoção individual, arredondamento, rascunho, duplicados, venda e reabertura; artifacts/sales-removal-1792340584176/result.json), scripts/verify-local-navigation.mjs (tela única, cadastro, compra, venda, caixa/fechamento, backup e isolamento) e scripts/verify-local-restore-feedback.mjs (restauração pelo menu normal, aviso no login e novo acesso; artifacts/restore-feedback-1792340703774/result.json). O teste antigo de remoção usava um seletor genérico de status que encontrou também o novo status do histórico; foi limitado ao aviso do carrinho e passou novamente, sem alterar a funcionalidade.

## Pacote e uso

Pacote final: artifacts/NEXO-Windows-1792340357595/NEXO.exe.
ZIP: artifacts/NEXO-Windows-recuperacao-historico-2026-10-18.zip.

ZIP conferido arquivo por arquivo: 1.073 entradas de arquivo, todas com SHA-256 igual ao pacote testado; 173.103.332 bytes. Recibo: artifacts/zip-recovery-history-2026-10-18.json. SHA-256 do ZIP: 2B77E2DFE194AE266C6A79211035DD96ACE9D7F9CF22331D834660EF588346BA.

Para atualizar, gere o backup habitual, feche o NEXO, extraia a pasta nova e abra NEXO.exe mantendo os demais arquivos juntos. Os dados permanecem em %LOCALAPPDATA%/NEXO. Não apague essa pasta. O LEIA-ME do pacote inclui recuperação e histórico.

O ZIP é uma distribuição portátil; ainda não há instalador tradicional nem assinatura digital. Não houve push, publicação GitHub ou atualização da demonstração web nesta etapa.

## Limites da evidência

Não foi usada uma máquina Windows limpa separada, leitor de tela manual, queda física de energia ou uma base empresarial de grande volume. Retorno dos arquivos foi testado por falha injetada na troca; recuperação interrompida por marcador representativo. Isso não equivale a homologar todos os tipos de defeito de disco ou interrupção de energia. A preservação dos arquivos auxiliares segue a exigência do SQLite de tratar o WAL como parte do estado da base: [documentação oficial do SQLite](https://www.sqlite.org/wal.html).
