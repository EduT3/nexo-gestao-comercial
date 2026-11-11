import { describe, expect, it } from 'vitest';
import { createLocalPreviewBridge, PREVIEW_READ_ONLY } from '../src/client/preview/local-adapter';
import { previewHash, previewLocation } from '../src/client/preview/location';

describe('prévia pública sem gravação de dados comerciais', () => {
 it('pagina as 53 vendas e preserva filtros e detalhes por empresa', async () => {
  const bridge = createLocalPreviewBridge();
  const first = await bridge.salesHistory('adega-jg', {});
  const second = await bridge.salesHistory('adega-jg', { page: 1 });
  expect([first.total, first.rows.length, second.rows.length]).toEqual([53, 50, 3]);
  expect(new Set([...first.rows, ...second.rows].map(row => row.id)).size).toBe(53);
  const cancelled = await bridge.salesHistory('adega-jg', { status: 'CANCELLED' });
  expect(cancelled.total).toBe(1);
  const detail = await bridge.saleDetails('adega-jg', first.rows[0]!.id);
  expect(detail.items.reduce((sum, row) => sum + row.total_cents, 0n)).toBe(detail.total_cents);
  await expect(bridge.saleDetails('deposito-jg', detail.id)).rejects.toThrow('não encontrada');
  expect((await bridge.salesHistory('adega-jg', { search: detail.id })).total).toBe(1);
 });
 it('recusa todas as operações de gravação e ferramentas locais', async () => {
  const bridge = createLocalPreviewBridge();
  const names = ['configure','login','logout','createOperator','createProduct','updateProduct','createPerson','createCategory','receivePurchase','confirmSale','cancelSale','openCash','moveCash','closeCash','createReceivable','receiveReceivable','reverseReceivable','payPayable','reversePayable','backup','restore','checkDataHealth','exportExcel','productImportTemplate','productImportPreview','productImportConfirm','tutorialPreference','saveTutorialPreference'] as const;
  const before = await bridge.finance('adega-jg');
  for (const name of names) await expect((bridge[name] as (...args: unknown[]) => Promise<unknown>)('adega-jg', {})).rejects.toThrow(PREVIEW_READ_ONLY);
  expect(await bridge.finance('adega-jg')).toEqual(before);
 });
 it('isola cópias e rejeita empresas desconhecidas', async () => {
  const bridge = createLocalPreviewBridge();
  const rows = await bridge.products('adega-jg'); rows[0]!.name = 'Alterado';
  expect((await bridge.products('adega-jg'))[0]!.name).not.toBe('Alterado');
  await expect(bridge.products('outra')).rejects.toThrow('Empresa indisponível');
  expect((await bridge.status()).companies).toHaveLength(2);
 });
 it('mantém os resumos e a orientação de caixa consistentes', async () => {
  const bridge = createLocalPreviewBridge();
  const finance = await bridge.finance('adega-jg');
  expect(finance.financialBalanceCents).toBe(finance.netRevenueCents + finance.netReceivedCents - finance.paidExpenseCents);
  const cash = (await bridge.cash('adega-jg'))[0]!;
  expect(cash.balance_cents).toBe(10000n + cash.movements.reduce((sum, row) => sum + row.amount_cents, 0n));
  expect(await bridge.cashAvailability('adega-jg')).toMatchObject({ open: true, canSell: true, balanceCents: cash.balance_cents });
  expect(await bridge.cashAvailability('deposito-jg')).toEqual({ open: false });
 });
 it('preserva os endereços públicos e as áreas do aplicativo', () => {
  for (const hash of ['cash','products','purchases','finance','inventory','pos']) {
   const location = previewLocation('#' + hash);
   expect(previewHash(location.area, location.more)).toBe(hash);
  }
 });
});

it('detalhe de compra na prévia é fictício, consistente, isolado e não altera financeiro',async()=>{
 const bridge=createLocalPreviewBridge(),before=await bridge.finance('adega-jg'),page=await bridge.purchaseHistory('adega-jg',{}),row=page.rows[0]!,detail=await bridge.purchaseDetails('adega-jg',row.id);expect(detail).toMatchObject({id:row.id,company_id:'adega-jg',total_cents:row.total_cents,created_at:row.created_at,payable:{amount_cents:row.total_cents,due_date:row.due_date}});expect(detail.items.reduce((sum,item)=>sum+item.total_cents,0n)).toBe(detail.total_cents);detail.items[0]!.product_name='Alterado';expect((await bridge.purchaseDetails('adega-jg',row.id)).items[0]!.product_name).not.toBe('Alterado');await expect(bridge.purchaseDetails('deposito-jg',row.id)).rejects.toThrow('Compra não encontrada');expect(await bridge.finance('adega-jg')).toEqual(before);
});
