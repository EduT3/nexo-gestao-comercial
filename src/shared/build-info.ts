/** Build identity reports generated metadata; it is not an authenticity or acceptance claim. */
export type BuildInfo = {available:true;version:string;builtAt:string;id:string;payloadSha256:string}
 | {available:false;version:string|null};
