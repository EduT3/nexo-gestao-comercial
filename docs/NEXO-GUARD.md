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


## Rastreabilidade da aceitação M1

| Requisito | Evidência disponível | Limite ou trabalho restante |
| --- | --- | --- |
| Ativação opcional, PIN e políticas | `tests/local-guard-store.test.ts`; integração Windows 43531850681 | Validação atual concluída na execução 43536830745. |
| PIN, bloqueio, recuperação e falha na gravação | Testes do armazenamento temporário, incluindo tentativas concorrentes e chave rotativa | A política e a chave não integram o backup SQLite. |
| Pedidos de uso único, concorrência, cancelamento e mudança de contexto | `tests/local-guard-broker.test.ts` e testes de mudança de política | Troca de empresa também aprovada em base fictícia com duas empresas na execução 43536830745. |
| Permissões e IPC | Checagem no processo principal e teste Windows de chamada direta e recarga em 43531850681 | Troca de operador e recusa de acesso administrativo aprovadas na execução 43536830745. |
| Compatibilidade e regressões comerciais | Teste de instalação sobre 1.0.4, cópia/restauração e fluxos sintéticos em 43531850681; 235 testes locais | A cobertura não demonstra todas as combinações de instalações legadas nem homologação humana. |
| Interface e acessibilidade | Diálogo nativo, teclado físico e botões exercitados em 43531850681 | Capturas da configuração e do teclado inspecionadas em duas dimensões na execução 43535721498. |
| Instalador Windows | Candidata de 43531850681 instalada e executada em perfil fictício | Candidata da revisão `d450186` instalada e verificada na execução 43536830745. |

Estas evidências não certificam segurança contra acesso administrativo ao computador ou alteração dos arquivos locais. A conclusão do marco depende de resolver ou registrar explicitamente as lacunas de execução e validação acima.


A execução [43533630029](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43533630029) aprovou a candidata `8fc6036`, inclusive instalação, regressões e recuperação em perfil fictício. As capturas do teclado em 1000 × 650 e 1280 × 900 foram inspecionadas e mostraram o diálogo e os controles visíveis. Na captura da configuração em 1000 × 650, os controles ficaram abaixo da área capturada; o roteiro foi corrigido na revisão `0ec218d` e as capturas posteriores foram inspecionadas.


## Candidata Windows validada

A execução [43534470859](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43534470859), revisão `0ec218d`, aprovou 235 testes em 53 arquivos e o roteiro no executável instalado. O roteiro confirmou a invalidação de uma solicitação após troca de operador e após troca de empresa em uma base fictícia de duas empresas. Operador sem permissão não configurou o Guard nem gerou backup. A instalação sobre 1.0.4, a recuperação com PIN e o retorno ao executável anterior também foram exercitados em dados fictícios.

As capturas da configuração e do teclado foram inspecionadas em 1000 × 650 e 1280 × 900; os controles ficaram visíveis. O instalador `NEXO-Setup-1.0.5.exe` foi baixado do artefato da execução, com SHA-256 `2DD8019454677E1511F4BE1DA0595C6DB6B9DF3414EE0D6858EA8092CB35E62F`. O artefato de Actions tem retenção limitada e é uma candidata, não uma versão estável publicada.


## Revisão fefab96 validada

A execução [43535721498](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43535721498), revisão `fefab96`, aprovou 236 testes em 53 arquivos, empacotamento, instalação, atualização sobre 1.0.4 e roteiro de aplicativo com dados fictícios. O roteiro verificou a confirmação visível após autorizar backup, as trocas de operador e empresa, o bloqueio de IPC direto e a recuperação com PIN. O instalador baixado `NEXO-Setup-1.0.5.exe` tem SHA-256 `471D5D832150787CEFDE32FFDBB78C3439D6BCE920EA80D6088CF6A38EB31115` e está no artefato `nexo-windows` da execução, com retenção até 28/11/2026. Não é release estável.

O comprimento do PIN é transmitido da política para o diálogo e seus campos; a política e a recuperação na abertura continuam implementadas somente para quatro dígitos. A opção de seis dígitos exige implementação e teste futuros, incluindo migração e recuperação.


## Validação de teclado e foco

A execução [43536830745](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43536830745) aprovou 236 testes em 53 arquivos e o roteiro no instalador da revisão `d450186`. No diálogo, foram testados foco inicial, Tab, teclado físico, Backspace, botão para apagar e ausência dos dígitos digitados no texto do diálogo; Escape também foi exercitado no cancelamento do desconto. O artefato `nexo-windows` foi baixado e sua build é `NEXO-246E464A5C4B9E3B`; o SHA-256 do instalador é `4DC2325400FE5743FE0826B18266735EE570C0970520F24366B5D5779A5CB61A`. O artefato expira em 28/11/2026 e permanece candidato de teste.


## Avaliação de proteção do Windows

A DPAPI pode criptografar dados locais vinculados normalmente à conta Windows e à máquina; no escopo de máquina, qualquer usuário daquele computador pode solicitar a descriptografia. Ela funciona como proteção adicional de arquivos, mas não autentica os nomes selecionados no NEXO nem garante proteção contra código executado com acesso à mesma conta. A associação ao perfil ou máquina também pode dificultar troca de computador e recuperação. Fontes: [CryptProtectData, Microsoft](https://learn.microsoft.com/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata) e [exemplo DPAPI e limites de recuperação, Microsoft](https://learn.microsoft.com/windows/win32/SecCrypto/example-c-program-using-cryptprotectdata).

Decisão M1: não vincular silenciosamente a política atual ao perfil Windows. Isso exigiria migração reversível, recuperação testada após troca de conta ou máquina e análise de perfis compartilhados; sem essas garantias, poderia bloquear uma instalação legítima. A proteção atual continua usando scrypt e chave individual de recuperação, com os limites descritos acima. A avaliação de DPAPI não representa uma implementação nem teste dessa tecnologia no NEXO.


## Política individual e regressão completa

A revisão `a2c1fbe` acrescenta um teste com armazenamento temporário e autorizador reais: uma ação selecionada exige PIN, outra ação administrativa não selecionada continua disponível conforme as permissões existentes, e ao ativar a proteção global a segunda ação passa a exigir PIN. A suíte local completa passou 237 testes em 53 arquivos. Essa revisão acrescenta apenas teste, sem mudar os bytes do aplicativo da candidata Windows `d450186`.
