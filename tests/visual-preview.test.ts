import { describe, expect, it } from 'vitest';
import { previewRequest } from '../src/client/preview/adapter.js';
import type { Session } from '../src/shared/contracts.js';

describe('prévia visual isolada', () => {
  it('exibe contexto fictício sem credencial de sessão utilizável e sem misturar empresas', () => {
    const session = previewRequest('/auth/session','GET') as Session;
    expect(session.demo).toBe(true); expect(session.csrfToken).toBe('visual-preview');
    expect(session.user.email).toBe('preview@example.invalid');
    for (const company of session.companies) {
      const list = previewRequest(`/companies/${company.id}/products`, 'GET') as { products: {companyId:string}[] };
      expect(list.products.length).toBeGreaterThan(0);
      expect(list.products.every(product => product.companyId === company.id)).toBe(true);
      expect(previewRequest(`/companies/${company.id}/cash/movements`, 'GET')).toMatchObject({ movements: [] });
      list.products.length = 0;
      expect((previewRequest(`/companies/${company.id}/products`, 'GET') as {products:unknown[]}).products.length).toBeGreaterThan(0);
    }
  });
  it('recusa gravações e não simula sucesso de operações comerciais', () => {
    expect(() => previewRequest('/companies/example/finance/entries','POST')).toThrow('apenas visual');
    expect(() => previewRequest('/companies/example/products','PATCH')).toThrow('apenas visual');
  });
});
