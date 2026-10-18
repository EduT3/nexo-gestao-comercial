export type CashAvailability = { open:false } | { open:true; canSell:boolean; operatorName:string; openedAt:string; balanceCents:bigint };
