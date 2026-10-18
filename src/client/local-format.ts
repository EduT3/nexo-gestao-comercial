export function money(value: bigint) { const absolute=value<0n?-value:value; return (value<0n?'-':'')+'R$ '+absolute/100n+','+(absolute%100n).toString().padStart(2,'0'); }
export function cents(value: string) {
  if(!/^\d{1,8}(?:[,.]\d{1,2})?$/.test(value))throw new Error('Informe um valor com até duas casas decimais.');
  const [whole='0',fraction='']=value.replace(',','.').split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
}
export function localToday() { const day=new Date();return [day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-'); }
/** Date-only fields must not shift day when rendered in a Windows timezone. */
export function shortDate(value: string) { const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);return match?match[3]+'/'+match[2]+'/'+match[1]:value; }
export function errorMessage(error: unknown) {
  let message=error instanceof Error?error.message:String(error);
  for(let i=0;i<3;i++)message=message.replace(/^Error: /,'').replace(/^Error invoking remote method '[^']+': /,'');
  try { const issues=JSON.parse(message);if(Array.isArray(issues))return issues.map(issue=>String(issue.message||'')).filter(value=>value&&!/^(Invalid|Too |Unrecognized)/.test(value)).join(' ')||'Confira os campos informados e tente novamente.'; } catch { /* A business message is plain text. */ }
  if(/SQLITE_|no such table|constraint failed|syntax error|file is not a database/i.test(message))return 'Não foi possível concluir a operação. Peça ao responsável para verificar os dados em Mais opções > Backup e dados.';
  return message||'Não foi possível concluir. Tente novamente.';
}
