export default async function teardown() {
  const token = process.env.NEXO_E2E_CONTROL_TOKEN;
  if (!token) throw new Error('Controle de encerramento E2E indisponível.');
  const response = await fetch('http://127.0.0.1:3101/__e2e__/shutdown', {
    method: 'POST', headers: { 'x-e2e-control': token }, signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok || !(await response.json() as { closed?: boolean }).closed) {
    throw new Error('O ambiente E2E não confirmou o fechamento e a remoção do banco temporário.');
  }
  process.stdout.write('E2E: servidores encerrados e banco temporário removido.\n');
}
