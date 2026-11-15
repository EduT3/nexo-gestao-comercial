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
| Falha imediata ao iniciar o instalador | Execução 43597240803 | Evento simulado para a falha imediata. A interrupção do NSIS em execução tem ensaio separado. |
| Retorno a executável anterior | Execução 43597240803 | Cópia compatível reaberta. Esquema futuro simulado recusado sem alteração dos bytes. |
| Consulta HTTPS à origem pública configurada | Execução 43598510779 aprovada com 242 testes automatizados | A candidata foi distribuída pelo canal local de teste. |
| Segunda instância enquanto a atualização aguarda confirmação | Execução 43623401359 aprovada nas duas origens | A segunda abertura encerrou, o processo original permaneceu ativo e os registros e o download foram preservados. |
| Reabertura automática após instalar | Execução 43623280591 aprovada | NSIS silencioso no Windows descartável. |
| Interrupção durante a troca dos binários | Execução 43624707886 aprovada | Reinstalação no mesmo destino, registros, integridade SQLite e arquivo do Guard verificados. |
| Assinatura do instalador | Instalador de teste sem assinatura | A verificação do manifesto não comprova a identidade do publicador por certificado. |

A candidata 1.0.6 está disponível para testes. Seguem sem evidência o reinício integral do Windows durante a instalação e o download de uma candidata por um canal público HTTPS. A consulta e o download da release pública 1.0.4 por HTTPS foram verificados, assim como a instalação da candidata pelo canal local. O mesmo número 1.0.6 aparece em várias candidatas de teste. Use o identificador do build e a execução do GitHub para identificar o pacote analisado.

### Integridade da distribuição pública 1.0.4

