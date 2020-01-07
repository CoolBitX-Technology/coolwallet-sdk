export type Payment = {
  TransactionType: 'Payment';
  Flags: 2147483648;
  Sequence: number;
  DestinationTag: number;
  LastLedgerSequence: number;

  Amount: string;
  Fee: string;
  SigningPubKey: string;
  Account: string;
  Destination: string;
  TxnSignature?: string
};
