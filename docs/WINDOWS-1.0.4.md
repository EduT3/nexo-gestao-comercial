NEXO Balcão 1.0.4 para Windows

Instale pelo arquivo NEXO-Setup-1.0.4.exe. Quem usa o ZIP anterior deve instalar esta versão uma vez para habilitar a atualização pelo aplicativo.

Alterações
- Instalador Windows com o monograma do NEXO.
- Acesso por nome para operadores e responsável.
- Atualizações em Configurações, com consulta, download e confirmação antes de reiniciar.
- Cópia de segurança antes de instalar a atualização.
- Salvamento da entrada de estoque visível durante a rolagem e ações de produtos por ícones.
- Construção e testes Windows executados no GitHub Actions.

Validação
- 222 testes automatizados aprovados.
- Instalador executado em Windows descartável na nuvem.
- Programa instalado aprovado nos fluxos de vendas, estoque, caixa, backup, restauração e reabertura.
- Abertura observada de 741 ms e 583 ms no ambiente de teste, com base fictícia pequena.
- Código da atualização coberto por testes de consulta, download, falha e bloqueio de instalação antecipada. A troca automática entre duas versões publicadas ainda precisa ser validada quando houver uma versão posterior.
- Instalador sem assinatura digital de editor.

Dados
A instalação padrão usa a base em LOCALAPPDATA/NEXO. Se você usava o iniciador portátil com perfil separado, gere o backup nessa cópia e restaure pelo aplicativo instalado para levar seus dados.

Execução Windows
https://github.com/EduT3/nexo-gestao-comercial/actions/runs/43345334975
