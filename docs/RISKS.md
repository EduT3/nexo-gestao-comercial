# Riscos e limitações atuais

| Risco | Tratamento atual | Pendência |
| --- | --- | --- |
| Perda física do computador ou disco | Base fora da pasta do programa; backup consistente por botão; restauração validada e cópia prévia automática. | O responsável deve guardar backups em outro dispositivo e testar periodicamente a recuperação. |
| Atualização apagar ou corromper dados | Migrations automáticas preservam a base; pacote não contém nem remove `%LOCALAPPDATA%\NEXO`; fluxo de atualização é testado com versão anterior. | Fazer backup antes de atualizar e fechar o aplicativo durante a troca. |
| Pacote sem assinatura digital | Entrega em pasta autocontida, sem instalador ou ações privilegiadas. | O Windows pode exibir SmartScreen; assinatura de código e instalador podem entrar numa distribuição posterior. |
| Senha esquecida | Hash local forte, sem credencial fixa ou acesso remoto. | A V1 não oferece recuperação automática; definir um procedimento administrativo antes do uso real. |
| Pessoa com acesso administrativo ao Windows | Perfis e senha protegem a rotina do aplicativo. | Criptografia e proteção contra o administrador da máquina estão fora da V1; usar conta Windows e disco protegidos. |
| Uso simultâneo em mais de um computador | Escopo limitado a um computador por instalação. | Não colocar o SQLite em pasta de rede ou OneDrive; sincronização exige projeto futuro. |
| Planilha grande ou malformada | Importação limitada a 5 MB/1.000 linhas, valida valores, duplicidades e células complexas antes da confirmação. | Dividir cadastros maiores e revisar a prévia de erros. |
| Divergência entre Excel e base | Excel é importação/exportação explícita; editar exportação não altera registros. | Usar backup para recuperação completa, nunca planilha exportada. |
| Regressão em fluxo comercial | Testes cobrem valores exatos, isolamento, atomicidade, idempotência, cancelamentos, estornos e executável empacotado. | Homologação final com o procedimento real das duas empresas continua responsabilidade operacional. |
| Dependência de runtime experimental interno | O pacote inclui exatamente o Electron/Node/SQLite verificado e não depende do Node do computador. | Revalidar abertura, persistência e restauração sempre que Electron/Node mudar. |
| Prévia web ser confundida com operação | Faixa de demonstração, dados fictícios e mutações bloqueadas. | Não inserir dados reais nem tratar a prévia como backup ou sistema operacional. |
| Recursos fora do escopo | Fiscal, bancos, nuvem, sincronização, e-commerce, delivery, CRM e BI avançado estão excluídos. | Processos externos continuam manuais até uma evolução explicitamente aprovada. |

## Condições que impedem uma entrega

1. O executável não abre, não reabre ou perde registros.
2. Uma empresa consegue consultar ou alterar registros da outra.
3. Venda, compra, cancelamento ou liquidação deixa efeitos parciais.
4. Reenvio duplica estoque, caixa ou financeiro.
5. Backup não restaura ou atualização remove a base existente.
6. Exportação Excel diverge da origem ou importação grava sem confirmação.
7. A prévia web acessa dados reais ou apresenta uma gravação simulada como concluída.
