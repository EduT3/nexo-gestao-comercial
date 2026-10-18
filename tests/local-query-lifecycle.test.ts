import { describe, expect, it } from 'vitest';
import { createQueryLifecycle } from '../src/client/query-lifecycle';
import { listPage, searchText } from '../src/client/local-list';

describe('consultas locais durante uso prolongado', () => {
  function scope() { const gate = createQueryLifecycle(); gate.mount(); gate.setActive(true); return gate; }
  it('descarta respostas e erros de consultas ultrapassadas', () => {
    const gate = scope(), previous = gate.request()!, latest = gate.request()!;
    expect(previous()).toBe(false); expect(latest()).toBe(true);
  });
  it('não consulta telas escondidas e não reaproveita respostas ao retornar', () => {
    const gate = scope(), old = gate.request()!;
    gate.setActive(false); expect(gate.request()).toBeUndefined(); expect(old()).toBe(false);
    gate.setActive(true); expect(old()).toBe(false); expect(gate.request()!()).toBe(true);
  });
  it('não deixa snapshots anteriores à gravação substituir o resultado salvo', () => {
    const gate = scope(), old = gate.request()!, task = gate.beginMutation()!;
    expect(gate.request()).toBeUndefined(); expect(gate.beginMutation()).toBeUndefined();
    expect(old()).toBe(false); expect(task.finish()).toBe(true); expect(task.finish()).toBe(true);
    expect(old()).toBe(false); expect(gate.request()!()).toBe(true);
  });
  it('descarta consultas e conclusões após desmontagem ou troca de empresa', () => {
    const gate = scope(), old = gate.request()!, task = gate.beginMutation()!;
    gate.dispose(); gate.mount(); gate.setActive(true);
    expect(old()).toBe(false); expect(task.isCurrent()).toBe(false); expect(task.finish()).toBe(false);
    expect(gate.request()!()).toBe(true);
  });
  it('permite concluir uma gravação da mesma empresa ao navegar e consulta ao retornar', () => {
    const gate = scope(), task = gate.beginMutation()!;
    gate.setActive(false); expect(task.finish()).toBe(true); expect(gate.request()).toBeUndefined();
    gate.setActive(true); expect(gate.request()!()).toBe(true);
  });
});

it('busca sem acentos/capitalização e páginas limitadas com último item acessível', () => {
  expect(searchText('  ÁGUA São João  ')).toBe('agua sao joao');
  const rows = Array.from({ length: 125 }, (_, index) => index);
  expect(listPage(rows, 0).rows).toHaveLength(50);
  expect(listPage(rows, 2).rows).toEqual(rows.slice(100));
  expect(listPage(rows, 99).page).toBe(2);
  expect(listPage([], 99)).toMatchObject({ rows: [], page: 0, pages: 1, total: 0 });
});
