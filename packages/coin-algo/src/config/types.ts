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
  type: string;
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
  aamt: { type: string },
  aclose: { type: string },
  afrz: { type: string },
  amt: { type: string },
  apaa: { type: string, length: number, subType: string },
  apan: { type: string },
  apap: { type: string },
  apar: {
    type: string, length: number,
    subFields: {
      am: { type: string },
      an: { type: string },
      au: { type: string },
      c: { type: string },
      dc: { type: string },
      df: { type: string },
      f: { type: string },
      m: { type: string },
      r: { type: string },
      t: { type: string },
      un: { type: string }
    }
  },
  apas: { type: string, length: number, subType: string },
  apat: { type: string, length: number, subType: string },
  apep: { type: string },
  apfa: { type: string, length: number, subType: string },
  apid: { type: string },
  apls: {
    type: string, length: number,
    subFields: {
      nbs: { type: string },
      nui: { type: string }
    }
  },
  apgs: {
    type: string, length: number,
    subFields: {
      nbs: { type: string },
      nui: { type: string }
    }
  },
  apsu: { type: string },
  arcv: { type: string },
  asnd: { type: string },
  caid: { type: string },
  close: { type: string },
  fadd: { type: string },
  fee: { type: string },
  faid: { type: string },
  fv: { type: string },
  gen: { type: string },
  grp: { type: string },
  gh: { type: string },
  lv: { type: string },
  lx: { type: string },
  nonpart: { type: string },
  note: { type: string },
  rcv: { type: string },
  rekey: { type: string },
  selkey: { type: string },
  sprfkey: { type: string },
  snd: { type: string },
  type: { type: string },
  votefst: { type: string },
  votekd: { type: string },
  votekey: { type: string },
  votelst: { type: string },
  xaid: { type: string }
}
