# NEXO — Gestão Comercial

Aplicativo local para a operação diária da **Adega JG** e do **Depósito JG**. O NEXO funciona no Windows sem internet, servidor, Node.js, Docker ou banco instalado pelo usuário. Cada empresa mantém seus próprios cadastros e movimentos.

## Abrir o aplicativo

1. Mantenha juntos todos os arquivos da pasta `NEXO-Windows-*`.
2. Abra `NEXO.exe`.
3. No primeiro acesso, crie a senha do administrador.
4. Escolha a empresa em operação, sempre mostrada no topo da tela.

Os dados ficam em `%LOCALAPPDATA%\NEXO\nexo.sqlite`, fora da pasta do programa e fora do OneDrive. Fechar ou atualizar o aplicativo não remove essa base.

## Recursos entregues

- produtos, categorias, clientes e fornecedores;
- compras com entrada de estoque e conta a pagar;
- saldo e histórico de movimentações de estoque;
- abertura, movimentação e fechamento de caixa;
- venda com desconto, dinheiro, Pix, débito e crédito;
- baixa de estoque e lançamentos financeiros na mesma gravação da venda;
- cancelamentos e estornos com histórico preservado;
- contas a pagar e receber;
- resumo diário de vendas, estoque e financeiro;
- administrador e operador com permissões verificadas na camada local;
- importação de produtos por Excel, com modelo, prévia e confirmação;
- exportação de produtos, estoque, vendas e financeiro para Excel;
- backup consistente e restauração validada.

## Backup e restauração

Use **Gerar backup** e guarde uma cópia em outro dispositivo. A tela informa a data do último backup. Para restaurar, selecione um backup válido e confirme a operação; o NEXO salva automaticamente uma cópia do estado anterior. Exportação Excel serve para consulta e não substitui o backup.

## Atualizar o NEXO

1. Gere um backup e feche o NEXO.
2. Extraia a nova pasta do programa.
3. Abra o `NEXO.exe` da nova pasta.
4. Não apague nem mova `%LOCALAPPDATA%\NEXO`.

A atualização aplica as mudanças de estrutura automaticamente e preserva os registros. Não copie o arquivo SQLite enquanto o NEXO estiver aberto; use o botão de backup.

## Planilhas Excel

Baixe o modelo dentro do aplicativo. A importação aceita até 1.000 linhas e 5 MB, mostra erros e duplicidades antes da gravação e só altera o cadastro após confirmação explícita. A exportação cria oito abas de consulta e não depende do Microsoft Excel instalado.

## Prévia visual web

[Abrir a demonstração do NEXO](https://nexo-gestao-comercial.vercel.app). Compras, caixa, histórico de vendas e financeiro acompanham a interface do aplicativo Windows, com dados fictícios e gravações bloqueadas.

`npm.cmd run build:preview` compila uma demonstração navegável com dados fictícios. Ela não acessa a base local e bloqueia alterações com uma mensagem clara. A prévia permite acompanhar a aparência; o produto operacional é o executável Windows.

## Limitações conhecidas da V1

- uma instalação atende um computador, sem sincronização em rede ou nuvem;
- não há emissão fiscal, integração bancária, e-commerce, delivery, CRM ou BI avançado;
- o pacote ainda não possui assinatura digital nem instalador tradicional;
- a senha local não possui recuperação automática; mantenha o backup protegido.

## Desenvolvimento e validação

O ambiente de desenvolvimento usa Node.js 24. O usuário do programa empacotado não precisa instalá-lo.

```powershell
npm.cmd ci
npm.cmd run build:local
npm.cmd test
npm.cmd run package:local
```

Os testes usam diretórios temporários e nunca devem apontar para a base real. Evidências e pendências ficam em [docs/STATUS.md](docs/STATUS.md); decisões técnicas em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).


## Ajuda e tutorial integrado

Use **Ajuda e tutorial** em qualquer tela. O guia em português explica os fluxos disponíveis para seu perfil sem criar registros nem executar operações. **Ver esta tela** navega para o módulo; **Ajuda desta tela** escolhe a orientação correspondente.

Você pode **Pular tutorial**, **Fechar tutorial** (ou Esc), **Desativar tutorial**, **Retomar tutorial**, **Reativar tutorial** e **Reiniciar tutorial**. A escolha e a etapa são guardadas por usuário e empresa. No Windows ficam em `%LOCALAPPDATA%\NEXO\tutorial-preferences`, separadas do banco comercial e preservadas ao abrir outra pasta do programa. A prévia fictícia guarda sua própria preferência no navegador.

O pacote do tutorial de 13/10 está em `artifacts/NEXO-Windows-1791933474461/NEXO.exe`. Para a versão local atual, use o pacote indicado abaixo. Não exige instalador novo: mantenha todos os arquivos dessa pasta juntos, faça seu backup habitual, feche a versão anterior e abra o novo executável. A pasta de dados continua a mesma. Os atalhos e pacotes antigos não foram substituídos.

Durante uma operação Excel, aguarde antes de trocar de empresa, sair ou usar backup/restauração. Selecionar outra planilha descarta a prévia anterior mesmo quando o seletor é cancelado. Rascunhos de produto e prévias Excel não atravessam empresas.

Detalhes de uso, persistência, testes e limites em [Tutorial integrado — 13/10/2026](docs/TUTORIAL-2026-10-13.md).


## Recuperação e histórico — atualização de 18/10/2026

Pacote da etapa de recuperação/histórico: artifacts/NEXO-Windows-1792340357595/NEXO.exe. A versão atual está indicada na seção seguinte. ZIP portátil: artifacts/NEXO-Windows-recuperacao-historico-2026-10-18.zip. Gere um backup, feche a versão anterior, extraia o ZIP e abra o novo executável. Preserve %LOCALAPPDATA%/NEXO.

Se a base não abrir, a tela de recuperação permite tentar novamente, escolher uma cópia, abrir a pasta e guardar diagnóstico. A restauração exige a senha do responsável existente nessa cópia e sua confirmação; os arquivos anteriores são guardados. Essa rota exige backup que já contenha a senha local e não recupera senha esquecida.

Em Vender, o Histórico de vendas mostra data, identificação e cliente, com busca, período, situação e páginas para todas as vendas. Detalhes permite conferir os itens e valores originais antes de cancelar. Evidências e limites em [Recuperação e histórico](docs/RECOVERY-HISTORY-2026-10-18.md).


## Compras, caixa e financeiro — atualização de 18/10/2026

Pacote atual: artifacts/NEXO-Windows-1792341909772/NEXO.exe. ZIP portátil: artifacts/NEXO-Windows-compras-caixa-financeiro-2026-10-18.zip.

- Compras mostra subtotais e total antes de receber; Remover item corrige qualquer linha.
- Vender informa a situação do caixa e quem o abriu. Ir ao caixa preserva o rascunho; é necessário um caixa do próprio operador para concluir.
- Financeiro oferece Pagar, Receber e Resumo. As listas começam em aberto; use situação, vencimento e busca para consultar outras contas. Nova conta a receber abre o cadastro quando necessário.
- Produto salvo e operações corrigidas apresentam retorno visível, sem prefixos internos da ponte.

Para atualizar, gere um backup, feche a versão anterior, extraia a pasta nova e abra NEXO.exe. Preserve %LOCALAPPDATA%/NEXO. Evidências e limites em [Compras, caixa e financeiro](docs/PURCHASES-CASH-FINANCE-2026-10-18.md).
