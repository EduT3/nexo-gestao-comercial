# NEXO Update QA M2.6

## Auditoria inicial

O botão Verificar atualização consulta o GitHub Releases pelo electron-updater em instalações com app-update.yml. O botão para abrir o GitHub é separado. Download e instalação exigem ação do usuário. O instalador NSIS usa o mesmo identificador do aplicativo, e o fluxo atual exige permissão administrativa e backup SQLite antes de fechar o banco. O GitHub Actions produz EXE, blockmap e latest.yml como artefatos temporários. Esses arquivos ainda precisam de um canal de distribuição para serem detectados pelo aplicativo.

A instalação só fica disponível após a resolução bem-sucedida do download. Eventos atrasados de progresso não apagam uma falha. Chamadas simultâneas de instalação são recusadas enquanto a confirmação ou o reinício estão pendentes.

Quatro testes com atualizador simulado passaram, incluindo evento de download seguido de falha, nova tentativa e consulta concorrente. A instalação real pelo atualizador, a origem e a assinatura do pacote, os tempos e a preservação do Guard ainda precisam de evidência com uma versão anterior e um canal de teste isolado.
