# Integração das melhorias locais — 15/10/2026

A integração parte da main `4a640c8` e reúne as entregas locais de outubro, preservando as proteções de isolamento de rascunhos e Excel da PR #1.

## Comportamento integrado

- Remover qualquer item da venda, mantendo identidade, valores e foco das linhas restantes.
- Tutorial contextual no Windows e na demonstração web, com preferências por usuário/empresa.
- Indicador do último backup, limpeza de formulários e proteção de callbacks após troca de empresa.
- Módulos carregados na primeira visita, consultas apenas em áreas ativas e descarte de respostas antigas.
- Paginação visual, busca sem acentos e filtro de estoque zerado.
- Excel carregado no primeiro uso e diagnóstico de integridade/vínculos da base, somente leitura e restrito ao administrador das duas empresas.

Nenhuma dependência, migração ou regra comercial foi alterada nesta conciliação. O snapshot fictício existente foi mantido. Bancos, credenciais, preferências reais, binários, capturas e logs não integram o código versionado.

## Validação em Windows

Node 24.14.1 e Electron 44.4.1; dados sintéticos em diretórios temporários.

| Verificação | Resultado |
| --- | --- |
| Vitest | 34 arquivos / 123 testes aprovados |
| Consultas, listas e troca de empresa no Edge | 20 testes aprovados |
| PR #1 e tutorial da prévia no Edge | 4 testes aprovados |
| Typecheck, builds desktop/geral/prévia | Aprovados |
| Empacotamento Windows | Aprovado |
| Remoção, tutorial, utilidades/Excel, navegação e indicador de backup | Cinco roteiros aprovados no mesmo pacote final |

Os roteiros empacotados foram executados sequencialmente, com janela oculta, Chromium offline, LOCALAPPDATA temporário e PATH mínimo sem Node. Incluem reabertura, permissões, isolamento de empresas, teclado/foco, 900×650 e zoom de 200%. Durante os percursos de ajuda e diagnóstico, os hashes das tabelas comerciais permaneceram iguais. Capturas foram inspecionadas localmente.

As evidências completas de execução são mantidas fora do repositório. A integração não substituiu a instalação ou a base operacional.

## Reproduzir as verificações

```powershell
npm.cmd ci
# Se o runtime Electron ainda não estiver disponível:
node node_modules/electron/install.js
npm.cmd test
npm.cmd run build:local
node scripts/verify-local-improvements-browser.mjs
node node_modules/vite/bin/vite.js build --mode visual-preview --outDir dist/tutorial-preview
node scripts/verify-preview-tutorial.mjs
npm.cmd run package:local
# Substitua pelo executável da pasta retornada pelo empacotamento:
$env:NEXO_VERIFY_EXECUTABLE = (Resolve-Path 'artifacts/NEXO-Windows-<identificador>/NEXO.exe').Path
node scripts/verify-local-sales-removal.mjs
node scripts/verify-local-tutorial.mjs
node scripts/verify-local-improvements.mjs
node scripts/verify-local-navigation.mjs
node scripts/verify-local-backup-indicator.mjs
```

Não executar builds concorrentes no diretório usado pelos roteiros. Os testes do tutorial da prévia usam sua configuração própria e ficam fora do E2E da aplicação com servidor. Os lançadores usam portas livres e não reutilizam servidores do operador.

## Limites

Outra máquina Windows limpa e leitor de tela manual não foram homologados. Offline do Chromium não bloqueia a rede do sistema inteiro. A paginação é visual; os serviços ainda retornam listas completas. O diagnóstico estrutural não substitui backup ou conciliação comercial.
