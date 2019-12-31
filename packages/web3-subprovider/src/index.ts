const HDKey = require('hdkey')
const ethUtil = require('ethereumjs-util')
const BRIDGE_URL = 'https://coolbitx-technology.github.io/coolwallet-connect/#/iframe'
const MAX_INDEX = 1000

import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet'

type Options = {
  // should use actively validate on the device
  accountsLength?: number
  // offset index to use to start derivating the accounts
  accountsOffset?: number
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
      getAccounts: callback => {
        this._getAccounts()
          .then(accounts => callback(null, accounts))
          .catch(error => callback(error)) 
      },
      signMessage: async (msgParams, callback) => {
        this._signPersonalMessage(msgParams.from, msgParams.data)
          .then(signature => callback(null, signature))
          .catch(error => callback(error))
      },
      signTransaction: async (txParams, callback) => {
        this._signTransaction(txParams.from, txParams)
          .then(tx => callback(null, tx))
          .catch(error => callback(error))
      },
      signTypedMessage: async (msgParams, callback) => {
        this._signTypedData(msgParams.from, msgParams.data)
        .then(data => callback(null, data))
        .catch(error => callback(error))
      },
    })
    this.options = options
    this.hdk = new HDKey()
    this.paths = {}
    this.iframe = null
    this._setupIframe()
  } // end of constructor

  hasAccountKey() {
    return !!(this.hdk && this.hdk.publicKey)
  }

  unlock(addrIndex?: number) : Promise<string> {
    if (this.hasAccountKey() && typeof addrIndex === 'undefined') return Promise.resolve('already unlocked')
    if (this.hasAccountKey() && typeof addrIndex === 'number') {
      return Promise.resolve(this._addressFromIndex(addrIndex))
    }
    // unlock: get publickey and chainCodes
    return new Promise((resolve, reject) => {
      addrIndex = addrIndex | 0
      this._postMsgToBridge(
        {
          action: 'coolwallet-unlock',
          params: {
            addrIndex,
          },
        },
        ({ success, payload }) => {
          if (success) {
            this.hdk.publicKey = new Buffer(payload.parentPublicKey, 'hex')
            this.hdk.chainCode = new Buffer(payload.parentChainCode, 'hex')
            const address = this._addressFromPublicKey(Buffer.from(payload.publicKey, 'hex'))
            resolve(address)
          } else {
            reject(payload.error || 'Unknown error')
          }
        }
      )
    })
  }

  async _getAccounts() {
    return new Promise((resolve)=>{
      this.unlock()
        .then(()=>{
          resolve(this._deriveAddresses(this.options.accountsOffset, this.options.accountsOffset + this.options.accountsLength))
        })
    })
  }

  // tx is an instance of the ethereumjs-transaction class.
  _signTransaction(address, tx) {
    return new Promise((resolve, reject) => {
      this.unlock().then( () => {
        const addrIndex = this._indexFromAddress(address)
        const publicKey = this._publicKeyFromIndex(addrIndex).toString('hex')
        const transaction = {
          to: this._normalize(tx.to),
          value: this._normalize(tx.value),
          data: this._normalize(tx.data),
          chainId: tx._chainId,
          nonce: this._normalize(tx.nonce),
          gasLimit: this._normalize(tx.gasLimit),
          gasPrice: this._normalize(tx.gasPrice),
        }

        this._postMsgToBridge(
          {
            action: 'coolwallet-sign-transaction',
            params: {
              tx: transaction,
              addrIndex,
              publicKey,
            },
          },
          ({ success, payload }) => {
            if (success) resolve(payload)
            else reject(new Error(payload.error || 'CoolWalletS: Unknown error while signing transaction'))
          }
        )
      })
    })
  }

  // For personal_sign, we need to prefix the message:
  _signPersonalMessage(withAccount, message) {
    return new Promise((resolve, reject) => {
      this.unlock().then( () => {
        const addrIndex = this._indexFromAddress(withAccount)
        const publicKey = this._publicKeyFromIndex(addrIndex).toString('hex')
        this._postMsgToBridge(
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
              resolve(payload)
            } else {
              reject(new Error(payload.error || 'CoolWalletS: Uknown error while signing message'))
            }
          }
        )
      })
    })
  }

  _signTypedData(withAccount, typedData) {
    return new Promise((resolve, reject) => {
      this.unlock().then( () => {
        const addrIndex = this._indexFromAddress(withAccount)
        const publicKey = this._publicKeyFromIndex(addrIndex).toString('hex')
        this._postMsgToBridge(
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
              resolve(payload)
            } else {
              reject(new Error(payload.error || 'CoolWalletS: Uknown error while signing typed data'))
            }
          }
        )
      })
    })
  }

  /* PRIVATE METHODS */

  _setupIframe() {
    this.iframe = document.createElement('iframe')
    this.iframe.src = BRIDGE_URL
    document.head.appendChild(this.iframe)
  }

  _postMsgToBridge(msg: PostMessage, cb:Function) {
    msg.target = 'CWS-IFRAME'
    this.iframe.contentWindow.postMessage(msg, '*')
    window.addEventListener('message', ({ data }) => {
      if (data && data.action && data.action === `${msg.action}-reply`) {
        cb(data)
      }
    })
  }

  _deriveAddresses(from: number, to: number) {
    const accounts = []

    for (let i = from; i < to; i++) {
      const address = this._addressFromIndex(i)
      accounts.push(address)
      this.paths[ethUtil.toChecksumAddress(address)] = i
    }
    return accounts
  }

  _padLeftEven(hex:string) {
    return hex.length % 2 !== 0 ? `0${hex}` : hex
  }

  _normalize(buf:Buffer) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).toLowerCase())
  }

  _publicKeyFromIndex(i:number) {
    const dkey = this.hdk.derive(`m/${i}`)
    return dkey.publicKey
  }

  _addressFromIndex(i:number) {
    const pubkeyBuf = this._publicKeyFromIndex(i)
    return this._addressFromPublicKey(pubkeyBuf)
  }

  _addressFromPublicKey(publicKey: Buffer) {
    const address = ethUtil.pubToAddress(publicKey, true).toString('hex')
    return ethUtil.toChecksumAddress(address)
  }

  _indexFromAddress(address:string) {
    const checksummedAddress = ethUtil.toChecksumAddress(address)
    let index = this.paths[checksummedAddress]
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(i)) {
          index = i
          break
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address')
    }
    return index
  }
}
