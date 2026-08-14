import * as bitcoin from 'bitcoinjs-lib';
import * as tinysecp from '@bitcoin-js/tiny-secp256k1-asmjs';
import { ECPairFactory } from 'ecpair';

const ECPair = ECPairFactory(tinysecp);

/**
 * 驗證一筆已簽好的 segwit v0（P2WPKH / P2SH-P2WPKH）交易，其 witness 裡的簽章
 * 是否真的對得上「這筆交易序列化出來的內容」。
 *
 * 這個檢查存在的理由：卡片是拿 script argument 裡的欄位自行組 BIP143 preimage 的，
 * 若 SDK 送過去的 nVersion / nSequence 與 JS 端序列化進最終交易的值不一致，
 * 卡片會對另一筆交易簽名 —— 交易長得完全正常、snapshot 也照樣過，只有節點會拒收。
 * hashForWitnessV0 是直接讀這筆交易自己的 version 與各 input 的 sequence，
 * 所以只有兩邊一致時才驗得過。
 *
 * @param rawTxHex signTransaction 回傳的完整交易 hex
 * @param inputValues 每筆 input 被花掉的 UTXO 金額（satoshi），順序與 inputs 相同
 */
function verifySegwitV0Signatures(rawTxHex: string, inputValues: number[]): boolean {
  const tx = bitcoin.Transaction.fromHex(rawTxHex);

  return tx.ins.every((input, index) => {
    const [signatureWithHashType, publicKey] = input.witness;
    const { signature, hashType } = bitcoin.script.signature.decode(signatureWithHashType);
    // BIP143 規定 P2WPKH / P2SH-P2WPKH 的 scriptCode 是 P2PKH 腳本（0x1976a914{pubKeyHash}88ac），
    // 不是該 input 的 scriptPubKey（0014{pubKeyHash}）。bitcoinjs 的 Psbt 內部也是先轉成 p2pkh 再算 sighash。
    const { output: scriptCode } = bitcoin.payments.p2pkh({ pubkey: publicKey });
    const sigHash = tx.hashForWitnessV0(index, scriptCode!, inputValues[index], hashType);

    return ECPair.fromPublicKey(publicKey).verify(sigHash, signature);
  });
}

/**
 * 讀出每一筆 input 實際序列化進交易的 nSequence，用來確認業務層要求的
 * 「不 signal RBF」真的落到鏈上（BIP-125 opt-in 的條件是 sequence < 0xfffffffe）。
 */
function getSequences(rawTxHex: string): number[] {
  return bitcoin.Transaction.fromHex(rawTxHex).ins.map((input) => input.sequence);
}

function getVersion(rawTxHex: string): number {
  return bitcoin.Transaction.fromHex(rawTxHex).version;
}

export { verifySegwitV0Signatures, getSequences, getVersion };
