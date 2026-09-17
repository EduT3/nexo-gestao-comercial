# Riscos, dependências e decisões — NEXO · Gestão Comercial V1

## Estado

Registro alinhado ao [objetivo vigente de 58 seções](./GOAL.md) e às oito milestones M0–M7 do [roadmap](./ROADMAP.md). Descrever uma mitigação não prova sua conclusão. Evidência executada e o próximo gate devem constar em [STATUS.md](./STATUS.md).

Prioridade crítica indica risco de exposição entre empresas ou corrupção de operações. Alta indica risco de impedir uso/recuperação. Média indica decisão ou qualidade necessária ao fluxo. Os IDs anteriores são preservados quando o risco permanece; itens excluídos da V1 aparecem apenas no histórico, sem implementação antecipada.

## Riscos ativos da V1

| ID | Prioridade / risco | Mitigação verificável | Gate |
| --- | --- | --- | --- |
| R01 | Crítica — leitura ou associação cruzada entre empresas | Empresa explícita na API, vínculo ativo a cada chamada, filtro em consultas, FKs compostas e testes com IDs válidos da outra empresa. | Fundação e cada entidade. |
| R02 | Crítica — venda/compra parcialmente confirmada | Transação única inclui operação, itens, pagamentos/títulos, estoque, caixa aplicável e auditoria; injetar falha e comprovar rollback de todos os efeitos. | Estoque/compras e PDV. |
| R03 | Crítica — repetição após clique duplo ou resposta perdida | Chave idempotente persistida por empresa/operação, assinatura do comando, resultado e constraint única; testar reenvio igual/divergente e concorrente. | Recebimento, venda e liquidação. |
| R04 | Crítica — saldo perdido ou estoque negativo sob concorrência | Política de bloquear estoque negativo, bloqueio/update condicional, transação e teste de disputa pelo último saldo em PostgreSQL real. | Estoque/PDV; homologação multiterminal. |
| R05 | Alta — diferenças de dinheiro/quantidade | Centavos inteiros, quantidade exata de até três casas, limites e arredondamento centralizados; reconciliar itens/desconto/total e rejeitar precisão excessiva. | Cadastros e operações. |
| R06 | Alta — banco ativo no OneDrive | Manter dados fora da pasta sincronizada; padrão técnico existente `%LOCALAPPDATA%\JG-ERP\development` ou `DATA_DIR` autorizado. Mudança de marca não move dados automaticamente. | Persistência local. |
| R07 | Alta — PGlite confundido com produção homologada | PGlite somente local/teste; PostgreSQL real valida migrations, constraints, múltiplas conexões, privilégios e recuperação. Registrar evidência separada. | Uso em produção. |
| R08 | Alta — backup sem restauração comprovada | Definir responsável, destino, retenção e objetivos de perda/tempo de recuperação; restaurar PostgreSQL em ambiente separado e reconciliar dados. | Liberação operacional. |
| R09 | Alta — sessão reutilizada após revogação ou autenticação abusada | Token opaco/hash, cookies, origem/CSRF, expiração/logout/desativação, rate limit e testes válidos/negados. | Fundação. |
| R10 | Alta — simplificação de perfil eleva acesso silenciosamente | Migrar perfis legados explicitamente para ADMIN/OPERADOR, preservando vínculo por empresa; testar restrições e não inferir acesso global de administrador. | Fundação. |
| R11 | Alta — auditoria ausente/removível/com segredos | Evento transacional append-only, proteção no banco, runtime restrito e sanitização; falha da auditoria reverte mutação. | Fundação e operações. |
| R12 | Alta — seed/provisionamento inseguro ou demonstração misturada | Seed explícito local, credenciais fora de código/logs, ambiente identificado, dados fictícios coerentes e teste sem base empresarial. | Fundação/demonstração. |
| R13 | Alta — dinheiro físico confunde Pix/cartão ou receita duplica caixa | Separar meios, registrar pagamento manual claramente, vincular receita ao pagamento original e impedir nova entrada ao liquidar a mesma origem. | PDV/caixa/financeiro. |
| R16 | Alta — exposição desnecessária de contatos/documentos | Coletar apenas campos úteis, CPF/CNPJ opcionais, autorização e sanitização, backups protegidos e demonstração sem dados reais. | Cadastros reais/implantação. |
| R19 | Alta — correção apaga histórico ou altera caixa fechado | Inativação/cancelamento/estorno ligado ao original, motivo e autorização; compensação transacional e rejeição de repetição indevida. | Estoque/PDV/caixa/financeiro. |
| R22 | Alta — objetivo antigo amplia escopo e atrasa V1 | Objetivo anterior arquivado, rastreabilidade das 58 seções vigentes, milestones M0–M7 e teste de necessidade da seção 35 antes de adicionar recursos. | Todas as fases. |
| R23 | Alta — migration perde registros ou diverge entre bancos | Ordem/checksum/exclusão mútua; validar banco novo e atualização com dados; backup antes de alteração operacional. | Cada alteração de esquema. |
| R24 | Média — período/fuso distorce caixa e relatórios | Timestamp do servidor com fuso, vencimento como data civil, limites de período explícitos; testar virada de dia/mês. | Caixa/financeiro/gestão. |
| R25 | Alta — ordem das fases deixa venda sem caixa ou compra sem título | Antecipar título necessário na fase 3 e núcleo de caixa/receita na fase 4; efeitos atômicos desde a primeira operação válida. | Fases 3 e 4. |
| R26 | Média — telas bonitas ocultam fluxo incompleto | Browser ponta a ponta, ações reais, estados de erro/vazio e reconciliação; não declarar pronto porque a tela existe. | Todas; revisão final. |
| R27 | Média — troca de empresa mostra resposta tardia de outra empresa | Contexto por request, limpeza/recarregamento da tela e descarte de resposta que não corresponde à empresa atual. Testar abas e troca com consulta em andamento. | Fundação e cada tela. |
| R28 | Média — concentração de regras amplia regressões | Refatorar handlers/componentes conforme responsabilidade; contratos e serviços compartilhados para dinheiro, estoque e transações. | Fundação e antes de novo módulo. |
| R29 | Média — custo/relatório altera passado ao editar produto | Guardar preço/custo/quantidade da operação; relatórios usam fonte histórica, status e empresa/período definidos. | Compra/PDV/gestão. |

