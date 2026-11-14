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

### M2.6 — atualização Windows com Guard ativo

A execução Windows [43543550789](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43543550789), revisão 4ccfc3e, aprovou a instalação pelo atualizador da candidata 1.0.6 em perfil fictício. A origem com Guard ativo veio do instalador de teste da execução 43536830745. O roteiro confirmou a preservação da política e do PIN de origem após a atualização. O instalador, o blockmap, o latest.yml e as evidências foram publicados no [artefato temporário nexo-windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43543550789/artifacts/14093078381). A auditoria automatizada confirmou a versão 1.0.6, o tamanho de 124152958 bytes e o SHA-512 do instalador em relação ao manifesto.

A execução usou um canal de teste em loopback e acionou o NSIS silenciosamente, com reabertura controlada pelo roteiro. Seguem pendentes a validação de um canal HTTPS de distribuição, instalação com retorno automático, interrupção de download, falha de execução do instalador e recuperação com migração incompatível.

### M2.6 — consulta, download interrompido e nova tentativa

A execução [43596780998](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596780998) passou com 241 testes automatizados e dois perfis Windows fictícios, partindo de 1.0.4 e 1.0.5 com Guard. A consulta reconheceu a versão instalada, sinalizou perda de conexão e recuperou na nova tentativa. Um download truncado manteve a versão anterior e bloqueou a instalação. A nova tentativa baixou e instalou a candidata 1.0.6, build NEXO-5913A87B0F41F026. A versão com Guard preservou a política e o PIN.

Os relatórios baixados do [ZIP Windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43596780998/artifacts/14115127959) confirmam tempos de download de 2,885 s e 2,881 s, e de instalação de 15,254 s e 11,220 s, respectivamente. As medições usaram loopback no runner Windows, com instalação silenciosa e reabertura controlada.

### M2.6 — recuperação e retorno incompatível no Windows

A execução [43597240803](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597240803), revisão ac10af6, passou com 242 testes automatizados. Nos dois perfis fictícios, a candidata manteve o aplicativo aberto e tornou a abrir a base após uma falha imediata simulada ao iniciar o instalador. O roteiro comparou os registros da base ativa e da cópia anterior à tentativa.

As origens 1.0.4 e 1.0.5 com Guard recusaram abrir a base fictícia marcada com versão SQLite futura, conservaram seus bytes e voltaram a abrir a cópia compatível com as cinco vendas. O teste simula incompatibilidade de versão do esquema. O [ZIP da candidata 1.0.6](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43597240803/artifacts/14114974245) contém o build NEXO-9726593EFCF75BFE, manifesto de atualização, blockmap e relatórios.

## Situação da homologação

| Cenário | Evidência disponível | Limite |
|---|---|---|
| Versão atual, falha na consulta, download interrompido e nova tentativa | Duas origens instaladas na execução 43596780998 | A falha foi induzida no canal local, sem desligar a rede do Windows. |
| Hash divergente, cancelamento e instalação pelo aplicativo | Execução 43596780998 | Canal local e NSIS silencioso, com reabertura pelo roteiro. |
| Banco, usuário, permissões e Guard após atualização | Execuções 43596780998 e 43597240803 | Bases e perfis fictícios. |
| Falha imediata ao iniciar o instalador | Execução 43597240803 | Evento simulado. Falha depois que o NSIS começa continua sem evidência. |
| Retorno a executável anterior | Execução 43597240803 | Cópia compatível reaberta. Esquema futuro simulado recusado sem alteração dos bytes. |
| Consulta HTTPS à origem pública configurada | Execução 43598510779 aprovada com 242 testes automatizados | A candidata foi distribuída pelo canal local de teste. |
| Reabertura automática, reinicialização durante a instalação e assinatura | Pendente | Ainda exige evidência específica. |

O relatório continua aberto até a execução dos cenários pendentes e a revisão da candidata final. O mesmo número 1.0.6 aparece em várias candidatas de teste. Use o identificador do build e a execução do GitHub para identificar o pacote analisado.

### Integridade da distribuição pública 1.0.4

O manifesto, o instalador e o blockmap da [release pública 1.0.4](https://github.com/EduT3/nexo-gestao-comercial/releases/tag/v1.0.4) foram baixados do GitHub. O manifesto informou a versão 1.0.4 e identificou NEXO-Setup-1.0.4.exe. O tamanho de 148.655.544 bytes e o SHA-512 calculado do instalador coincidiram com o manifesto. O blockmap estava presente. Esta conferência cobre os arquivos da release pública. A consulta pelo aplicativo instalado está na execução 43598510779.

### Origem embutida e assinatura da candidata

A execução [43598010478](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598010478) conferiu o provedor GitHub e o repositório EduT3/nexo-gestao-comercial no app-update.yml empacotado. O ZIP baixado continha o instalador 1.0.6 de 124.153.244 bytes, o blockmap e o manifesto com SHA-512 correspondente ao executável. A inspeção Authenticode classificou o instalador como sem assinatura. O hash comprova a correspondência com o manifesto da execução, enquanto a identidade do publicador continua sem validação por certificado.

### Consulta HTTPS e retenção do instalador quando o teste falha

Na execução [43598589366](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598589366), o NEXO 1.0.4 instalado consultou o GitHub Releases pela origem configurada de fábrica e recebeu um estado de atualização válido antes de usar o canal de teste. A execução falhou posteriormente na verificação do histórico recolhido do caixa. O GitHub publicou o diagnóstico e reteve o ZIP com instalador, conforme a regra de distribuição. A confirmação da correção do histórico segue na execução 43599279108.

A execução [43598510779](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779) confirmou a consulta HTTPS e concluiu as atualizações controladas a partir de 1.0.4 e 1.0.5 com Guard. Os 242 testes automatizados passaram. O [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779/artifacts/14116091263) corresponde ao build NEXO-DA69ABFF1376B072 e antecede a mudança do histórico de caixa.