O manifesto, o instalador e o blockmap da [release pública 1.0.4](https://github.com/EduT3/nexo-gestao-comercial/releases/tag/v1.0.4) foram baixados do GitHub. O manifesto informou a versão 1.0.4 e identificou NEXO-Setup-1.0.4.exe. O tamanho de 148.655.544 bytes e o SHA-512 calculado do instalador coincidiram com o manifesto. O blockmap estava presente. Esta conferência cobre os arquivos da release pública. A consulta pelo aplicativo instalado está na execução 43598510779.

### Origem embutida e assinatura da candidata

A execução [43598010478](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598010478) conferiu o provedor GitHub e o repositório EduT3/nexo-gestao-comercial no app-update.yml empacotado. O ZIP baixado continha o instalador 1.0.6 de 124.153.244 bytes, o blockmap e o manifesto com SHA-512 correspondente ao executável. A inspeção Authenticode classificou o instalador como sem assinatura. O hash comprova a correspondência com o manifesto da execução, enquanto a identidade do publicador continua sem validação por certificado.

### Consulta HTTPS e retenção do instalador quando o teste falha

Na execução [43598589366](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598589366), o NEXO 1.0.4 instalado consultou o GitHub Releases pela origem configurada de fábrica e recebeu um estado de atualização válido antes de usar o canal de teste. A execução falhou posteriormente na verificação do histórico recolhido do caixa. O GitHub publicou o diagnóstico e reteve o ZIP com instalador, conforme a regra de distribuição. A confirmação da correção do histórico segue na execução 43599279108.

A execução [43598510779](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779) confirmou a consulta HTTPS e concluiu as atualizações controladas a partir de 1.0.4 e 1.0.5 com Guard. Os 242 testes automatizados passaram. O [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43598510779/artifacts/14116091263) corresponde ao build NEXO-DA69ABFF1376B072 e antecede a mudança do histórico de caixa.

## Recuperação após atualização interrompida

1. Aguarde o instalador encerrar. Feche o NEXO antes de copiar a pasta de dados. Preserve a pasta completa em outro local, inclusive os arquivos do Guard e a cópia SQLite criada antes da atualização.
2. Tente reinstalar o pacote compatível, obtido da distribuição oficial. Confira o tamanho e o SHA-512 com o manifesto do mesmo pacote. Retome a operação somente depois de abrir o NEXO e conferir usuários, Guard, vendas, estoque e caixa.
3. Se a base não abrir, use a tela de recuperação para escolher uma cópia compatível. Confira a data da cópia antes de confirmar. Registros feitos após essa data precisarão ser reconciliados. Guarde os arquivos preservados pelo programa.
4. Se precisar voltar para um executável anterior, teste primeiro com uma cópia dos dados em perfil isolado. Se a versão antiga recusar o esquema, preserve a base original e abra-a com uma versão compatível.

O ensaio Windows comprovou a cópia pré-atualização, a recuperação da falha simulada de lançamento e a recusa de esquema futuro. A etapa de reinstalação também foi ensaiada após interrupção do processo NSIS, conforme a evidência abaixo.

### M2.6 — reabertura automática confirmada

Na [execução 43623101334](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623101334), a atualização de 1.0.5 com Guard para 1.0.6 por canal de teste relançou a janela principal do NEXO em um novo processo, sem abertura manual. O roteiro usou o modo silencioso do NSIS e confirmou o encerramento desse processo antes de reabrir em perfil fictício para conferir os registros e o PIN de origem. O [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623101334/artifacts/14125407186) está disponível no GitHub Actions. A interrupção durante a instalação e a recuperação correspondente ainda precisam de ensaio próprio.

A [execução 43623280591](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623280591), revisão ba1dd96, repetiu a reabertura automática com a correção de registro do diálogo do Guard. Os 242 testes automatizados passaram. Os dois perfis Windows passaram pelo teclado, bloqueio do acesso direto, autorização do backup e persistência da política. O [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623280591/artifacts/14125746418) corresponde ao build NEXO-3E2B6BE692122B3C.

### Segunda instância com atualização pendente

A [execução 43623401359](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623401359) verificou a tentativa de abrir o mesmo executável com o mesmo perfil fictício antes de confirmar a instalação. O NEXO que já estava aberto continuou operando e manteve a atualização pronta. O cenário passou a partir da 1.0.4 e da 1.0.5 com Guard. [ZIP aprovado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43623401359/artifacts/14125801543).

### Recuperação durante a substituição dos arquivos

Na [execução 43624501699](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624501699), o cenário instalou a 1.0.5 com Guard em pasta descartável, iniciou o NSIS da candidata e encerrou o processo após detectar um arquivo novo da interface. A reinstalação na mesma pasta abriu o NEXO 1.0.6 com as cinco vendas fictícias e preservou os registros comparados. A execução passou e publicou o [ZIP com as evidências](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624501699/artifacts/14126175261). A checagem adicional de integridade SQLite e igualdade do arquivo Guard está na execução 43624707886.

### M2.6 — recuperação com verificação de integridade

A [execução 43624707886](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624707886), revisão 85f81d4, aprovou 242 testes e os dois perfis fictícios. Após interromper a substituição dos arquivos da 1.0.5 com Guard, o roteiro reinstalou a 1.0.6, abriu o NEXO, confirmou as cinco vendas e verificou a integridade SQLite, chaves estrangeiras e igualdade byte a byte do arquivo do Guard. O [ZIP verificado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43624707886/artifacts/14125079915) contém o build NEXO-3E2B6BE692122B3C. O tamanho do instalador baixado, 124.153.357 bytes, e o SHA-512 coincidiram com latest.yml. O ensaio encerrou o processo NSIS em um Windows descartável. Reinicialização integral do computador durante a atualização segue sem evidência.

### Download público pela interface

Na [execução 43626462844](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43626462844), os botões de atualização da candidata instalada consultaram o GitHub Releases, baixaram o NSIS 1.0.4 no cache descartável e exibiram a ação de instalar. O SHA-256 do arquivo baixado coincidiu com o da release. O roteiro simulou a versão de origem 1.0.2 apenas na comparação do atualizador e encerrou sem instalar o arquivo público. Os 242 testes automatizados e os dois perfis Windows passaram. [Artefato da execução](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43626462844/artifacts/14127165952).

### Validação final do pacote Windows da execução 43650469127

A [execução Windows 43650469127](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43650469127) passou nos dois perfis fictícios, com atualização controlada a partir de 1.0.4 e 1.0.5 com Guard. Nos dois perfis, o aplicativo instalado aplicou a prévia do XLSX e manteve os registros após reabrir. O cancelamento da venda devolveu o estoque e estornou o caixa uma vez, com persistência após reabertura. O perfil com Guard também baixou o instalador público 1.0.4 por HTTPS e verificou seu hash.

O [artefato nexo-windows](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43650469127/artifacts/14136755503) foi baixado e conferido após o upload. Contém os dois relatórios de QA, o relatório do pacote, o NSIS, o blockmap e o latest.yml. O NSIS do build NEXO-3E2B6BE692122B3C mede 124.153.354 bytes e seu SHA-512 confere com o manifesto da versão 1.0.6. A candidata segue para testes em ambiente isolado. A interface ainda precisa confirmar a conclusão após a nova versão abrir, e a distribuição HTTPS da própria candidata segue sem evidência.


A revisão seguinte implementa a confirmação pós-abertura. Um registro local temporário é criado antes de chamar o instalador, limpo se o executável falha ao iniciar e consumido depois que o aplicativo prepara o SQLite e carrega a janela principal. O teste instalado usa um registro preparado no perfil fictício porque os instaladores históricos antecedem esse recurso. A criação do registro pelo atualizador e seu consumo pela versão de destino ainda precisam ser verificados no mesmo ensaio Windows.

#### Confirmação na primeira abertura

O log da [execução 43652065841](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652065841) registrou a mensagem “Atualização concluída. Você está usando a versão 1.0.6.” na janela do aplicativo instalado em perfil descartável. A execução falhou porque a expectativa de teste consultou `version`, enquanto o manifesto do pacote usa `productVersion`. O commit `6b40a6f` passou a validar o campo correto e a compartilhar a expectativa entre os dois cenários. O workflow manteve a falha e não disponibilizou o instalador dessa execução.

O ensaio com registro preparado verifica a leitura e a remoção na primeira abertura. O ensaio adicional parte de um instalador 1.0.6 aprovado, conferido por SHA-256, e aciona a instalação da 1.0.7 pelo próprio NEXO. Nele, o roteiro verifica que cancelar a confirmação não cria o registro, que a versão anterior grava as versões de origem e destino após o aceite e que a nova versão mostra a conclusão depois de abrir. O roteiro reabre manualmente a versão de destino no perfil descartável para inspecionar a mensagem. A reabertura automática silenciosa tem evidência em um ensaio anterior.


A [execução corrigida 43652959533](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533) aprovou 244 testes e confirmou a mensagem na primeira abertura, seguida de estado inicial na abertura seguinte, nos dois perfis fictícios com registro preparado. O [ZIP 1.0.6 baixado](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533/artifacts/14136753150) contém o build `NEXO-D9777AA12793DE3B` e a distribuição aprovada. O [ensaio 43654001179](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43654001179) foi iniciado com esse instalador como origem para verificar a criação e o consumo do registro no mesmo fluxo.

O [ensaio 43654001179](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43654001179) comprovou, no Windows Server, que a origem 1.0.6 gravou o registro após o aceite, que o NSIS instalou a 1.0.7 e que a interface confirmou a conclusão somente depois de abrir a nova versão. Os 244 testes passaram. A execução falhou mais tarde no ensaio de interrupção porque os arquivos da interface eram iguais nas duas versões. O roteiro agora também observa a gravação dos metadados do destino quando não há um arquivo de interface novo. O ZIP de destino permaneceu retido. [Reexecução com a correção](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655162737)


### Confirmação e recuperação entre 1.0.6 e 1.0.7

A [execução 43655162737](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655162737) passou com 246 testes automatizados e aprovou os dois perfis Windows Server 2025. A origem 1.0.6 registrou a instalação solicitada, a 1.0.7 confirmou a conclusão após abrir, e a interrupção deliberada do NSIS em pasta descartável foi seguida de reinstalação com registros, integridade SQLite e política do Guard preservados. O ensaio usou canal local para a candidata e consultou a release pública em HTTPS em cenário separado. A reabertura da 1.0.7 para inspecionar a mensagem foi controlada pela automação.

O [ZIP 1.0.7](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655162737/artifacts/14137868927) foi baixado e conferido. Os dois relatórios do build `NEXO-B23F2A16EC2CCFEA` passaram sem erros de interface. O instalador de 124.154.300 bytes corresponde ao tamanho, à versão e ao SHA-512 de `latest.yml`. SHA-256: `71BFB1FD0209C41B0E0A058090D84E35491709B9715E13F4B5251C6F0B6D57FD`. O blockmap está presente. O artefato fica disponível até 29/11/2026 às 00:00 UTC. A distribuição pública da própria candidata e a atualização em Windows cliente seguem sem evidência.

A execução automática da branch também passou com 246 testes, confirmou a recuperação após interrupção e gerou uma candidata 1.0.6 com o mesmo código do ensaio 1.0.7. A versão 1.0.6 desse ensaio é o build NEXO-2E0FF0BCD56E8CA6. [Execução automática](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655163138)
