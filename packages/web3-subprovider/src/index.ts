import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';

const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');

const BRIDGE_URL = 'https://coolbitx-technology.github.io/coolwallet-connect/#/iframe';
const MAX_INDEX = 1000;

type Options = {
  accountsLength: number
  accountsOffset: number
  networkId: number
}

type PostMessage = {
  action: string
  params: any
  target?: string
}

export default class CoolWalletSubprovider extends HookedWalletSubprovider {
  public accounts: string[]

  public options: Options

  public hdk: typeof HDKey

  public paths: any

  private iframe: HTMLIFrameElement

  constructor(options: Options) {
    super({
      getAccounts: (callback) => {
        this.getAccounts()
          .then((accounts) => callback(null, accounts))
          .catch((error) => callback(error));
      },
      signMessage: async (msgParams, callback) => {
        this.signPersonalMessage(msgParams.from, msgParams.data)
          .then((signature) => callback(null, signature))
          .catch((error) => callback(error));
      },
      signPersonalMessage: async (msgParams, callback) => {
        this.signPersonalMessage(msgParams.from, msgParams.data)
          .then((signature) => callback(null, signature))
          .catch((error) => callback(error));
      },
      signTransaction: async (txParams, callback) => {
        this.signTransaction(txParams.from, txParams)
          .then((tx) => callback(null, tx))
          .catch((error) => callback(error));
      },
      signTypedMessage: async (msgParams, callback) => {
        this.signTypedData(msgParams.from, msgParams.data)
          .then((data) => callback(null, data))
          .catch((error) => callback(error));
      },
    });
    this.options = options;
    this.hdk = new HDKey();
    this.paths = {};
    this.iframe = null;
    this.setupIframe();
  } // end of constructor

  hasAccountKey():boolean {
    return !!(this.hdk && this.hdk.publicKey);
  }

  unlock(addrIndex?: number) : Promise<string> {
    if (this.hasAccountKey() && typeof addrIndex === 'undefined') return Promise.resolve('already unlocked');
    if (this.hasAccountKey() && typeof addrIndex === 'number') {
      return Promise.resolve(this.addressFromIndex(addrIndex));
    }
    // unlock: get publickey and chainCodes
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line
      addrIndex |= 0;
      this.postMsgToBridge(
        {
          action: 'coolwallet-unlock',
          params: {
            addrIndex,
          },
        },
        ({ success, payload }) => {
          if (success) {
            this.hdk.publicKey = Buffer.from(payload.parentPublicKey, 'hex');
            this.hdk.chainCode = Buffer.from(payload.parentChainCode, 'hex');
            const address = addressFromPublicKey(Buffer.from(payload.publicKey, 'hex'));
            resolve(address);
          } else {
            reject(payload.error || 'Unknown error');
          }
        }
      );
    });
  }

  async getAccounts(): Promise<Array<string>> {
    return new Promise((resolve) => {
      this.unlock()
        .then(() => {
          resolve(this.deriveAddresses(
            this.options.accountsOffset,
            this.options.accountsOffset + this.options.accountsLength
          ));
        });
    });
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction(address:string, tx): Promise<string> {
    return new Promise((resolve, reject) => {
      this.unlock().then(() => {
        const addrIndex = this.indexFromAddress(address);
        const publicKey = this.publicKeyFromIndex(addrIndex).toString('hex');
        const transaction = {
          to: normalize(tx.to),
          value: normalize(tx.value),
          data: normalize(tx.data),
          chainId: this.options.networkId,
          nonce: normalize(tx.nonce),
          gasLimit: normalize(tx.gasLimit),
          gasPrice: normalize(tx.gasPrice),
        };

        this.postMsgToBridge(
          {
            action: 'coolwallet-sign-transaction',
            params: {
              tx: transaction,
              addrIndex,
              publicKey,
            },
          },
          ({ success, payload }) => {
            if (success) resolve(payload);
            else reject(new Error(payload.error || 'CoolWalletS: Unknown error while signing transaction'));
          }
        );
      });
    });
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage(withAccount:string, message:string) : Promise<string> {
    return new Promise((resolve, reject) => {
      this.unlock().then(() => {
        const addrIndex = this.indexFromAddress(withAccount);
        const publicKey = this.publicKeyFromIndex(addrIndex).toString('hex');
        this.postMsgToBridge(
          {
            action: 'coolwallet-sign-personal-message',
            params: {
              addrIndex,
              message,
              publicKey,
            },
          },
          ({ success, payload }) => {
            if (success) {
              resolve(payload);
            } else {
              reject(new Error(payload.error || 'CoolWalletS: Uknown error while signing message'));
            }
          }
        );
      });
    });
  }

  signTypedData(withAccount:string, typedData:any) {
    return new Promise((resolve, reject) => {
      this.unlock().then(() => {
        const addrIndex = this.indexFromAddress(withAccount);
        const publicKey = this.publicKeyFromIndex(addrIndex).toString('hex');
        this.postMsgToBridge(
          {
            action: 'coolwallet-sign-typed-data',
            params: {
              addrIndex,
              typedData,
              publicKey,
            },
          },
          ({ success, payload }) => {
            if (success) {
              resolve(payload);
            } else {
              reject(new Error(payload.error || 'CoolWalletS: Uknown error while signing typed data'));
            }
          }
        );
      });
    });
  }

  /* PRIVATE METHODS */

  setupIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.src = BRIDGE_URL;
    document.head.appendChild(this.iframe);
  }

  postMsgToBridge(msg: PostMessage, cb:Function) {
    // eslint-disable-next-line no-param-reassign
    msg.target = 'CWS-IFRAME';
    this.iframe.contentWindow.postMessage(msg, '*');
    window.addEventListener('message', ({ data }) => {
      if (data && data.action && data.action === `${msg.action}-reply`) {
        cb(data);
      }
    });
  }

  deriveAddresses(from: number, to: number) :string[] {
    const accounts = [];

    for (let i = from; i < to; i++) {
      const address = this.addressFromIndex(i);
      accounts.push(address);
      this.paths[ethUtil.toChecksumAddress(address)] = i;
    }
    return accounts;
  }


  publicKeyFromIndex(i:number):Buffer {
    const dkey = this.hdk.derive(`m/${i}`);
    return dkey.publicKey;
  }

  addressFromIndex(i:number):string {
    const pubkeyBuf = this.publicKeyFromIndex(i);
    return addressFromPublicKey(pubkeyBuf);
  }


  indexFromAddress(address:string):number {
    const checksummedAddress = ethUtil.toChecksumAddress(address);
    let index = this.paths[checksummedAddress];
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this.addressFromIndex(i)) {
          index = i;
          break;
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address');
    }
    return index;
  }
}

function padLeftEven(hex:string):string {
  return hex.length % 2 !== 0 ? `0${hex}` : hex;
}

function normalize(buf:Buffer): string {
  return padLeftEven(ethUtil.bufferToHex(buf).toLowerCase());
}

function addressFromPublicKey(publicKey: Buffer):string {
  const address = ethUtil.pubToAddress(publicKey, true).toString('hex');
  return ethUtil.toChecksumAddress(address);
}
