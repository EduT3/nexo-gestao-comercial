import { useMemo } from 'react';
import { Tutorial, type TutorialStep, type TutorialStore } from './Tutorial';

export const localTutorialSteps = (administrator: boolean): TutorialStep[] => [
  { id: 'company', title: 'Comece pela empresa certa', location: 'Cabeçalho · Empresa em uso', target: '[data-tutorial-company]', text: 'Confira Empresa em uso antes de trabalhar. Adega JG e Depósito JG têm registros separados. Ao trocar de empresa, o rascunho de produto e a prévia Excel são descartados; confira seu trabalho antes de trocar.' },
  { id: 'products', title: 'Encontre seus produtos', location: 'Produtos', route: 'produtos', text: administrator ? 'Use Buscar produto para localizar nome ou código. Novo produto abre o cadastro; confira unidade, custo e preço antes de Salvar produto. Cancelar fecha e limpa esse formulário. Cadastrar um produto não dá entrada no estoque.' : 'Em Produtos, consulte nome, código, preço e situação. Cadastros e alterações ficam com o administrador.' },
  ...(administrator ? [
    { id: 'support' as const, title: 'Organize os cadastros de apoio', location: 'Mais opções → Clientes, fornecedores e categorias', route: 'cadastros', text: 'Cadastre o fornecedor antes de registrar uma compra. Clientes e categorias também ficam aqui. Abra somente o formulário de que precisar e revise os dados antes de salvar.' },
    { id: 'purchases' as const, title: 'Registre a mercadoria recebida', location: 'Compras', route: 'compras', text: 'Escolha o fornecedor, os produtos, as quantidades e os custos da compra. Confira subtotais, total e vencimento; Remover item corrige qualquer linha. Ao confirmar o recebimento, o NEXO registra a compra, a entrada no estoque e a conta a pagar. Use apenas quando a mercadoria tiver sido recebida e conferida.' },
  ] : []),
  { id: 'stock', title: 'Confira o estoque', location: 'Estoque', route: 'estoque', text: 'Consulte o saldo dos produtos e o histórico de entradas e saídas. Compras, vendas e cancelamentos atualizam o estoque pelos movimentos; a consulta não altera saldos.' },
  { id: 'cash', title: 'Prepare e encerre o atendimento', location: 'Caixa', route: 'caixa', text: `Antes de vender, abra seu caixa e informe o dinheiro inicial. ${administrator ? 'Suprimento e sangria ficam nas ações de movimento. ' : ''}Ao terminar, abra Encerrar atendimento e fechar caixa, conte o dinheiro e confira os valores antes de confirmar.` },
  { id: 'sales', title: 'Venda com os valores conferidos', location: 'Vender', route: 'vendas', text: `Escolha os produtos, quantidades${administrator ? ', desconto' : ''} e forma de pagamento. Confira o total e o valor recebido antes de Concluir venda. Essa confirmação grava a venda e movimenta estoque, caixa e financeiro. Para aprender, basta observar a tela.` },
  ...(administrator ? [
    { id: 'finance' as const, title: 'Acompanhe o dia e as contas', location: 'Financeiro', route: 'financeiro', text: 'Use Pagar para as contas dos fornecedores, Receber para as contas dos clientes e Resumo para os totais e o movimento do dia. Registrar pagamento, recebimento ou estorno muda os registros financeiros; revise empresa, conta e valor antes de confirmar. O histórico permanece disponível.' },
    { id: 'excel' as const, title: 'Use planilhas com uma conferência antes', location: 'Mais opções → Planilhas Excel', route: 'excel', text: 'Baixar modelo Excel prepara a planilha de produtos. Selecionar planilha mostra a prévia, com erros e duplicidades; só Confirmar importação grava os produtos. Aguarde o processamento antes de trocar de empresa. Editar um relatório exportado não altera o NEXO.' },
    { id: 'backup' as const, title: 'Guarde uma cópia de segurança', location: 'Mais opções → Backup e dados', route: 'dados', text: 'Veja onde os dados ficam e a data do último backup. Gerar backup guarda uma cópia completa das duas empresas; mantenha outra cópia em um dispositivo separado. Restaurar backup substitui a base após confirmação. Excel não substitui o backup completo.' },
  ] : []),
];

export function LocalTutorial({ userId, company, companyName, administrator, currentRoute, busy, onNavigate }: {
  userId: string; company: string; companyName: string; administrator: boolean; currentRoute: string; busy: boolean;
  onNavigate(step: TutorialStep): void;
}) {
  const store = useMemo<TutorialStore>(() => ({
    read: () => window.nexoLocal!.tutorialPreference(company, userId),
    write: value => window.nexoLocal!.saveTutorialPreference(company, userId, value),
  }), [company, userId]);
  return <Tutorial steps={localTutorialSteps(administrator)} store={store} companyName={companyName} currentRoute={currentRoute} busy={busy} onNavigate={onNavigate} />;
}
