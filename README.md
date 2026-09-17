# NEXO — Gestão Comercial

Aplicação comercial para **Depósito JG** e **Adega JG**. A V1 segue oito milestones (M0–M7), da fundação técnica ao instalador Windows. O estado atual inclui autenticação, cadastros, estoque, compras, caixa mínimo e PDV com venda transacional.

**Estado e evidências:** [docs/STATUS.md](docs/STATUS.md). O sistema ainda não está liberado para operação comercial real.

## Prévia visual web

`npm.cmd run build:preview` gera dados fictícios em banco em memória descartável e compila as mesmas telas em modo visual. A Vercel usa esse comando e publica `dist/client`. Não requer banco hospedado, login real nem credenciais locais. Operações comerciais são bloqueadas com mensagem explícita; os dados não são gravados. O build normal permanece conectado à API real.

Os dados de exibição ficam em `src/client/preview/snapshot.json` e são regenerados no build da prévia. Nunca substituir esse arquivo por exportação de uma base empresarial. A entrega final continua sendo o aplicativo Windows.

## Executar localmente no Windows

Pré-requisito: Node.js 24. No PowerShell, dentro deste diretório:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Abra **http://127.0.0.1:5173**. A API escuta em `127.0.0.1:3001`; os processos encerram com `Ctrl+C`.

O seed cria as duas empresas, um administrador e catálogos demonstrativos coerentes com cada negócio. Consulte o arquivo local **`.local/seed-credentials.txt`** para o acesso gerado. A senha não é fixa nem embutida no frontend. Reexecutar o seed preserva a senha e os registros existentes.

Os dados locais ficam, por padrão, em `%LOCALAPPDATA%/JG-ERP/development`, fora do OneDrive. Para escolher outra pasta, configure `DATA_DIR` no `.env`; nunca aponte testes para essa base. `.env.example` contém as opções. O navegador não é o banco: fechar e reabrir mantém os registros no servidor.

Use o endereço **127.0.0.1**, conforme `APP_ORIGIN`; trocar por `localhost` exige ajustar essa variável. A checagem de origem faz parte da proteção das sessões.

## Comandos de qualidade

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

`test:e2e` sobe API e frontend exclusivos para testes, em portas próprias, com banco temporário. O navegador padrão é Microsoft Edge instalado no Windows. Consulte a configuração Playwright para outros navegadores. Não há necessidade de credenciais reais.

## Estrutura

```text
src/client/     React, páginas, componentes e cliente HTTP
src/server/     API Fastify, autenticação, regras, banco e migrations runner
src/shared/     Tipos de contrato e matriz de permissões
migrations/    SQL versionado para PostgreSQL
tests/         Regras críticas, integração e fluxo no navegador
docs/          Especificação, decisões, roadmap, riscos e evidências
```

## Documentação do produto

- [Objetivo vigente do produto](docs/GOAL.md)
- [Arquitetura e decisões](docs/ARCHITECTURE.md)
- [Roadmap, dependências e critérios M0–M7](docs/ROADMAP.md)
- [Riscos e decisões pendentes](docs/RISKS.md)
- [Contrato da API](docs/API.md)
- [Estado confirmado e plano de continuidade](docs/STATUS.md)

## Produção

O modo de produção exige **PostgreSQL externo** e origem **HTTPS**. PGlite é apenas o ambiente local de desenvolvimento/teste. `npm.cmd run build` gera os artefatos web; o executável Windows ainda depende do shell Tauri registrado no roadmap. Migrations devem ser executadas explicitamente antes da aplicação. O seed de demonstração é bloqueado em produção.

A ativação real ainda depende dos gates registrados em `docs/STATUS.md`: validar PostgreSQL com perfil restrito, provisionamento do proprietário, backup/restauração, HTTPS, operação simultânea e homologação dos módulos de negócio. Dados cadastrais reais, integrações e emissão fiscal serão tratados nas fases correspondentes.
