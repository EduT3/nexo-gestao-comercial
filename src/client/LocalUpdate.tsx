import {useEffect,useState} from 'react';
export function LocalUpdate() {
 const bridge=window.nexoLocal;
 const [state,setState]=useState<{phase:string;percent?:number;version?:string}>({phase:'idle'});
 useEffect(()=>{
  let active=true;
  async function refresh(){try{const value=await bridge?.updateStatus?.();if(active&&value)setState(value);}catch{if(active)setState({phase:'error'});}}
  void refresh();const timer=setInterval(()=>void refresh(),1500);
  return()=>{active=false;clearInterval(timer);};
 },[bridge]);
 async function action(kind:'check'|'download'|'install'){
  try{
   if(kind==='install'){await bridge?.installUpdate?.();return;}
   const value=await (kind==='check'?bridge?.checkUpdate?.():bridge?.downloadUpdate?.());
   if(value)setState(value);
  }catch{setState({phase:'error'});}
 }
 if(!bridge?.openReleases)return null;
 const messages:Record<string,string>={idle:'Consulte as atualizações do NEXO.',checking:'Consultando atualizações…',current:'Seu NEXO está atualizado.',available:'Nova versão disponível.',downloading:'Baixando atualização…',ready:'Atualização pronta para instalar.',error:'Não foi possível atualizar. Confira a conexão e tente novamente.',portable:'Use o instalador Windows para receber atualizações pelo aplicativo.'};
 return <section className="panel" aria-label="Atualização do NEXO"><h2>Atualizações</h2><p role="status">{messages[state.phase]} {state.phase==='downloading'?String(state.percent??0)+'%':''}</p>
 <div className="nexo-row-actions"><button className="button secondary" disabled={['checking','downloading'].includes(state.phase)} onClick={()=>void action('check')}>Verificar atualização</button>
 {state.phase==='available'&&<button className="button primary" onClick={()=>void action('download')}>Baixar versão {state.version}</button>}
 {state.phase==='ready'&&<button className="button primary" onClick={()=>void action('install')}>Reiniciar e atualizar</button>}
 <button className="button secondary" onClick={()=>void bridge.openReleases?.().catch(()=>setState({phase:'error'}))}>Ver versões no GitHub</button></div></section>;
}
