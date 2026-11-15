# Compatibilidade Windows do NEXO Balcão

## Estado da homologação

A release pública é a **1.0.4**. A candidata **1.0.7** foi instalada e exercitada em Windows Server 2025 no GitHub Actions. A revisão aprovada é o build `NEXO-B23F2A16EC2CCFEA`. Esse resultado cobre o pacote e os fluxos executados nesse ambiente. A homologação em Windows cliente x64 continua pendente. [Release pública](https://github.com/EduT3/nexo-gestao-comercial/releases/tag/v1.0.4) · [Execução da candidata](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655162737)

| Sistema | Prioridade | Evidência | Instalação e atualização |
| --- | --- | --- | --- |
| Windows 10 22H2 x64 com 8 GB | P0 | Pendente. Registrar edição, build 19045 com revisão, segurança e hardware do equipamento. | Usar o instalador público e depois a candidata em canal controlado, com perfil fictício. |
| Windows 11 x64 | P0 | Roteiro comercial aprovado com executável extraído no Windows cliente Pro 26H2, build 26300.9974. Instalação e matriz comparativa pendentes. | Repetir as mesmas operações com os mesmos instaladores, dados e condições. |
| Windows 10 22H2 x64 com 4 GB | P1 | Pendente. Perfil de teste de memória limitada. | Repetir o ensaio do Windows 10 com memória e paginação medidas. |
| Windows Server 2025 x64 | CI | Instalador 1.0.7, duas origens fictícias, 246 testes e validação de distribuição. | Consulte o resultado e os relatórios anexados à execução. |
| Windows 7 | P3 | Fora do suporte. Análise técnica, sem execução. | Sem procedimento de instalação. |

O suporte regular da Microsoft ao Windows 10 22H2 terminou em **14 de outubro de 2025**. Sem atualizações de segurança, aumenta a exposição a vulnerabilidades. O ESU oferece atualizações de segurança para dispositivos elegíveis conforme as condições da Microsoft. [Ciclo de suporte](https://learn.microsoft.com/windows/release-health/release-information) · [Programa ESU](https://www.microsoft.com/en-us/windows/extended-security-updates)

## Auditoria do pacote

A revisão do código declara Electron 44.4.1, electron-builder 26.18.0 e electron-updater 6.8.11. O alvo publicado pelo workflow é NSIS x64. O SQLite é fornecido pelo `node:sqlite` do runtime embarcado no Electron. O processo principal acessa o banco em `%LOCALAPPDATA%\NEXO` e a interface usa IPC com isolamento de contexto. Os números de Chromium, Electron, Node, SQLite e a edição exata do Windows de cada bancada devem ser coletados do executável instalado e registrados no resultado. [Arquitetura e limites da instalação](ARCHITECTURE.md) · [Auditoria do empacotamento](GITHUB-ACTIONS-WINDOWS.md)

O Electron 22 foi a última linha com suporte ao Windows 7, 8 e 8.1. Portar o NEXO atual para Windows 7 exigiria outra matriz de runtime, SQLite, navegador e atualização, com versões antigas sem manutenção. O NEXO mantém o runtime atual e suas proteções. [Política de plataforma do Electron](https://www.electronjs.org/blog/windows-7-to-8-1-deprecation-notice)

No Windows cliente, verifique criação e acesso a `LOCALAPPDATA` por um usuário padrão, instalação e desinstalação, monograma do executável e do instalador, apresentação do aviso de editor, diretórios com espaços e acentos, diálogo de arquivos e cache do atualizador. Preserve IPC, sandbox, proteção de arquivos e política do Guard durante o teste.

## Evidência parcial no Windows 11 x64

Em Windows cliente Pro 26H2, build 26300.9974, com Ryzen 7 7700X e 31,1 GiB de memória visível, a candidata 1.0.6 abriu em perfil fictício com sandbox ativo. O ensaio criou o responsável, cadastrou um produto pelo IPC normal, fechou o aplicativo e confirmou que o produto permaneceu ao reabrir. O banco foi criado na pasta temporária designada para o teste. O executável informou Electron 44.4.1, Chromium 152.0.7977.78, Node 24.21.0 e SQLite 3.53.4.

O executável foi extraído da carga x64 do NSIS da execução 43650469127, build `NEXO-3E2B6BE692122B3C`. SHA-256 do instalador: `67BBBDE17D456964C379456EE63EA2EA32C7381EEB06FBB58BF8E04A7A441AE0`. O teste local não executou o NSIS e não mediu desempenho nem atualização. [Artefato de origem](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43650469127/artifacts/14136755503)

### Roteiro comercial com a candidata aprovada mais recente

O mesmo host executou o roteiro Windows com a carga x64 extraída do NSIS 1.0.6, build `NEXO-D9777AA12793DE3B`, da execução 43652959533. O instalador usado como origem tinha SHA-256 `D06ECA30CB88CE5B987B537A6485FFAF382F5DC99838197A6ECE4B701A68CEBC`. O resultado registrou 23 verificações, 34 capturas, 12 encerramentos normais e zero erros no renderer.

Passaram primeiro acesso, restrições de operador, entrada de estoque, venda fracionária com quatro formas de pagamento, caixa, cancelamento com estorno, importação e exportação Excel, backup e recuperação, persistência e Guard. O roteiro também verificou navegação por teclado e largura da página em 1280 × 720, 1366 × 768 e 1920 × 1080. Na tela de Contas, verificou filtros e estado vazio. Um ensaio adicional no mesmo executável verificou pagamento de R$ 2,00 e recebimento de R$ 3,50 em dinheiro, com saldo de R$ 11,50 preservado na reabertura. Os dois estornos reabriram as contas e devolveram o saldo a R$ 10,00. O roteiro acionou o IPC normal e respondeu às confirmações nativas por automação. Um ensaio separado aplicou escala de 125% e 150% no Chromium embarcado. Nas larguras equivalentes a 1366 e 1920 pixels físicos o foco e Enter navegaram por Início, Vender, Estoque, Caixa e Contas, sem transbordamento horizontal. As larguras em pixels CSS foram 1092, 1536, 910 e 1280. O ensaio verificou escala efetiva e largura do conteúdo, sem mudar o DPI do Windows. A altura útil e os diálogos nativos com DPI real do sistema continuam pendentes.

A primeira abertura medida no roteiro ficou em 571 ms. Dez reaberturas medidas ficaram entre 374 e 398 ms. São tempos da automação até a janela e a verificação inicial por IPC, com perfil fictício. Instalação pelo NSIS, troca de versão, comparação com Windows 10 e ensaio com rede desligada continuam pendentes no Windows cliente. A falha imediata de instalação e a confirmação pós-abertura usaram simulação controlada. [Pacote de origem](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533/artifacts/14136753150)

## Procedimento de bancada

1. Prepare uma instalação real ou VM licenciada e descartável de cada sistema, com snapshot limpo e conta Windows de teste. Separe o ensaio de 4 GB do de 8 GB. Registre build e revisão, arquitetura, CPU, memória, disco, DPI e estado da rede e das atualizações.
2. Baixe a 1.0.4 pública e a candidata aprovada. Registre origem, versão, identificador do build, SHA-256, assinatura e data. Confira o instalador contra o manifesto antes de executar. Use o perfil fictício e jamais a base de uso comercial.
3. Faça instalação limpa e primeiro acesso. Cadastre e edite um produto, receba mercadoria, confira movimentações, faça vendas em dinheiro, Pix, débito e crédito, abra e feche o caixa e verifique cancelamento, estorno e valor de caixa. Crie, consulte e liquide contas a pagar e a receber. Importe e exporte XLSX, gere backup, restaure uma cópia e confira a base após reabrir.
4. Ative e desative o Guard, teste PIN incorreto, bloqueio e recuperação por chave fictícia. Compare registros, permissões e política antes e depois da reabertura. Repita a operação local com a rede desligada.
5. Na versão pública anterior, verifique consulta e download HTTPS. Use um canal de teste controlado para a candidata posterior. Confira integridade, instalação, versão em execução, banco, perfis e Guard. Interrompa um download e simule falha do instalador apenas no snapshot descartável. Confirme nova tentativa e recuperação com cópia compatível.
6. Repita a mesma carga em ambos os sistemas. Registre amostras de inicialização, memória e CPU em repouso e durante operações, busca, finalização de venda, abertura de históricos e importação/exportação Excel. Use 1366 × 768 e 1920 × 1080, com escalas de 100%, 125% e 150%. Registre também cortes, rolagem, foco e controle por teclado.
7. Guarde resultados por sistema, build, pacote e cenário, com amostras brutas, capturas sem dados sensíveis, logs e hashes. Compare as mesmas cargas antes de recomendar requisitos.

### Repetir o roteiro automatizado em uma VM cliente

Use uma VM descartável sem instalação prévia do NEXO. Clone a branch no commit `6b40a6f`, instale as dependências de teste com Node.js 24 e `npm.cmd ci`. Na pasta do repositório, ajuste os caminhos dos dois instaladores baixados. A [release 1.0.4](https://github.com/EduT3/nexo-gestao-comercial/releases/tag/v1.0.4) é a origem e o [ZIP da execução 43652959533](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43652959533/artifacts/14136753150) é o destino. Mantenha `latest.yml` e o blockmap junto à candidata.

```powershell
$origem = (Resolve-Path 'C:\QA\NEXO-Setup-1.0.4.exe').Path
$destino = (Resolve-Path 'C:\QA\candidata\installer\NEXO-Setup-1.0.6.exe').Path
if ((Get-FileHash -LiteralPath $origem).Hash -ne '830AC83A9038A521403FFF6A597FF09882B427E9E431429D402353CE495E6119') {
    throw 'SHA-256 da origem divergente'
}
if ((Get-FileHash -LiteralPath $destino).Hash -ne 'D06ECA30CB88CE5B987B537A6485FFAF382F5DC99838197A6ECE4B701A68CEBC') {
    throw 'SHA-256 do destino divergente'
}

$raiz = (Get-Location).Path
$qa = Join-Path $env:TEMP ('nexo-compat-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $qa | Out-Null
$programa = Join-Path $qa 'programa'
$snapshot = Join-Path $qa 'origem-extraida'
$instalacao = Start-Process -FilePath $origem -ArgumentList @('/S', "/D=$programa") -PassThru -Wait -WindowStyle Hidden
if ($instalacao.ExitCode -ne 0 -or !(Test-Path -LiteralPath (Join-Path $programa 'NEXO.exe'))) {
    throw 'Falha na instalação da origem'
}
Copy-Item -LiteralPath $programa -Destination $snapshot -Recurse

$zip = Join-Path $raiz 'node_modules\electron-winstaller\vendor\7z.exe'
& $zip x $destino ('-o' + $qa) '$PLUGINSDIR\app-64.7z' -y
if ($LASTEXITCODE -ne 0) { throw 'Falha ao extrair a carga NSIS' }
& $zip x (Join-Path $qa '$PLUGINSDIR\app-64.7z') ('-o' + (Join-Path $qa 'artifacts\installer\win-unpacked')) -y
if ($LASTEXITCODE -ne 0) { throw 'Falha ao extrair o aplicativo x64' }

$env:NEXO_QA_PROGRAM = $programa
$env:NEXO_QA_BASELINE = $snapshot
$env:NEXO_QA_SETUP = $destino
$env:NEXO_QA_PUBLIC_RELEASE = '1'
Push-Location -LiteralPath $qa
try {
    node (Join-Path $raiz 'scripts\verify-cloud-windows.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Roteiro Windows reprovado' }
} finally {
    Pop-Location
}
```

O roteiro instala a candidata pelo atualizador e guarda o resultado em `artifacts/cloud-qa` dentro da pasta temporária. Verifique o `result.json` e os metadados do executável antes de registrar a aprovação. Este procedimento é para a origem pública. Use também os passos manuais da bancada para instalação limpa da candidata, Guard já ativo na origem, desconexão da rede e DPI nativo do Windows.

## Desempenho, falhas e limitações

O ensaio SQLite existente usa bases fictícias de 1.000, 10.000 e 50.000 produtos. O relatório M2 também registra inicialização, memória, CPU e Excel no runner, com as limitações de amostragem. Nenhum desses ensaios compara os dois sistemas cliente nas mesmas condições. O mínimo do NEXO segue sem medição, e o perfil de 8 GB é o ponto de partida da bancada. [Benchmarks SQLite](benchmarks/catalogo-m2.json) · [Relatório M2](EVOLUCAO-M2.md) · [Cenários de atualização](UPDATE-QA-M2.6.md)

A altura mínima em escala elevada foi reproduzida no Windows 11 cliente. Ainda não há defeitos específicos confirmados no Windows 10. Falhas e correções do empacotamento e do atualizador no Windows Server permanecem nos relatórios técnicos. Nenhuma alteração de dependência foi feita para a matriz.

### Medições no Windows 11 cliente

O executável extraído do build NEXO-D9777AA12793DE3B foi medido no mesmo Windows 11 Pro 26300.9974, com uma base fictícia nova de 1.000 produtos e 11 vendas Pix. A busca pelo código até o resultado aparecer teve mediana de 6,17 ms. A gravação da venda via IPC ficou em 1,55 ms. A primeira página do histórico de estoque ficou em 1,46 ms, e a de vendas, em 1,36 ms. A exportação XLSX ficou em 61,89 ms. O ensaio descartou a primeira execução de cada operação e registrou 10 amostras por operação, ou cinco para Excel.

Os processos principal e de interface somaram cerca de 250 MiB residentes em repouso e 258 MiB durante as leituras de histórico. A CPU observada por processo foi inferior a 0,1% no intervalo de um segundo em repouso e ficou em 2,53% e 1,87% no intervalo curto de 22 leituras via IPC. Esses valores descrevem o roteiro com janela oculta. A medição de venda exclui o tempo do operador, e a de Excel usa um caminho de gravação fornecido pela automação. A importação do mesmo XLSX de 1.000 produtos em seis perfis vazios teve medianas de 228,54 ms para leitura e prévia e 37,33 ms para confirmar e gravar. Foram usadas cinco amostras após descartar a primeira execução. Em todos os perfis, a prévia manteve o cadastro vazio até a confirmação. A comparação com Windows 10 segue pendente. [Amostras e método](benchmarks/windows11-1.0.6.json)

### Altura mínima da janela em escala elevada

Com escala de 150%, o build NEXO-D9777AA12793DE3B recebeu um pedido de área de conteúdo de 910 × 512 pixels lógicos. A janela ficou com 921 × 650 pixels externos e 910 × 598 de conteúdo, por causa da altura mínima fixa. A correção limita as dimensões iniciais e mínimas das janelas principal e de recuperação à área útil do monitor principal. Os testes do cálculo e a compilação local passaram. A correção também foi exercitada no executável extraído da candidata 1.0.7.

A integração local com o Electron confirmou as duas janelas na compilação corrigida, com sandbox ativo e área útil de 910 × 480 pixels lógicos simulada antes da inicialização. A janela principal abriu com 910 × 480 e a recuperação, acionada por SQLite fictício inválido, com 901 × 480. O teste não mudou configurações do sistema.

O executável extraído do [ZIP 1.0.7](https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43655162737/artifacts/14137868927), build NEXO-B23F2A16EC2CCFEA, foi executado no Windows 11 Pro x64 26300.9974. Em escala de 150%, a área útil informada pelo Electron foi 2294 × 928 e a janela principal abriu com 1201 × 800. Em 250%, usado para reduzir a área útil do ensaio a 1376 × 557, as duas janelas adotaram mínimo de altura de 557 e abriram com altura de 558 por arredondamento. O sandbox permaneceu ativo. A escala foi aplicada ao processo do teste. Ainda falta o ensaio com DPI nativo, barras de tarefas e diálogos nas resoluções da matriz.

### Operação local com a resolução de endereços indisponível

Na mesma 1.0.7, um perfil fictício foi aberto com resolução de endereços bloqueada no processo Electron. Uma tentativa HTTPS ao GitHub retornou ERR_NAME_NOT_RESOLVED. No mesmo processo, primeiro acesso, cadastro de produto, entrada de estoque, abertura de caixa e venda em dinheiro funcionaram. O histórico mostrou uma venda e o caixa, R$ 15,00. A rede do Windows permaneceu disponível para outros programas. O ensaio com a VM integralmente desconectada continua pendente.
