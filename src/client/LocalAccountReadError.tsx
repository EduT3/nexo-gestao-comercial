export function LocalAccountReadError({message,disabled,onRetry}:{message:string;disabled:boolean;onRetry():void}) {
 return <div role="alert"><p>{message}</p><button type="button" className="button secondary" disabled={disabled} onClick={onRetry}>Tentar novamente</button></div>;
}
