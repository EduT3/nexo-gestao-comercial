import { cp, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Fresh destination avoids damaging a previous package or any active data.
const destination = path.resolve('artifacts', `NEXO-Windows-${Date.now()}`);
await mkdir(destination, { recursive: true });
await cp('node_modules/electron/dist', destination, { recursive: true });
await rename(path.join(destination, 'electron.exe'), path.join(destination, 'NEXO.exe'));
const appFolder = path.join(destination, 'resources', 'app');
await mkdir(appFolder, { recursive: true });
await cp('electron', path.join(appFolder, 'electron'), { recursive: true });
await cp('node_modules/exceljs/dist/exceljs.min.js', path.join(appFolder, 'electron', 'exceljs.cjs'));
await cp('dist/client', path.join(appFolder, 'dist/client'), { recursive: true });
await cp('dist/local-runtime', path.join(appFolder, 'dist/local-runtime'), { recursive: true });
await cp('node_modules/zod', path.join(appFolder, 'node_modules/zod'), { recursive: true });
await writeFile(path.join(appFolder, 'package.json'), JSON.stringify({ name: 'nexo-local', version: '0.1.0', type: 'module', main: 'electron/main.cjs' }));
await writeFile(path.join(destination, 'LEIA-ME.txt'), [
  'NEXO — Gestão Comercial',
  '',
  'COMO ABRIR',
  '1. Mantenha todos os arquivos desta pasta juntos.',
  '2. Abra NEXO.exe.',
  '3. No primeiro acesso, crie a senha do administrador.',
  '',
  'DADOS E ATUALIZAÇÕES',
  'A base fica em %LOCALAPPDATA%\\NEXO\\nexo.sqlite, fora desta pasta.',
  'Para atualizar: gere um backup, feche o NEXO e abra o executável da nova pasta.',
  'Não apague nem mova %LOCALAPPDATA%\\NEXO.',
  '',
  'AJUDA E TUTORIAL',
  'Use Ajuda e tutorial para conhecer as telas, retomar ou reiniciar o guia.',
  'Fechar, pular ou desativar guarda sua escolha por usuario e empresa.',
  'As preferencias ficam em %LOCALAPPDATA%\\NEXO\\tutorial-preferences.',
  '',
  'BACKUP',
  'Use o botão Gerar backup e guarde uma cópia em outro dispositivo.',
  'Exportação Excel serve para consulta e não substitui o backup.',
  'Se os dados não abrirem, use a tela de recuperação para selecionar um backup.',
  'Informe a senha do responsável cadastrada na cópia e confirme a restauração.',
  'Os arquivos anteriores ficam em recovery-saved-* dentro da pasta dos dados.',
  'Uma recuperação interrompida não cria uma instalação vazia: selecione novamente o backup.',
  '',
  'HISTÓRICO DE VENDAS',
  'Em Vender, consulte todas as páginas, filtre identificação/cliente, período e situação.',
  'Detalhes mostra itens e valores históricos. Confira a identificação antes de cancelar.',
  '',
  'COMPRAS, CAIXA E FINANCEIRO',
  'Em Compras, confira subtotais, total e vencimento antes de Receber compra.',
  'Remover item corrige qualquer linha sem alterar as demais.',
  'Em Vender, Ir ao caixa mantém o rascunho. Abra seu próprio caixa antes de concluir.',
  'Em Financeiro, escolha Pagar, Receber ou Resumo.',
  'As listas iniciam em aberto; use situação/vencimento/busca para consultar o histórico.',
  'Nova conta a receber abre o cadastro somente quando necessário.',
  '',
  'O programa funciona sem internet, Node.js, banco ou Microsoft Excel instalado.',
  'Limite da V1: uso em um computador, sem sincronização em rede ou nuvem.',
  '',
].join('\r\n'));
console.log(destination);
