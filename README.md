# NEXO — Gestão Comercial

Aplicativo local para a operação diária da **Adega JG** e do **Depósito JG**. O NEXO funciona no Windows sem internet, servidor, Node.js, Docker ou banco instalado pelo usuário. Cada empresa mantém seus próprios cadastros e movimentos.

## Atualizar pelo GitHub

No NEXO para Windows, abra **Configurações** e clique em **Verificar atualização**. O navegador abre as versões do repositório privado. Se necessário, entre no GitHub com uma conta que tenha acesso.

Para trocar de versão, baixe o ZIP publicado, faça uma cópia de segurança pelo NEXO, feche o programa e extraia todos os arquivos em outra pasta. Em uma instalação normal, abra o novo executável para usar a base local. Em uma candidata portátil, use o iniciador e, se precisar recuperar dados de outra pasta de teste, restaure a cópia de segurança pelo app.

## Baixar o programa para Windows

[**Baixar NEXO-Windows-v1.0.2.zip**](https://github.com/EduT3/nexo-gestao-comercial/releases/download/v1.0.2/NEXO-Windows-v1.0.2.zip) — programa completo, sem fontes de desenvolvimento nem dados de teste. Extraia todos os arquivos e abra **NEXO.exe**.

## Abrir o aplicativo

1. Mantenha juntos todos os arquivos da pasta `NEXO-Windows-*`.
2. Abra `NEXO.exe`.
3. No primeiro acesso, cadastre o responsável e selecione o nome para entrar.
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
- qualquer pessoa com acesso ao programa neste computador pode selecionar um usuário, inclusive o responsável.

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

O procedimento de empacotamento e as validações desta integração estão descritos em [Integração local — 15/10/2026](docs/INTEGRATION-2026-10-15.md). Mantenha todos os arquivos do pacote juntos, faça seu backup habitual e feche a versão anterior antes de abrir outro executável. Os atalhos e a instalação existente não foram substituídos.

Durante uma operação Excel, aguarde antes de trocar de empresa, sair ou usar backup/restauração. Selecionar outra planilha descarta a prévia anterior mesmo quando o seletor é cancelado. Rascunhos de produto e prévias Excel não atravessam empresas.

Detalhes de uso, persistência, testes e limites em [Tutorial integrado — 13/10/2026](docs/TUTORIAL-2026-10-13.md).


## Recuperação e histórico — atualização de 18/10/2026

Pacote da etapa de recuperação/histórico: artifacts/NEXO-Windows-1792340357595/NEXO.exe. A versão atual está indicada na seção seguinte. ZIP portátil: artifacts/NEXO-Windows-recuperacao-historico-2026-10-18.zip. Gere um backup, feche a versão anterior, extraia o ZIP e abra o novo executável. Preserve %LOCALAPPDATA%/NEXO.

Se a base não abrir, a tela de recuperação permite tentar novamente, escolher uma cópia, abrir a pasta e guardar diagnóstico. Para restaurar, selecione o nome do responsável cadastrado no backup e confirme. O programa guarda os arquivos anteriores.

Em Vender, o Histórico de vendas mostra data, identificação e cliente, com busca, período, situação e páginas para todas as vendas. Detalhes permite conferir os itens e valores originais antes de cancelar. Evidências e limites em [Recuperação e histórico](docs/RECOVERY-HISTORY-2026-10-18.md).


## Compras, caixa e financeiro — atualização de 18/10/2026

Pacote atual: artifacts/NEXO-Windows-1792341909772/NEXO.exe. ZIP portátil: artifacts/NEXO-Windows-compras-caixa-financeiro-2026-10-18.zip.

- Compras mostra subtotais e total antes de receber; Remover item corrige qualquer linha.
- Vender informa a situação do caixa e quem o abriu. Ir ao caixa preserva o rascunho; é necessário um caixa do próprio operador para concluir.
- Financeiro oferece Pagar, Receber e Resumo. As listas começam em aberto; use situação, vencimento e busca para consultar outras contas. Nova conta a receber abre o cadastro quando necessário.
- Produto salvo e operações corrigidas apresentam retorno visível, sem prefixos internos da ponte.

Para atualizar, gere um backup, feche a versão anterior, extraia a pasta nova e abra NEXO.exe. Preserve %LOCALAPPDATA%/NEXO. Evidências e limites em [Compras, caixa e financeiro](docs/PURCHASES-CASH-FINANCE-2026-10-18.md).


## Revisão de manutenção

[Revisão remota de 13/10](docs/REVIEW-2026-10-13.md) e [integração de 15/10](docs/INTEGRATION-2026-10-15.md) preservadas no histórico. As atualizações de 18/10 estão descritas acima e em STATUS.
