import TonWeb from 'tonweb';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { WalletV4ContractR2 } from 'tonweb/dist/types/contract/wallet/v4/wallet-v4-contract-r2';

export const tonweb = new TonWeb();

export function getWalletV4R2(publicKey: string): WalletV4ContractR2 {
  const WalletClass = tonweb.wallet.all.v4R2;

  const wallet = new WalletClass(tonweb.provider, {
    wc: 0, // base chain
    publicKey: Buffer.from(publicKey, 'hex'),
  });

  return wallet;
}

export async function getJettonWallet(fromTokenAccount: string) {
  return new TonWeb.token.jetton.JettonWallet(tonweb.provider, { address: fromTokenAccount });
}

export async function getKeyPair(mnemonic: string, index: number) {
  const seed = await mnemonicToSeed(mnemonic);
  const seedContainer = derivePath(`m/44'/607'/${index}'`, seed.toString('hex'));
  const { publicKey, secretKey } = TonWeb.utils.nacl.sign.keyPair.fromSeed(seedContainer.key);
  return { publicKey, secretKey };
}
