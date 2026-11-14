# NEXO Guard

Em Configurações, abra Segurança, ative o Guard e escolha as ações protegidas. Revise a configuração e informe o PIN duas vezes. Guarde a chave de recuperação fora do computador. Em caso de esquecimento, selecione Esqueci meu PIN e use a chave para definir outro PIN. A chave anterior perde a validade.

A seleção de nome é identificação declarada. O Guard acrescenta autorização operacional ao perfil e às permissões verificadas pelo Electron. Um pedido mantém a chamada e seus argumentos no processo principal, expira em 60 segundos e é consumido após a validação. Alterar a política ou desativá-la exige o PIN atual.

O PIN usa scrypt com salt aleatório, N=32768, r=8 e p=1. A comparação usa tempo constante. Após cinco falhas, o bloqueio começa em 30 segundos e aumenta até 15 minutos. As tentativas são serializadas e o bloqueio persiste. A chave de recuperação tem 192 bits aleatórios e é armazenada como SHA-256.

A política fica em guard.json junto aos dados locais e persiste ao restaurar o SQLite. A restauração na abertura aplica a mesma política. Uma instalação nova começa com o Guard desativado. O arquivo de política deve permanecer no perfil ao migrar de computador.

Quatro dígitos oferecem 10.000 combinações. O Guard tem proteção operacional limitada diante de acesso aos arquivos locais ou controle administrativo do Windows. Perder simultaneamente o PIN e a chave impede autorizar operações protegidas pelo fluxo normal. DPAPI e autenticação forte por usuário são pontos de evolução.

## Validação da recuperação na abertura

A execução Windows 43531850681 testou o instalador do commit 0b2839d em perfil temporário. O teste criou um backup, ativou o Guard e corrompeu somente a base fictícia. A recuperação recusou um PIN incorreto sem alterar os bytes e restaurou a cópia com o PIN correto. O Guard permaneceu ativo. O teste também confirmou que um pedido gerado antes de recarregar a janela não pode ser autorizado depois. A suíte executou 230 testes.

Evidência: https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43531850681


## Revisão de permissões e concorrência

A política é única por instalação; configurar ou recuperar o Guard exige um usuário com papel ADMIN ativo em todas as empresas existentes. Nas operações ligadas a uma empresa, o processo principal verifica o vínculo e a permissão da empresa, inclusive novamente antes de executar uma solicitação aprovada. As permissões comerciais continuam sendo aplicadas nas próprias transações. O PIN não transforma o nome escolhido em identidade autenticada.

As ações administrativas disponíveis e mapeadas incluem cadastros e alteração de produtos, compras e entradas, movimentação administrativa de caixa, descontos, cancelamentos, consultas e movimentações financeiras, importação/exportação, usuários, backup, restauração, integridade e instalação de atualização. Abertura e fechamento ordinários de caixa e venda sem desconto seguem as permissões comerciais existentes.

O commit `0f29d10` reforça uma condição de concorrência: uma solicitação que nasceu protegida exige validação de PIN mesmo se a seleção de ações mudar antes da aprovação; se a proteção for desativada, a solicitação é rejeitada. Os testes usam armazenamento temporário real e conferem que o PIN incorreto não executa a ação. A troca de contexto também invalida solicitações pendentes.

A suíte local da revisão `8fc6036` passou 235 testes em 53 arquivos. A validação Windows dessa revisão está em andamento na execução [43533630029](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43533630029); não interpretar esta entrada como aprovação do instalador. O teste visual foi ampliado para verificar a configuração e o teclado em 1000 × 650 e 1280 × 900, sujeito ao resultado dessa execução e à inspeção das imagens.

### Limites e evolução

- A configuração é compartilhada pela instalação, não individual por empresa. O administrador precisa ter acesso administrativo a todas as empresas para alterá-la.
- O arquivo `guard.json` e a chave de recuperação não são incluídos no backup SQLite. A migração de computador exige preservar separadamente a política e a chave; restaurar apenas um banco em uma instalação sem o arquivo não reativa o Guard.
- A seleção de nome não comprova identidade; o PIN de quatro dígitos limita erros e uso casual, mas não protege contra quem controla o Windows ou os arquivos locais.
- Avaliar proteção de chaves por recursos do Windows, autenticação individual e políticas por empresa em uma etapa futura, preservando operação offline e recuperação.
