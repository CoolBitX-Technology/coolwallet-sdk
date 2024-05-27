import TonWeb from 'tonweb';
import type { WalletV4ContractR2 } from 'tonweb/dist/types/contract/wallet/v4/wallet-v4-contract-r2';
import type { Address } from 'tonweb/dist/types/utils/address';

function getWalletV4R2(publicKey: string): WalletV4ContractR2 {
  const tonweb = new TonWeb();

  const WalletClass = tonweb.wallet.all.v4R2;

  const wallet = new WalletClass(tonweb.provider, {
    wc: 0, // base chain
    publicKey: Buffer.from(publicKey, 'hex'),
  });

  return wallet;
}

export async function getAddressByPublicKey(publicKey: string): Promise<string> {
  const wallet: WalletV4ContractR2 = getWalletV4R2(publicKey);

  const address: Address = await wallet.getAddress();

  const isUserFriendly = true;
  const isUrlSafe = true;
  const isBounceable = true;
  const friendlyAddress = address.toString(isUserFriendly, isUrlSafe, isBounceable);

  return friendlyAddress;
}
