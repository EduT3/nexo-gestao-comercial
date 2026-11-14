import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { adjustSaleQuantity } from '../src/client/LocalSalesBalcao';
import { NexoNavigation } from '../src/client/NexoNavigation';
import { NexoTopbar } from '../src/client/NexoTopbar';

describe('NEXO Balcão — quantidades exatas', () => {
  it('incrementa unidades e mantém até três casas decimais sem ponto flutuante', () => {
    expect(adjustSaleQuantity('0,250', 1)).toBe('1,25');
    expect(adjustSaleQuantity('1,001', 1)).toBe('2,001');
    expect(adjustSaleQuantity('4', -1)).toBe('3');
    expect(adjustSaleQuantity('0,250', -1)).toBe('0,25');
  });
  it('não produz quantidade negativa e exige formato numérico válido', () => {
    expect(adjustSaleQuantity('1', -1)).toBe('1');
    expect(() => adjustSaleQuantity('inválida', 1)).toThrow();
  });
});

describe('NEXO Balcão — apresentação e permissões', () => {
  it('não mostra Contas nem Configurações ao operador', () => {
    const html = renderToStaticMarkup(
      <NexoNavigation area="vendas" productArea={false} administrator={false} preview={false} navigate={() => {}} />,
    );
    expect(html).toContain('Vender');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('>Contas<');
    expect(html).not.toContain('>Configurações<');
  });
  it.each([true, false])('mostra seletor somente com mais de uma empresa (%s)', (multiple) => {
    const html = renderToStaticMarkup(
      <NexoTopbar
        status={{ configured: true, authenticated: true, users: [], owner: 'Teste', dataFolder: '', companies: [{ id: 'empresa-1', name: 'Minha Loja', role: 'ADMIN' }, ...(multiple ? [{ id: 'empresa-2', name: 'Outra loja', role: 'ADMIN' as const }] : [])] }}
        company="empresa-1" preview={false} busy={false} excelBusy={false} cashOpen={true}
        onCompanyChange={() => {}} onBackup={() => {}} onLogout={() => {}}
      />,
    );
    expect(html).toContain('Minha Loja');
    expect(html.includes('Empresa em operação')).toBe(multiple);
    expect(html).toContain('Caixa aberto');
    expect(html).not.toContain('Adega JG');
  });
});
