# NEXO Update QA M2.6

## Auditoria inicial

O botão Verificar atualização consulta o GitHub Releases pelo electron-updater em instalações com app-update.yml. O botão para abrir o GitHub é separado. Download e instalação exigem ação do usuário. O instalador NSIS usa o mesmo identificador do aplicativo, e o fluxo atual exige permissão administrativa e backup SQLite antes de fechar o banco. O GitHub Actions produz EXE, blockmap e latest.yml como artefatos temporários. Esses arquivos ainda precisam de um canal de distribuição para serem detectados pelo aplicativo.

A instalação só fica disponível após a resolução bem-sucedida do download. Eventos atrasados de progresso não apagam uma falha. Chamadas simultâneas de instalação são recusadas enquanto a confirmação ou o reinício estão pendentes.

Quatro testes com atualizador simulado passaram, incluindo evento de download seguido de falha, nova tentativa e consulta concorrente. A instalação real pelo atualizador, a origem e a assinatura do pacote, os tempos e a preservação do Guard ainda precisam de evidência com uma versão anterior e um canal de teste isolado.


### M2.6 — download no aplicativo instalado

A execução Windows [43541022951](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541022951), revisão fef6086, confirmou que o NEXO 1.0.4 instalado consultou o manifesto e baixou o instalador 1.0.5 pelo canal de teste em loopback. A instalação dessa execução foi acionada diretamente pelo roteiro. Os testes de instalação pelo botão, cancelamento, hash divergente e ajuda global ainda aguardam os resultados das execuções seguintes.

### Cancelamento e reabertura

A execução [43541207713](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541207713) confirmou que cancelar manteve a versão anterior aberta, sem criar backup e com o download pronto para tentar novamente. Na nova tentativa, o botão iniciou o instalador e gerou o backup antes do fechamento. A reabertura encontrou uma dependência ausente naquele momento. A revisão ce3aa84 passou a aguardar a presença e o tamanho de todos os arquivos do aplicativo antes de reabrir. A confirmação da reabertura está na execução [43541885976](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541885976).

A execução [43541307995](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541307995) confirmou a rejeição do hash divergente e preservou a versão anterior antes da nova tentativa. A reabertura após a tentativa válida ainda falhou nessa revisão.


### M2.6 — atualização pelo botão e reabertura confirmadas

A execução [43541885976](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43541885976), revisão ce3aa84, aprovou a atualização 1.0.4 → candidata 1.0.5 pelo botão do NEXO em perfil fictício. O roteiro rejeitou hash divergente, baixou o instalador válido, cancelou e retomou a instalação, conferiu a criação do backup e aguardou a extração dos arquivos antes de reabrir. As cinco vendas permaneceram acessíveis na candidata e no executável anterior. A ajuda global também abriu em janela compacta e devolveu o foco ao fechar. A validação de todos os registros comparados e do conteúdo da cópia pré-atualização segue na execução 43542456692.


### M2.6 — integridade dos arquivos instalados

A execução [43542065192](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43542065192), revisão 35aed97, passou pela comparação SHA-256 dos arquivos de aplicação instalados com o pacote da candidata antes da reabertura. A atualização pelo botão, o retorno ao executável anterior em dados fictícios e a ajuda global em 1000 × 650 também passaram. A revisão desta execução ainda não incluía a comparação detalhada do conteúdo do backup.


### M2.6 — conteúdo do backup e preservação dos registros

A execução Windows [43542456692](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43542456692), revisão 1e446e5, confirmou uma única cópia SQLite pré-atualização, integridade da cópia e igualdade dos registros de 16 tabelas com a base anterior. Após instalar e reabrir, a base ativa também manteve esses registros e o responsável voltou a entrar com o mesmo identificador. O roteiro usou perfil fictício e canal local de teste. A preservação do Guard já ativado na versão de origem ainda requer uma origem que inclua o recurso.
