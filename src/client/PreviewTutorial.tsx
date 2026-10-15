import { useMemo } from 'react';
import { newTutorialPreference, tutorialPreferenceSchema } from '../shared/tutorial';
import { Tutorial, type TutorialStep, type TutorialStore } from './Tutorial';

const previewSteps: TutorialStep[] = [
  { id: 'company', title: 'Explore uma empresa de demonstração', location: 'Cabeçalho · Empresa em operação', target: '#active-company', text: 'Confira a empresa no cabeçalho. Os dados aqui são fictícios; esta prévia não acessa a base do aplicativo Windows. Sua preferência de tutorial fica neste navegador, separada por usuário e empresa da demonstração.' },
  { id: 'products', title: 'Conheça o catálogo', location: 'Produtos', route: 'products', text: 'Explore a busca e a lista de produtos. As ações de cadastro desta demonstração não gravam alterações. No aplicativo Windows, o administrador pode cadastrar e manter produtos.' },
  { id: 'purchases', title: 'Veja como organizar as compras', location: 'Compras', route: 'purchases', text: 'Observe fornecedor, itens, quantidades e custos. Esta tela apresenta o fluxo; recebimentos reais são feitos no aplicativo Windows após conferir a mercadoria.' },
  { id: 'stock', title: 'Consulte saldos e movimentos', location: 'Estoque', route: 'inventory', text: 'Explore os saldos e o histórico fictícios. Entradas e saídas aparecem como movimentos para você entender a origem do saldo.' },
  { id: 'cash', title: 'Conheça o caixa', location: 'Caixa', route: 'cash', text: 'Observe abertura, movimentos e fechamento de caixa. No uso diário do Windows, cada operador abre seu caixa antes de vender e confere o dinheiro ao fechar.' },
  { id: 'sales', title: 'Conheça a tela de venda', location: 'PDV / Vendas', route: 'pos', text: 'Veja a escolha de produtos e as informações de pagamento. A demonstração não conclui vendas reais. No Windows, confira itens, total, pagamento e troco antes da confirmação.' },
  { id: 'finance', title: 'Acompanhe as contas', location: 'Financeiro', route: 'finance', text: 'Explore as contas fictícias. Pagamentos, recebimentos e estornos reais devem ser conferidos e executados no aplicativo Windows. Você pode reiniciar este guia pela Ajuda e tutorial.' },
];
export function PreviewTutorial({ userId, companyId, companyName, routes, currentRoute, onNavigate }: {
  userId: string; companyId: string; companyName: string; routes: string[]; currentRoute: string; onNavigate(step: TutorialStep): void;
}) {
  const store = useMemo<TutorialStore>(() => {
    const key = `nexo.preview.tutorial.v1:${JSON.stringify([userId, companyId])}`;
    return {
      async read() { const value = localStorage.getItem(key); return value ? tutorialPreferenceSchema.parse(JSON.parse(value)) : newTutorialPreference(); },
      async write(value) { localStorage.setItem(key, JSON.stringify(value)); },
    };
  }, [userId, companyId]);
  return <Tutorial preview steps={previewSteps.filter(step => !step.route || routes.includes(step.route))} store={store} companyName={companyName} currentRoute={currentRoute} onNavigate={onNavigate} />;
}
