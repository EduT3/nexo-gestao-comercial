import type { AccountFilter } from './account-filter';
import { defaultAccountFilter } from './account-filter';
export function LocalAccountFilters({kind,value,onChange,disabled=false}:{kind:'pagar'|'receber';value:AccountFilter;onChange(value:AccountFilter):void;disabled?:boolean}) {
 return <fieldset className="form-grid account-filters" disabled={disabled}><legend>Filtrar contas a {kind}</legend>
  <label>Buscar conta<input aria-label={'Buscar conta a '+kind} value={value.search} placeholder={kind==='pagar'?'Fornecedor ou referência':'Descrição ou cliente'} onChange={event=>onChange({...value,search:event.target.value})}/></label>
  <label>Situação<select aria-label={'Situação das contas a '+kind} value={value.status} onChange={event=>onChange({...value,status:event.target.value as AccountFilter['status']})}><option value="OPEN">Em aberto</option><option value="SETTLED">{kind==='pagar'?'Pagas':'Recebidas'}</option><option value="ALL">Todas</option></select></label>
  <label>Vencimento de<input type="date" aria-label={'Vencimento inicial a '+kind} value={value.from} onChange={event=>onChange({...value,from:event.target.value})}/></label>
  <label>Vencimento até<input type="date" aria-label={'Vencimento final a '+kind} value={value.until} onChange={event=>onChange({...value,until:event.target.value})}/></label>
  <label className="account-checkbox"><input type="checkbox" aria-label={'Somente contas vencidas a '+kind} checked={value.overdue} onChange={event=>onChange({...value,overdue:event.target.checked})}/>Somente vencidas em aberto</label>
  <button type="button" className="button secondary" onClick={()=>onChange(defaultAccountFilter())}>Limpar filtros</button>
  {value.from&&value.until&&value.from>value.until&&<p role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
 </fieldset>;
}
