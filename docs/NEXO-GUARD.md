# NEXO Guard

Em Configurações, abra Segurança, ative o Guard e escolha as ações protegidas. Revise a configuração e informe o PIN duas vezes. Guarde a chave de recuperação fora do computador. Em caso de esquecimento, selecione Esqueci meu PIN e use a chave para definir outro PIN. A chave anterior perde a validade.

A seleção de nome é identificação declarada. O Guard acrescenta autorização operacional ao perfil e às permissões verificadas pelo Electron. Um pedido mantém a chamada e seus argumentos no processo principal, expira em 60 segundos e é consumido após a validação. Alterar a política ou desativá-la exige o PIN atual.

O PIN usa scrypt com salt aleatório, N=32768, r=8 e p=1. A comparação usa tempo constante. Após cinco falhas, o bloqueio começa em 30 segundos e aumenta até 15 minutos. As tentativas são serializadas e o bloqueio persiste. A chave de recuperação tem 192 bits aleatórios e é armazenada como SHA-256.

A política fica em guard.json junto aos dados locais e persiste ao restaurar o SQLite. A restauração na abertura aplica a mesma política. Uma instalação nova começa com o Guard desativado. O arquivo de política deve permanecer no perfil ao migrar de computador.

Quatro dígitos oferecem 10.000 combinações. O Guard tem proteção operacional limitada diante de acesso aos arquivos locais ou controle administrativo do Windows. Perder simultaneamente o PIN e a chave impede autorizar operações protegidas pelo fluxo normal. DPAPI e autenticação forte por usuário são pontos de evolução.
