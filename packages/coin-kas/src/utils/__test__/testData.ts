import { TxData } from '../../config/type';
import { Transaction } from '../../transaction';

export const testAddressIndex = 0;
export const testTxData: TxData = {
  inputs: [
    {
      txId: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
      vout: 1,
      address: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzh6mpgwtm54',
      value: 2355557326,
    },
  ],
  outputs: [
    {
      address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
      value: 1000,
    },
  ],
  fee: '10180',
  changeAddress: 'kaspa:qzcm3y2xe65ne797cmar6ntecfjcdtqf585whum65kgyv20k8jzh6mpgwtm54',
  dustSize: '600',
};
export const testTransaction: Transaction = Transaction.fromTxData(testTxData);
