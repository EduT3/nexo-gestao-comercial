const { randomUUID } = require('node:crypto');

const operations = {
  'create-operator': 'Cadastrar operador',
  'excel-export': 'Exportar relatório Excel',
  'product-import-template': 'Gerar modelo de produtos',
  'product-import-preview': 'Importar produtos',
  'product-import-confirm': 'Confirmar importação',
  'create-product': 'Cadastrar produto',
  'update-product': 'Alterar produto ou preço',
  'create-category': 'Cadastrar categoria',
  'create-person': 'Cadastrar cliente ou fornecedor',
  purchases: 'Consultar compras',
  'purchase-history': 'Consultar histórico de compras',
  'purchase-details': 'Consultar detalhes de compra',
  'receive-purchase': 'Registrar entrada de estoque',
  'move-cash': 'Movimentar dinheiro no caixa',
  'cancel-sale': 'Cancelar venda',
  'confirm-sale': 'Aplicar desconto na venda',
  'payables-page': 'Consultar contas a pagar',
  'receivables-page': 'Consultar contas a receber',
  'finance-totals': 'Consultar totais financeiros',
  finance: 'Consultar financeiro',
  'daily-report': 'Consultar relatório diário',
  'pay-payable': 'Pagar conta',
  'reverse-payable': 'Estornar pagamento',
  receivables: 'Consultar recebíveis',
  'create-receivable': 'Criar conta a receber',
  'receive-receivable': 'Receber pagamento',
  'reverse-receivable': 'Estornar recebimento',
  backup: 'Gerar backup',
  restore: 'Restaurar backup',
  'update-install': 'Instalar atualização',
  'data-health': 'Verificar integridade da base',
};

function createGuardBroker(store) {
  let pending;
  let generation = 0;

  function invalidate() {
    generation++;
    pending = undefined;
  }

  return {
    invalidate,
    async run(operation, perform) {
      if (!Object.hasOwn(operations, operation)) return perform();
      const scope = generation;
      const config = await store.status();
      if (scope !== generation) throw Error('O contexto da operação mudou.');
      if (!config.enabled || (!config.all && !config.actions.includes(operation))) return perform();
      const id = randomUUID();
      pending = { id, operation, perform, expires: Date.now() + 60000 };
      throw Error('NEXO_GUARD_REQUIRED:' + id);
    },
    describe(id) {
      if (pending?.id !== id || pending.expires <= Date.now()) throw Error('Solicitação expirada.');
      return { label: operations[pending.operation] };
    },
    cancel(id) {
      if (pending?.id === id) invalidate();
    },
    async approve(id, pin) {
      const request = pending;
      const scope = generation;
      if (!request || request.id !== id || request.expires <= Date.now()) throw Error('Solicitação expirada.');
      if (request.verifying) throw Error('Aguarde a validação do PIN.');
      request.verifying = true;
      try {
        await store.authorize(request.operation, pin);
        if (scope !== generation || pending !== request || request.expires <= Date.now()) {
          throw Error('Solicitação expirada ou cancelada.');
        }
        pending = undefined;
        return request.perform();
      } finally {
        request.verifying = false;
      }
    },
  };
}

module.exports = { createGuardBroker, operations };
