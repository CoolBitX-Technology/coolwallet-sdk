import bech32 from 'bech32';
import * as cryptoUtil from './cryptoUtil'
import * as types from '../config/types'


export function publicKeyToAddress(publicKey: string, prefix = "cosmos") {
  const publicKeyBuf = Buffer.from(publicKey, 'hex')
  const sha256Hash = cryptoUtil.sha256(publicKeyBuf);
  const ripemd160hash = cryptoUtil.ripemd160(sha256Hash)
  const words = bech32.toWords(ripemd160hash);
  return bech32.encode(prefix, words);
}

export const genAtomSigFromSESig = async (
  canonicalSignature: { r: string; s: string }
): Promise<string> => {
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return Buffer.from(r + s, 'hex').toString('base64');
};

export const genDelgtOrUnDelTx = async (
  signData: types.MsgDelegate | types.MsgUndelegate,
  signature: string,
  publicKeyBase46: string,
  delType: string
): Promise<object> => {

  const signedTx = {
    "tx": {
      "msg": [
        {
          "type": `cosmos-sdk/${delType}`,
          "value": {
            "amount":
            {
              "amount": signData.amount.toString(),
              "denom": "uatom"
            },
            "delegator_address": signData.delegatorAddress,
            "validator_address": signData.validatorAddress
          }
        }
      ],
      "fee": {
        "amount": [
          {
            "amount": signData.feeAmount.toString(),
            "denom": "uatom"
          }
        ],
        "gas": signData.gas.toString()
      },
      "signatures": [
        {
          "account_number": signData.accountNumber,
          "sequence": signData.sequence,
          "signature": signature,
          "pub_key": {
            "type": "tendermint/PubKeySecp256k1",
            "value": publicKeyBase46
          }
        }
      ],
      "memo": signData.memo
    },
    "mode": "sync"
  }

  return signedTx

};


export const genSendTx = async (
  signData: types.MsgSend,
  signature: string,
  publicKeyBase46: string
): Promise<object> => {

  const signedTx = {
    "tx": {
      "msg": [
        {
          "type": `cosmos-sdk/${types.TX_TYPE.SEND}`,
          "value": {
            "amount": [
              {
                "amount": signData.amount.toString(),
                "denom": "uatom"
              }
            ],
            "from_address": signData.fromAddress,
            "to_address": signData.toAddress
          }
        }
      ],
      "fee": {
        "amount": [
          {
            "amount": signData.feeAmount.toString(),
            "denom": "uatom"
          }
        ],
        "gas": signData.gas.toString()
      },
      "signatures": [
        {
          "account_number": signData.accountNumber,
          "sequence": signData.sequence,
          "signature": signature,
          "pub_key": {
            "type": "tendermint/PubKeySecp256k1",
            "value": publicKeyBase46
          }
        }
      ],
      "memo": signData.memo
    },
    "mode": "sync"
  }

  return signedTx

};



export const genWithdrawTx = async (
  signData: types.MsgWithdrawDelegationReward,
  signature: string,
  publicKeyBase46: string
): Promise<object> => {

  const signedTx = {
    "tx": {
      "msg": [
        {
          "type": `cosmos-sdk/${types.TX_TYPE.WITHDRAW}`,
          "value": {
            "delegator_address": signData.delegatorAddress,
            "validator_address": signData.validatorAddress
          }
        }
      ],
      "fee": {
        "amount": [
          {
            "amount": signData.feeAmount.toString(),
            "denom": "uatom"
          }
        ],
        "gas": signData.gas.toString()
      },
      "signatures": [
        {
          "account_number": signData.accountNumber,
          "sequence": signData.sequence,
          "signature": signature,
          "pub_key": {
            "type": "tendermint/PubKeySecp256k1",
            "value": publicKeyBase46
          }
        }
      ],
      "memo": signData.memo
    },
    "mode": "sync"
  }

  return signedTx

};
