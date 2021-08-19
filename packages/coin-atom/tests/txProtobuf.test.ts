
import { expect } from 'chai';
import * as tx from '../src/util/transactionUtil'
import * as types from '../src/config/types'
var protobuf = require('protocol-buffers')
import * as fs from 'fs';
var messages = protobuf(fs.readFileSync('./src/config/cosmos.proto'))


describe('Send Transaction Protobuf Test', async function () {
  const publicKey = '02f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8'
  let body_bytes = ''
  let auth_info_bytes = ''
  it('- MsgSend', async function () {
    const expectOutput = '0a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c122d636f736d6f7331686c6c7763716733797a356d67783063706c6838326c323361643836353864767068766a746c1a0e0a057561746f6d12053130303030'
    var buf = messages.MsgSend.encode({
      from_address: 'cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl',
      to_address: 'cosmos1hllwcqg3yz5mgx0cplh82l23ad8658dvphvjtl',
      amount: [{ denom: 'uatom', amount: '10000' }]
    })
    const result = Buffer.from(buf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });

  it('- Fee', async function () {
    const expectOutput = '0a0d0a057561746f6d12043530303010c09a0c'
    var buf = messages.Fee.encode({ amount: [{ denom: 'uatom', amount: '5000' }], gas_limit: '200000' })
    const result = Buffer.from(buf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });

  it('- TxBody', async function () {
    const msgSendValue = '0a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c122d636f736d6f7331686c6c7763716733797a356d67783063706c6838326c323361643836353864767068766a746c1a0e0a057561746f6d12053130303030'
    const expectOutput = '0a8e010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126e0a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c122d636f736d6f7331686c6c7763716733797a356d67783063706c6838326c323361643836353864767068766a746c1a0e0a057561746f6d120531303030301200'
    var txBodybuf = messages.TxBody.encode({
      messages: [
        {
          type_url: '/cosmos.bank.v1beta1.MsgSend',
          value: Buffer.from(msgSendValue, 'hex')
        }
      ],
      memo: ''
    })
    body_bytes = txBodybuf
    const result = Buffer.from(txBodybuf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });


  it('- PublicKey', async function () {
    const expectPublicKey = '0a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8'
    var publicKeyBuf = messages.PublicKey.encode({
      value: Buffer.from(publicKey, 'hex')
    })
    const resultPublicKey = Buffer.from(publicKeyBuf, 'hex').toString('hex')

    expect(resultPublicKey).equal(expectPublicKey);

    const expectOutput = '0a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8'

    var publicKeyInfoBuf = messages.Any.encode({
      type_url: '/cosmos.crypto.secp256k1.PubKey',
      value: publicKeyBuf
    })
    const result = Buffer.from(publicKeyInfoBuf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });

  it('- Signer Info', async function () {
    const expectOutput = '0a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a'
    const pubKeyAny = Buffer.from('0a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8', 'hex')
    
    var buf = messages.SignerInfo.encode({
      public_key: pubKeyAny,
      mode_info:
        { single: { mode: messages.SignMode.SIGN_MODE_DIRECT } }
      ,
      sequence: '10'
    })
    const result = Buffer.from(buf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });


  it('- Auth Info', async function () {
    const expectOutput = '0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c'
    
    const pubKeyAny = Buffer.from('0a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8', 'hex')
    const signerInfobuf = messages.SignerInfo.encode({
      public_key: pubKeyAny,
      mode_info:
        { single: { mode: messages.SignMode.SIGN_MODE_DIRECT } }
      ,
      sequence: '10'
    })
    const feeBuf = messages.Fee.encode({ amount: [{ denom: 'uatom', amount: '5000' }], gas_limit: '200000' })
    const authInfoBuf = messages.AuthInfo.encode({ signer_infos: [signerInfobuf], fee: feeBuf });
    auth_info_bytes = authInfoBuf
    const result = Buffer.from(authInfoBuf, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });

  it('- Tx Raw', async function () {
    const expectOutput = '0a93010a8e010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126e0a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c122d636f736d6f7331686c6c7763716733797a356d67783063706c6838326c323361643836353864767068766a746c1a0e0a057561746f6d12053130303030120012670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c1a40c494e1fb5527b5963da9ed1478e1adfd1d63761793af40126ff935b47e44baa77eac29c96d05f317ce6f5da64cd23d23ce2b89cb1613eeb0d1a2d16a8a6deb45'
    const txRaw = messages.TxRaw.encode({
      body_bytes: body_bytes,
      auth_info_bytes: auth_info_bytes,
      signatures: [Buffer.from('xJTh+1UntZY9qe0UeOGt/R1jdheTr0ASb/k1tH5Euqd+rCnJbQXzF85vXaZM0j0jziuJyxYT7rDRotFqim3rRQ==', 'base64')],
    });
    const result = Buffer.from(txRaw, 'hex').toString('hex')

    expect(result).equal(expectOutput);
  });


});

