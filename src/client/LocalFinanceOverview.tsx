import {useState} from 'react';
import type {FinanceSummary} from './LocalFinance';
import {useLocalQuery} from './useLocalQuery';
import {errorMessage,money} from './local-format';
export function LocalFinanceOverview({company,active,refreshToken}:{company:string;active:boolean;refreshToken:number}) {
 const [summary,setSummary]=useState<FinanceSummary>(),[message,setMessage]=useState('');
 useLocalQuery(company,active,refreshToken,()=>window.nexoLocal!.finance(company),value=>{setSummary(value);setMessage('');},error=>setMessage(errorMessage(error)));
 return <details className="panel" open><summary>Resumo financeiro acumulado</summary>{summary&&<>
  <p aria-label="Receita líquida">Vendas após cancelamentos: <strong>{money(summary.netRevenueCents)}</strong></p><p>Receitas de vendas: {money(summary.revenueCents)} · Estornos: {money(summary.reversedCents)}</p><p aria-label="Despesas pagas">Despesas pagas: {money(summary.paidExpenseCents)}</p>
  <p aria-label="Recebimentos líquidos">Contas recebidas após estornos: <strong>{money(summary.netReceivedCents)}</strong></p><p>Recebimentos: {money(summary.receivedCents)} · Estornos de recebimentos: {money(summary.reversedReceiptCents)}</p><p aria-label="Entradas financeiras">Entradas de vendas e contas recebidas: {money(summary.totalIncomeCents)}</p><p aria-label="Saldo financeiro">Entradas menos contas pagas: <strong>{money(summary.financialBalanceCents)}</strong></p><p className="muted">Totais de todo o histórico desta empresa. Incluem dinheiro, PIX e cartões; o saldo do caixa mostra apenas dinheiro. Este resumo não calcula lucro.</p>
 </>}<p role="status">{message}</p></details>;
}
