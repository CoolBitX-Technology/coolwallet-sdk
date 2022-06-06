import { Transport } from '@coolwallet/core';

export interface SignTxType extends CoolWalletTxn {
  transaction: Transaction;
}

interface CoolWalletTxn {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
}

export enum TransactionType {
  PAYMENT = "pay",
  KEY_REGISTRATION = "keyreg",
  ASSET_CONFIG = "acfg",
  ASSET_TRANSFER = "axfer",
  ASSET_FREEZE = "afrz",
  APPLICATION_CALL = "appl"
}

export declare enum OnApplicationComplete {
  NoOpOC = 0,
  OptInOC = 1,
  CloseOutOC = 2,
  ClearStateOC = 3,
  UpdateApplicationOC = 4,
  DeleteApplicationOC = 5
}

export type AlgorandRawTransactionStruct = {
  txn: Transaction;
  sig: Buffer;
  sgnr?: Buffer;
};

export interface EncodedAssetParams {
  /**
   * assetTotal
   */
  t: number | bigint;
  /**
   * assetDefaultFrozen
   */
  df: boolean;
  /**
   * assetDecimals
   */
  dc: number;
  /**
   * assetManager
   */
  m?: Buffer;
  /**
   * assetReserve
   */
  r?: Buffer;
  /**
   * assetFreeze
   */
  f?: Buffer;
  /**
   * assetClawback
   */
  c?: Buffer;
  /**
   * assetName
   */
  an?: string;
  /**
   * assetUnitName
   */
  un?: string;
  /**
   * assetURL
   */
  au?: string;
  /**
   * assetMetadataHash
   */
  am?: Buffer;
}

export interface EncodedLocalStateSchema {
  /**
   * appLocalInts
   */
  nui: number;
  /**
   * appLocalByteSlices
   */
  nbs: number;
}

export interface EncodedGlobalStateSchema {
  /**
   * appGlobalInts
   */
  nui: number;
  /**
   * appGlobalByteSlices
   */
  nbs: number;
}

export interface Transaction {
  /**
   * fee
   */
  fee?: number;
  /**
   * firstRound
   */
  fv?: number;
  /**
   * lastRound
   */
  lv: number;
  /**
   * note
   */
  note?: Buffer;
  /**
   * from
   */
  snd: Buffer;
  /**
   * type
   */
  type: TransactionType;
  /**
   * genesisID
   */
  gen: string;
  /**
   * genesisHash
   */
  gh: Buffer;
  /**
   * lease
   */
  lx?: Buffer;
  /**
   * group
   */
  grp?: Buffer;
  /**
   * amount
   */
  amt?: number | bigint;
  /**
   * amount (but for asset transfers)
   */
  aamt?: number | bigint;
  /**
   * closeRemainderTo
   */
  close?: Buffer;
  /**
   * closeRemainderTo (but for asset transfers)
   */
  aclose?: Buffer;
  /**
   * reKeyTo
   */
  rekey?: Buffer;
  /**
   * to
   */
  rcv?: Buffer;
  /**
   * to (but for asset transfers)
   */
  arcv?: Buffer;
  /**
   * voteKey
   */
  votekey?: Buffer;
  /**
   * selectionKey
   */
  selkey?: Buffer;
  /**
   * stateProofKey
   */
  sprfkey?: Buffer;
  /**
   * voteFirst
   */
  votefst?: number;
  /**
   * voteLast
   */
  votelst?: number;
  /**
   * voteKeyDilution
   */
  votekd?: number;
  /**
   * nonParticipation
   */
  nonpart?: boolean;
  /**
   * assetIndex
   */
  caid?: number;
  /**
   * assetIndex (but for asset transfers)
   */
  xaid?: number;
  /**
   * assetIndex (but for asset freezing/unfreezing)
   */
  faid?: number;
  /**
   * freezeState
   */
  afrz?: boolean;
  /**
   * freezeAccount
   */
  fadd?: Buffer;
  /**
   * assetRevocationTarget
   */
  asnd?: Buffer;
  /**
   * See EncodedAssetParams type
   */
  apar?: EncodedAssetParams;
  /**
   * appIndex
   */
  apid?: number;
  /**
   * appOnComplete
   */
  apan?: OnApplicationComplete;
  /**
   * See EncodedLocalStateSchema type
   */
  apls?: EncodedLocalStateSchema;
  /**
   * See EncodedGlobalStateSchema type
   */
  apgs?: EncodedGlobalStateSchema;
  /**
   * appForeignApps
   */
  apfa?: number[];
  /**
   * appForeignAssets
   */
  apas?: number[];
  /**
   * appApprovalProgram
   */
  apap?: Buffer;
  /**
   * appClearProgram
   */
  apsu?: Buffer;
  /**
   * appArgs
   */
  apaa?: Buffer[];
  /**
   * appAccounts
   */
  apat?: Buffer[];
  /**
   * extraPages
   */
  apep?: number;
}

export interface FieldType {
  aamt: { type: String, padding: number },
  aclose: { type: String, padding: number },
  afrz: { type: String, padding: number },
  amt: { type: String, padding: number },
  apaa: { type: String, padding: number, length: number, subType: String },
  apan: { type: String, padding: number },
  apap: { type: String, padding: number },
  apar: {
    type: String, padding: number, length: number,
    subFields: {
      am: { type: String, padding: number },
      an: { type: String, padding: number },
      au: { type: String, padding: number },
      c: { type: String, padding: number },
      dc: { type: String, padding: number },
      df: { type: String, padding: number },
      f: { type: String, padding: number },
      m: { type: String, padding: number },
      r: { type: String, padding: number },
      t: { type: String, padding: number },
      un: { type: String, padding: number }
    }
  },
  apas: { type: String, padding: number, length: number, subType: String },
  apat: { type: String, padding: number, length: number, subType: String },
  apep: { type: String, padding: number },
  apfa: { type: String, padding: number, length: number, subType: String },
  apid: { type: String, padding: number },
  apls: {
    type: String, padding: number, length: number,
    subFields: {
      nbs: { type: String, padding: number },
      nui: { type: String, padding: number }
    }
  },
  apgs: {
    type: String, padding: number, length: number,
    subFields: {
      nbs: { type: String, padding: number },
      nui: { type: String, padding: number }
    }
  },
  apsu: { type: String, padding: number },
  arcv: { type: String, padding: number },
  asnd: { type: String, padding: number },
  caid: { type: String, padding: number },
  close: { type: String, padding: number },
  fadd: { type: String, padding: number },
  fee: { type: String, padding: number },
  faid: { type: String, padding: number },
  fv: { type: String, padding: number },
  gen: { type: String, padding: number },
  grp: { type: String, padding: number },
  gh: { type: String, padding: number },
  lv: { type: String, padding: number },
  lx: { type: String, padding: number },
  nonpart: { type: String, padding: number },
  note: { type: String, padding: number },
  rcv: { type: String, padding: number },
  rekey: { type: String, padding: number },
  selkey: { type: String, padding: number },
  sprfkey: { type: String, padding: number },
  snd: { type: String, padding: number },
  type: { type: String, padding: number },
  votefst: { type: String, padding: number },
  votekd: { type: String, padding: number },
  votekey: { type: String, padding: number },
  votelst: { type: String, padding: number },
  xaid: { type: String, padding: number }
}
