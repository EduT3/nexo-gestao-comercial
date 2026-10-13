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

Baixe o modelo dentro do aplicativo. A importação aceita até 1.000 linhas e 5 MB, mostra erros e duplicidades antes da gravação e só altera o cadastro após confirmação explícita. A exportação cria oito abas de consulta e não depende do Microsoft Excel instalado. Ao trocar de empresa, o cadastro de produto e a prévia Excel são descartados para não reutilizar rascunhos de outra empresa. Durante uma operação Excel, aguarde a conclusão antes de trocar de empresa ou sair. Selecionar outra planilha invalida a prévia anterior, mesmo se o seletor for cancelado.

## Prévia visual web

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

## Revisão de manutenção

[Correções, testes executados e limites da revisão de 13/10/2026](docs/REVIEW-2026-10-13.md).
