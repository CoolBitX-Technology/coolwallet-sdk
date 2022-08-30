import { TransactionParams } from './base';
import { Overwrite } from '../utils';

/**
 * Transaction base with suggested params as object
 */
type TransactionBaseWithSuggestedParams = Pick<
  TransactionParams,
  'suggestedParams' | 'from' | 'type' | 'lease' | 'note' | 'reKeyTo'
>;

/**
 * Transaction base with suggested params included as parameters
 */
type TransactionBaseWithoutSuggestedParams = Pick<
  TransactionParams,
  | 'flatFee'
  | 'fee'
  | 'firstRound'
  | 'lastRound'
  | 'genesisHash'
  | 'from'
  | 'type'
  | 'genesisID'
  | 'lease'
  | 'note'
  | 'reKeyTo'
>;

/**
 * Transaction common fields.
 *
 * Base transaction type that is extended for all other transaction types.
 * Suggested params must be included, either as named object or included in the rest
 * of the parameters.
 */
type TransactionBase =
  | TransactionBaseWithoutSuggestedParams
  | TransactionBaseWithSuggestedParams
  | (TransactionBaseWithSuggestedParams & TransactionBaseWithoutSuggestedParams);

type BuildTransaction<S, O> = Overwrite<TransactionBase & S, O>;

export { BuildTransaction };
