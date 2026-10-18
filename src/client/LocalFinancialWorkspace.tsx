import {LocalWorkspace} from './LocalWorkspace';
import {LocalFinance} from './LocalFinance';
import {LocalReceivables} from './LocalReceivables';
import {LocalDailyReport} from './LocalDailyReport';
import {LocalFinanceOverview} from './LocalFinanceOverview';
export type FinancialView='pagar'|'receber'|'resumo';
export function LocalFinancialWorkspace({company,active,view,onViewChange,refreshToken,onSaved}:{company:string;active:boolean;view:FinancialView;onViewChange(view:FinancialView):void;refreshToken:number;onSaved():void}) {
 return <><div className="local-tabs" role="group" aria-label="Tarefas do financeiro">{(['pagar','receber','resumo'] as const).map(id=><button type="button" className={'button '+(view===id?'primary':'secondary')} key={id} aria-pressed={view===id} onClick={()=>onViewChange(id)}>{{pagar:'Pagar',receber:'Receber',resumo:'Resumo'}[id]}</button>)}</div>
  <LocalWorkspace id="contas-pagar" active={active&&view==='pagar'}><LocalFinance company={company} active={active&&view==='pagar'} refreshToken={refreshToken} onSaved={onSaved}/></LocalWorkspace>
  <LocalWorkspace id="contas-receber" active={active&&view==='receber'}><LocalReceivables company={company} active={active&&view==='receber'} refreshToken={refreshToken} onSaved={onSaved}/></LocalWorkspace>
  <LocalWorkspace id="resumo" active={active&&view==='resumo'}><LocalDailyReport company={company} active={active&&view==='resumo'} refreshToken={refreshToken}/><LocalFinanceOverview company={company} active={active&&view==='resumo'} refreshToken={refreshToken}/></LocalWorkspace>
 </>;
}
