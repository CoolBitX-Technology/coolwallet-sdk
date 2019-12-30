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
      getAccounts: async cb => {
        try {
          const accounts = await this.getAccounts()
          if (accounts && accounts.length) {
            cb(null, accounts)
          } else {
            cb(new Error('Failed to get accounts'))
          }
        } catch (error) {
          cb(error)
        }
      },
      signMessage: async (msgParams, cb) => {
        try {
          const result = await this.signMessage(msgParams.from, msgParams.data)
          cb(null, result)
        } catch (error) {
          cb(error)
        }
      },
      signPersonalMessage: async (msgParams, cb) => {
        try {
          const result = await this.signPersonalMessage(msgParams.from, msgParams.data)
          cb(null, result)
        } catch (error) {
          cb(error)
        }
      },
      signTransaction: async (txParams, cb) => {
        try {
          const result = await this.signTransaction(txParams.from, txParams)
          cb(null, result)
        } catch (error) {
          cb(error)
        }
      },
      signTypedMessage: async (msgParams, cb) => {
        try {
          const result = await this.signTypedData(msgParams.from, msgParams.data)
          cb(null, result)
        } catch (error) {
          cb(error)
        }
      },
    })
    this.options = options
    this.hdk = new HDKey()
    this.paths = {}
    this.iframe = null
    this._setupIframe()
  } // end of constructor

  hasAccountKey() {
    const result = !!(this.hdk && this.hdk.publicKey)
    return result
  }

  unlock(addrIndex?: number) {
    if (this.hasAccountKey() && typeof addrIndex === 'undefined') return Promise.resolve('already unlocked')
    if (this.hasAccountKey() && typeof addrIndex === 'number') {
      return this._addressFromIndex(addrIndex)
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

  getAccounts() {
    return this._getAccounts(this.options.accountsOffset, this.options.accountsOffset + this.options.accountsLength)
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction(address, tx) {
    return new Promise((resolve, reject) => {
      this.unlock().then(_ => {
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

  signMessage(withAccount, data) {
    return this.signPersonalMessage(withAccount, data)
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage(withAccount, message) {
    return new Promise((resolve, reject) => {
      this.unlock().then(_ => {
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

  signTypedData(withAccount, typedData) {
    return new Promise((resolve, reject) => {
      this.unlock().then(_ => {
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

  _getAccounts(from: number, to: number) {
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
