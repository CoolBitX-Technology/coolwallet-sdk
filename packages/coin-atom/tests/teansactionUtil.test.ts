
import { expect } from 'chai';
import * as tx from '../src/util/transactionUtil'
import * as types from '../src/config/types'
import * as params from '../src/config/params'
import BigNumber from 'bignumber.js';



describe('Test Atom SDK', function () {
  const publicKey = '02f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca8'
  
  it('- Tx type: send', function () {
    const expectOutput = '0a93010a8e010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126e0a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c122d636f736d6f7331686c6c7763716733797a356d67783063706c6838326c323361643836353864767068766a746c1a0e0a057561746f6d12053130303030120012670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c1a40c494e1fb5527b5963da9ed1478e1adfd1d63761793af40126ff935b47e44baa77eac29c96d05f317ce6f5da64cd23d23ce2b89cb1613eeb0d1a2d16a8a6deb45'
    const signData: types.MsgSend = {
      chainId: types.CHAIN_ID.ATOM,
      fromAddress: 'cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl',
      toAddress: 'cosmos1hllwcqg3yz5mgx0cplh82l23ad8658dvphvjtl',
      amount: 10000,
      feeAmount: 5000,
      gas: 200000,
      accountNumber: '7439',
      sequence: '10',
      memo: '',
    };
    const signature = 'xJTh+1UntZY9qe0UeOGt/R1jdheTr0ASb/k1tH5Euqd+rCnJbQXzF85vXaZM0j0jziuJyxYT7rDRotFqim3rRQ=='
    const result = tx.getSendTx(signData, signature, publicKey)

    expect(result).equal(expectOutput);
  });

  
  it('- Tx type: delegate', function () {
    const expectOutput = '0aa1010a9c010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c656761746512750a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c1234636f736d6f7376616c6f706572317765366b6e6d38716172746d6d68327230716670737a367071307337656d763365306d6575771a0e0a057561746f6d12053130303030120012670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c1a4093b85b245260b4898c250e30757e4dc49b0de646321bee5f81f4e5dacf2471be774aed7ac7201102a64c78e44e018c184ae44acd8e93b163dc702a0b2a8d5544'
    const signData: types.MsgDelegate = {
      chainId: types.CHAIN_ID.ATOM,
      delegatorAddress: 'cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl',
      validatorAddress: 'cosmosvaloper1we6knm8qartmmh2r0qfpsz6pq0s7emv3e0meuw',
      amount: 10000,
      feeAmount: 5000,
      gas: 200000,
      accountNumber: '7439',
      sequence: '10',
      memo: '',
    };
    const signature = 'k7hbJFJgtImMJQ4wdX5NxJsN5kYyG+5fgfTl2s8kcb53Su16xyARAqZMeOROAYwYSuRKzY6TsWPccCoLKo1VRA=='
    const result = tx.getDelegateTx(signData, signature, publicKey)

    expect(result).equal(expectOutput);
  });


  it('- Tx type: undelegate', function () {
    const expectOutput = '0aa3010a9e010a252f636f736d6f732e7374616b696e672e763162657461312e4d7367556e64656c656761746512750a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c1234636f736d6f7376616c6f706572317765366b6e6d38716172746d6d68327230716670737a367071307337656d763365306d6575771a0e0a057561746f6d12053130303030120012670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c1a40204e8d50df5fa292001e8a93d382a38fe515915df9911f99413653b4a4d5409b73dcc6b733c75a65e46ef3da7d52df771dfa54d3e7b0d57e6b09685737f0a04b'
    const signData: types.MsgUndelegate = {
      chainId: types.CHAIN_ID.ATOM,
      delegatorAddress: 'cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl',
      validatorAddress: 'cosmosvaloper1we6knm8qartmmh2r0qfpsz6pq0s7emv3e0meuw',
      amount: 10000,
      feeAmount: 5000,
      gas: 200000,
      accountNumber: '7439',
      sequence: '10',
      memo: '',
    };
    const signature = 'IE6NUN9fopIAHoqT04Kjj+UVkV35kR+ZQTZTtKTVQJtz3Ma3M8daZeRu89p9Ut93HfpU0+ew1X5rCWhXN/CgSw=='
    const result = tx.getUndelegateTx(signData, signature, publicKey)

    expect(result).equal(expectOutput);
  });

  it('- Tx type: withdraw', function () {
    const expectOutput = '0aa5010aa0010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f7252657761726412650a2d636f736d6f7331666e6b336c786c6b733774646736783535796e7636766767746e64373379637173713839736c1234636f736d6f7376616c6f7065723171776c3837396e783974366b65663473757079617a61796637766a68656e6e79683536387973120012670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2102f10d4579a3bfbd142afbf2ab36f02d6ec427cb8fbad65ebb00b77abbb4c34ca812040a020801180a12130a0d0a057561746f6d12043530303010c09a0c1a4028f7fd7f9746d64351ecc9aacaf033ca4b3000bc89dc744a2cc7338b2d1df71106008a1fa11ded41a75fc6d6ddca79ce79d5aa0e0375ed87ec347654b576643b'
    const signData: types.MsgWithdrawDelegationReward = {
      chainId: types.CHAIN_ID.ATOM,
      delegatorAddress: 'cosmos1fnk3lxlks7tdg6x55ynv6vggtnd73ycqsq89sl',
      validatorAddress: 'cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys',
      feeAmount: 5000,
      gas: 200000,
      accountNumber: '7439',
      sequence: '10',
      memo: '',
    };
    const signature = 'KPf9f5dG1kNR7MmqyvAzykswALyJ3HRKLMcziy0d9xEGAIofoR3tQadfxtbdynnOedWqDgN17YfsNHZUtXZkOw=='
    const result = tx.getWithdrawDelegatorRewardTx(signData, signature, publicKey)

    expect(result).equal(expectOutput);
  });

});

