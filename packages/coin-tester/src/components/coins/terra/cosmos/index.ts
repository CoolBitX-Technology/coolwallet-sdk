import type { GetAddress, AddressBalance, AddressDelegation } from './response';

class Cosmos {
  url: string;

  constructor(_url: string) {
    this.url = _url;
  }

  getSequence(address: string): Promise<GetAddress> {
    return fetch(this.url + `cosmos/auth/v1beta1/accounts/${address}`).then((res) =>
      res.json().then(({ account }) => ({ sequence: account.sequence, account_number: account.account_number }))
    );
  }

  getBalance(address: string): Promise<AddressBalance[]> {
    return fetch(this.url + `cosmos/bank/v1beta1/balances/${address}`).then((res) =>
      res.json().then(({ balances }) => ( balances ))
    );
  }

  getValidators(address: string): Promise<AddressDelegation[]> {
    return fetch(this.url + `cosmos/staking/v1beta1/delegations/${address}`).then((res) =>
      res.json().then(({ delegation_responses }) => {
        const delegationInfo:AddressDelegation[] = [];
        delegation_responses.map(function(response){
          delegationInfo.push({ 
            validator_address: response.delegation.validator_address, 
            denom: response.balance.denom, 
            amount: response.balance.amount
          });
        });
        return delegationInfo;
      })
    );
  }

  getGas(signedTxBytes: string): Promise<string> {
    const body = {
      tx_bytes: signedTxBytes,
    };
    return fetch(this.url + `cosmos/tx/v1beta1/simulate`, {
      body: JSON.stringify(body),
      method: "POST",
      headers: new Headers({ 'Content-type': 'application/json' }),
    }).then(async (res) => {
      const result = await res.json();
      return JSON.stringify(result.gas_info.gas_used);
    });
  }

  broadcastGRPC(signedTxBytes: string): Promise<string> {
    const body = {
      tx_bytes: signedTxBytes,
      mode: 'BROADCAST_MODE_BLOCK',
    };
    return fetch(this.url + `cosmos/tx/v1beta1/txs`, {
      body: JSON.stringify(body),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    }).then(async (res) => {
      const result = await res.json();
      console.log(result);
      return JSON.stringify(result.tx_response.txhash);
    });
  }
}

export default new Cosmos('https://phoenix-lcd.terra.dev/');
export const Mainnet = new Cosmos('https://phoenix-lcd.terra.dev/');
export const Testnet = new Cosmos('https://pisco-lcd.terra.dev/');
export const Classic = new Cosmos('https://columbus-lcd.terra.dev/');
export const Classic_Testnet = new Cosmos('https://bombay-lcd.terra.dev/');
