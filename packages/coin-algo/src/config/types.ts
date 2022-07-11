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
  pay = "pay",
  keyreg = "keyreg",
  acfg = "acfg",
  axfer = "axfer",
  afrz = "afrz",
  appl = "appl"
}

export enum OnApplicationComplete {
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
  aamt: { type: String },
  aclose: { type: String },
  afrz: { type: String },
  amt: { type: String },
  apaa: { type: String, length: number, subType: String },
  apan: { type: String },
  apap: { type: String },
  apar: {
    type: String, length: number,
    subFields: {
      am: { type: String },
      an: { type: String },
      au: { type: String },
      c: { type: String },
      dc: { type: String },
      df: { type: String },
      f: { type: String },
      m: { type: String },
      r: { type: String },
      t: { type: String },
      un: { type: String }
    }
  },
  apas: { type: String, length: number, subType: String },
  apat: { type: String, length: number, subType: String },
  apep: { type: String },
  apfa: { type: String, length: number, subType: String },
  apid: { type: String },
  apls: {
    type: String, length: number,
    subFields: {
      nbs: { type: String },
      nui: { type: String }
    }
  },
  apgs: {
    type: String, length: number,
    subFields: {
      nbs: { type: String },
      nui: { type: String }
    }
  },
  apsu: { type: String },
  arcv: { type: String },
  asnd: { type: String },
  caid: { type: String },
  close: { type: String },
  fadd: { type: String },
  fee: { type: String },
  faid: { type: String },
  fv: { type: String },
  gen: { type: String },
  grp: { type: String },
  gh: { type: String },
  lv: { type: String },
  lx: { type: String },
  nonpart: { type: String },
  note: { type: String },
  rcv: { type: String },
  rekey: { type: String },
  selkey: { type: String },
  sprfkey: { type: String },
  snd: { type: String },
  type: { type: String },
  votefst: { type: String },
  votekd: { type: String },
  votekey: { type: String },
  votelst: { type: String },
  xaid: { type: String }
}
