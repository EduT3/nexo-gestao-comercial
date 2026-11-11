import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createQueryLifecycle} from './query-lifecycle';
import {useLocalQuery} from './useLocalQuery';
import {defaultAccountFilter} from './account-filter';
import {localToday,errorMessage} from './local-format';
import type {AccountPage,AccountPageFilter} from '../shared/financial-accounts';
/** Filter/page scopes discard late reads; forms stay mounted in their company workspace. */
export function useLocalAccountPage<T>(company:string,active:boolean,revision:number,load:(input:AccountPageFilter)=>Promise<AccountPage<T>>){
 const [filter,setFilter]=useState(defaultAccountFilter),[page,setPage]=useState(0);
 const [result,setResult]=useState<{scope:string;value:AccountPage<T>}>(),[failure,setFailure]=useState<{scope:string;message:string}>();
 const [reading,setReading]=useState(true);
 const today=localToday(),input={...filter,page,today},scope=company+':'+JSON.stringify(input);
 // Keep the requested page aligned with the service clamp when the result shrinks.
 const requests=useLocalQuery(scope,active,revision,()=>{setReading(true);setFailure(undefined);return load(input);},value=>{setResult({scope,value});setPage(value.page);setReading(false);},error=>{setResult(undefined);setFailure({scope,message:errorMessage(error)});setReading(false);});
 // A write belongs to the company, not to a page/date snapshot (including a midnight change).
 const writes=useMemo(createQueryLifecycle,[company]);
 useLayoutEffect(()=>{writes.mount();return()=>writes.dispose();},[writes]);
 const currentRead=useRef(requests);useLayoutEffect(()=>{currentRead.current=requests;});
 const operations={refresh:()=>currentRead.current.refresh(),beginMutation:()=>{
  const write=writes.beginMutation();if(!write)return undefined;
  const source=currentRead.current,read=source.beginMutation();if(!read){write.finish();return undefined;}
  let finished=false;
  return {isCurrent:write.isCurrent,finish:()=>{
   if(!finished){finished=true;read.finish();if(source!==currentRead.current){const pending=currentRead.current.beginMutation();pending?.finish();}}
   return write.finish();
  }};
 }};
 const data=result?.scope===scope?result.value:undefined;
 const loading=reading||(!data&&failure?.scope!==scope);
 const list={rows:data?.rows??[],total:data?.total??0,totalCents:data?.totalCents??0n,page:data?.page??0,pages:Math.max(1,Math.ceil((data?.total??0)/(data?.pageSize??50))),setPage};
 return {filter,changeFilter:(value:typeof filter)=>{setFilter(value);setPage(0);},list,today,loading,queryError:failure?.scope===scope?failure.message:'',requests:operations};
}
