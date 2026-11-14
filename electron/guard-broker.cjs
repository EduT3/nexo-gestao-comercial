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
  const pending = new Map();
  let generation = 0;

  function invalidate() {
    generation++;
    pending.clear();
  }

  return {
    invalidate,
    async run(operation, perform, checkPermission = async () => {}) {
      if (!Object.hasOwn(operations, operation)) return perform();
      const scope = generation;
      await checkPermission();
      const config = await store.status();
      if (scope !== generation) throw Error('O contexto da operação mudou.');
      if (!config.enabled || (!config.all && !config.actions.includes(operation))) return perform();
      const id = randomUUID();
      const now = Date.now();
      for (const [key, request] of pending) if (request.expires <= now) pending.delete(key);
      if (pending.size >= 32) throw Error('Há muitas autorizações pendentes.');
      pending.set(id, { operation, perform, checkPermission, pinLength: config.pinLength ?? 4, expires: now + 60000 });
      throw Error('NEXO_GUARD_REQUIRED:' + id);
    },
    describe(id) {
      const request = pending.get(id);
      if (!request || request.expires <= Date.now()) throw Error('Solicitação expirada.');
      return { label: operations[request.operation], pinLength: request.pinLength };
    },
    cancel(id) {
      pending.delete(id);
    },
    async approve(id, pin) {
      const request = pending.get(id);
      const scope = generation;
      if (!request || request.expires <= Date.now()) throw Error('Solicitação expirada.');
      if (request.verifying) throw Error('Aguarde a validação do PIN.');
      request.verifying = true;
      try {
        await store.authorize(request.operation, pin, { required: true });
        await request.checkPermission();
        if (scope !== generation || pending.get(id) !== request || request.expires <= Date.now()) {
          throw Error('Solicitação expirada ou cancelada.');
        }
        pending.delete(id);
        return request.perform();
      } finally {
        request.verifying = false;
      }
    },
  };
}

module.exports = { createGuardBroker, operations };
