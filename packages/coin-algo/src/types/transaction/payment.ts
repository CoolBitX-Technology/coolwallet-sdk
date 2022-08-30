import { TransactionParams, TransactionType } from './base';
import { BuildTransaction } from './builder';

type SpecificParameters = Pick<TransactionParams, 'to' | 'amount' | 'closeRemainderTo'>;

type PaymentTransaction = BuildTransaction<SpecificParameters, { type: TransactionType.pay }>;

export { PaymentTransaction };