## Decisões e dependências por etapa

Não inventar dados reais nem transformar decisões futuras em funcionalidades da V1. Resoluções técnicas simples podem avançar dentro do objetivo; escolhas que mudam a regra comercial precisam ser registradas antes de seu uso.

| Tema | Diretriz / decisão necessária | Momento |
| --- | --- | --- |
| Marca e empresas | Software NEXO, subtítulo Gestão Comercial; empresas Adega JG e Depósito JG. Preservar identificadores/dados existentes. | Definido pelo usuário. |
| Perfis | ADMIN e OPERADOR no vínculo com a empresa. Definir migração de papéis antigos sem elevar acesso silenciosamente. | Fundação. |
| Estoque | Bloquear saldo negativo; mudanças sempre por movimento. Não criar exceções administrativas ainda não necessárias. | Estoque e PDV. |
| Quantidades | Até três casas decimais exatas; unidade/pacote/caixa/saco/kg/metro/litro, sem conversões automáticas presumidas. | Cadastros. |
| Arredondamento/custo | Centralizar regra determinística do total; documentar atualização de custo de compra e preservar histórico. Não incluir custeio complexo sem necessidade. | Antes de compra/PDV. |
| Caixas simultâneos | Definir unicidade por empresa/operador e comportamento de turno antes de permitir múltiplos caixas. Não inventar topologia de terminais reais. | Núcleo de caixa na fase 4. |
| Desconto/cancelamento | Aplicar autorização no backend; limites e correções não podem ser definidos apenas na interface. | PDV. |
| Compra e título | Definir condição/vencimento quando houver pagamento futuro; recebimento e conta a pagar necessária confirmam juntos. | Fase 3. |
| Pagamentos e financeiro | Quatro meios manuais; pagamento da venda gera receita vinculada sem duplicar caixa. Datas/status distinguem previsto/realizado. | Fases 4 e 5. |
| Dados reais | Responsável fornece nomes, vínculos e cadastros necessários; não preencher documento empresarial por suposição. | Provisionamento real. |
| Implantação/recuperação | PostgreSQL, hospedagem/TLS, segredos, responsável, destino do backup e objetivos de recuperação. | Antes de produção. |
| Código de barras | Entrada pelo campo de busca é V1; verificar leitor físico apenas quando o equipamento real for colocado em escopo. | Homologação no local, se aplicável. |

## Dependências externas da liberação

- Node.js 24, dependências instaláveis e navegador Edge para a validação local.
- Diretório de banco fora do OneDrive; banco temporário isolado para teste.
- PostgreSQL real para concorrência, migrations, privilégios, backup/restore e operação.
- Hospedagem e HTTPS conforme implantação escolhida; gestão segura de configuração e credenciais.
- Responsável por provisionar usuários e conferir o fluxo real nas duas empresas.
- Procedimento de recuperação e cópia restaurável dos dados.

Não solicitar colagem de senha/token no chat ou incluí-los no código. A configuração operacional usa mecanismo seguro do ambiente. Dependência externa pendente não impede módulos locais independentes; impede alegação de produção pronta.

## Itens retirados do plano anterior

Offline avançado, sincronização distribuída, fiscal, Pix automático/TEF/adquirentes/bancos, mesas/comandas/cozinha, impressão de pedidos, e-commerce/catálogo, WhatsApp, delivery, CRM, BI avançado e demais exclusões da seção 35 **não são gates de implementação da V1**.

Riscos antigos de integração, fiscal ou comandas (R14, R15, R17, R18, R20 e R21 em seus escopos anteriores) não exigem construção de adapters, filas ou módulos agora. O [objetivo anterior](./history/GOAL-previous-erp.md) conserva o contexto; avaliação futura começa somente quando uma evolução for solicitada.

Quando a operação real depender de processo fiscal ou financeiro externo, registrar essa dependência operacional com o responsável. Isso não autoriza ampliar automaticamente o software V1 nem apresentar registro manual como confirmação externa.

## Condições que impedem declarar a V1 pronta

1. Falha de autenticação/autorização, isolamento de empresa ou migração de acesso que eleve privilégio indevidamente.
2. Compra/venda/pagamento que possa duplicar efeitos ou deixar estoque, caixa, financeiro ou auditoria parcialmente gravados.
3. Saldo sem movimento, centavos inconsistentes ou caixa físico misturado com meios não monetários.
4. Fluxo principal de qualquer fase falhando ou teste mascarado/desativado para obter aprovação.
5. Dashboard/relatório sem conciliação com origem, empresa, status e período.
6. Confusão entre demonstração, pagamento registrado manualmente e confirmação externa.
7. Ausência de execução completa da definição de pronto da seção 55 nas duas empresas e de revisão renderizada do produto.

**Adicionalmente, liberar produção exige** PostgreSQL real, concorrência, credenciais/sessão adequadas, backup restaurado e responsável operacional. Não tratar testes PGlite como prova dessas condições. O estado de cada gate deve ser afirmado apenas com evidência atual.
