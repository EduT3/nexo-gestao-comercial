import {useEffect,useState} from 'react';
import type {BuildInfo} from '../shared/build-info';
const unavailable:BuildInfo={available:false,version:null};
export function LocalBuildInfo(){
 const [info,setInfo]=useState<BuildInfo>();
 useEffect(()=>{
  let active=true;
  const request=window.nexoLocal?.buildInfo?.();
  if(!request){setInfo(unavailable);return;}
  void request.then(value=>{if(active)setInfo(value??unavailable);}).catch(()=>{if(active)setInfo(unavailable);});
  return()=>{active=false;};
 },[]);
 return <section aria-label="Sobre o NEXO"><details>
  <summary>Sobre o NEXO</summary>
  <p>Versão NEXO: <strong>{info?.version??'não identificada'}</strong></p>
  {!info?<p role="status">Consultando identificação…</p>:info.available?<>
   <p>Gerado em: <time dateTime={info.builtAt}>{new Date(info.builtAt).toLocaleString('pt-BR')}</time></p>
   <p>Identificador: <code style={{overflowWrap:'anywhere'}}>{info.id}</code></p>
   <p className="tutorial-note">Informe estes dados ao pedir suporte.</p>
  </>:<p role="status">Identificação desta compilação indisponível.</p>}
 </details></section>;
}
