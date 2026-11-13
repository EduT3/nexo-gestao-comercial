const bridge = window.nexoRecovery;
const byId = id => document.getElementById(id);
let candidate, busy = false;
async function run(action) {
  if (busy) return;
  busy = true; document.body.setAttribute('aria-busy', 'true');
  const controls = [...document.querySelectorAll('button,input,select')]; controls.forEach(element => element.disabled = true);
  byId('message').textContent = 'Aguarde…';
  try { const result = await action(); byId('message').textContent = result?.error || (result?.saved ? 'Diagnóstico guardado.' : result?.canceled ? 'Operação cancelada. Seus dados foram mantidos.' : ''); return result; }
  catch { byId('message').textContent = 'Não foi possível concluir. Tente novamente.'; }
  finally { busy = false; document.body.setAttribute('aria-busy', 'false'); controls.forEach(element => element.disabled = false); }
}
byId('retry').onclick = () => run(() => bridge.retry());
byId('open').onclick = () => run(() => bridge.folder());
byId('diagnostic').onclick = () => run(() => bridge.diagnostic());
byId('exit').onclick = () => run(() => bridge.exit());
byId('select').onclick = async () => {
  candidate = undefined; byId('restore').hidden = true;
  const result = await run(() => bridge.select());
  if (!result?.token) return;
  candidate = result; byId('selected').textContent = 'Cópia selecionada: ' + result.name;
  byId('user').replaceChildren(...result.users.map(user => { const option = document.createElement('option'); option.value = user.id; option.textContent = user.name; return option; }));
  byId('guard-pin-label').hidden = !result.pinRequired;
  byId('guard-pin').required = result.pinRequired;
  byId('restore').hidden = false; byId('user').focus();
};
byId('restore').onsubmit = async event => {
  event.preventDefault(); if (!candidate) return;
  const input = byId('guard-pin');
  const pin = input.value;
  input.value = '';
  await run(() => bridge.restore(candidate.token, byId('user').value, pin));
};
void bridge.status().then(status => { byId('error').textContent = status.message; byId('folder').textContent = status.folder; }).catch(() => { byId('message').textContent = 'Não foi possível carregar o diagnóstico.'; });
