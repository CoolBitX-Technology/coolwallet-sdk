import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, DisplayBuilder, getTxDetail } from '@coolwallet/testing-library';

import * as bip39 from 'bip39';

import ZEN from '../src';

type PromiseValue<T> = T extends Promise<infer P> ? P : never;

describe('Test ZEN SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  const zen = new ZEN();
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo abstract';

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    transport = (await createTransport())!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props = await initialize(transport, mnemonic);
  });

  const inputTxTypeMinus5 = {
    preTxHash: '7ff81b3ac9f393bfb647c91b9d4d27f2cc7da07bec88fde06ad44b7e5319d333',
    preIndex: 1,
    scriptPubKey: '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac',
    addressIndex: 0,
  };

  const inputs = [
    {
      preTxHash: '253d66d2baef4fa79d7c33f096d1038f730b58e4cfeaa5e6bc485019b843f34c',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2025864e944de8a0d0330d5ce4047e6a8af68dc43ff9277e3b22b77a01000000000328cb19b4',
      addressIndex: 0,
    },
    {
      preTxHash: '3a2648a285852f5b924f336cab35f8bb78db10858e451c7fdbbcaa73904569e9',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac20115e3b4d7656e290933d647ea2a65b286010ffcb1b3333da0693fd00000000000396041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '7aefbfb639bd28f481cc43d60f604884e1bbaca5aeeb29049909326e6cdc99dd',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac20225dc432a0f95705722530b77583b5d78f6c94adcb1cc14c8dcb1103000000000395041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '7d68d851fd9823080d4b1ce8405a54949565accf454c67f0086c046863977093',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2062b3025ccc2dd8d6edd2462f9391dad2f92f7c6d32c29c34d193bc03000000000397041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: 'e9fde327d061b322a232afbc6e0224a71000a02364eb8cc305ad0e186eda762d',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac205c7dc98221b036d87c5e4fa1d846d6140e489e0da3b9fdf765386e02000000000394041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '5ea617344f0575cbf0b9d20db658d51cfb129377e04b210da87d307b760476f3',
      preIndex: 0,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac2000790cde77950501ffe10eb4caafd44a18ae89be6aa7a20187dae300000000000380041ab4',
      addressIndex: 0,
    },
    {
      preTxHash: '60c4b1ef5371c0e5764018f12787bb6aa974c2bd4556d9d03395b58456a4ae8e',
      preIndex: 143,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac209f36b4693e96bd5d79508a6cce57617e03c7d46e9a9db5c5b5e157030000000003eaa219b4',
      addressIndex: 0,
    },
    {
      preTxHash: 'a2d16fe7982614bc814362528c1934410ce1338417783e98fa7a77e5c5b9f1e4',
      preIndex: 297,
      scriptPubKey:
        '76a914be5cee44ab5402c6627bc049ea75c2f75935169988ac209f36b4693e96bd5d79508a6cce57617e03c7d46e9a9db5c5b5e157030000000003eaa219b4',
      addressIndex: 0,
    },
  ];

  const output = {
    value: 1000000000,
    address: 'znaRmosZDTG8zYBsNcheCN4LsgpVjPYE8Ay',
    blockHash: '00000000023c6af45cafdc6278a48ecde601a7077e62d08afa7109987d3297dd',
    blockHeight: 1705874,
  };

  const change = {
    value: 157112533,
    addressIndex: 0,
    blockHash: '00000000023c6af45cafdc6278a48ecde601a7077e62d08afa7109987d3297dd',
    blockHeight: 1705874,
  };

  test('zen tx', async () => {
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: zen.ScriptType.P2PKH,
      inputs,
      output,
      change,
      confirmCB: () => {},
      authorizedCB: () => {},
    };
    const signedTx = await zen.signTransaction(signTxData);
    expect(signedTx).toMatchInlineSnapshot(
      `"01000000084cf343b8195048bce6a5eacfe4580b738f03d196f0337c9da74fefbad2663d25000000006b483045022100a44bb8c170d82f3c9fba04d4ca8e4c64a223cadcf349ce48068cd7004236a209022050021fbfa68009e02b4a831c945d48299d91bf319dd5e748155254327b58e3268121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffffe969459073aabcdb7f1c458e8510db78bbf835ab6c334f925b2f8585a248263a000000006b483045022100a2c0d5b0a0d75d48c1361e6acf918b8172eaa3de75851c307b59180209b254d50220108e6015790eacbcc93015eee52b7431025375c5cae983dfff122a5b7b5753268121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffffdd99dc6c6e3209990429ebaea5acbbe18448600fd643cc81f428bd39b6bfef7a000000006b483045022100d00465fc7ec1f5d22850c105af56665ed15c86126acefe9b4a2be3bbf5dee09d02206be5718e8664842449d2fe50fa056f8e58583bd46278b9a33a1d1fd6f03f24858121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffff9370976368046c08f0674c45cfac659594545a40e81c4b0d082398fd51d8687d000000006b4830450221008bdc06d809494c525cf806d8514465cd11b7d2fa84ee90815d8369ca595441a702200230bea5cbca782a9fff486dc6ef8a0827d914b4d7f3b91326a484e8f75c34fa8121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffff2d76da6e180ead05c38ceb6423a00010a724026ebcaf32a222b361d027e3fde9000000006b4830450221009a209edeb97252ab81dff06d20762b329b9b3e4b72ef34cbe4541b2629ca3b4e022055e4f5114486851cbdc886c5c46cfc785b0e2dae17e05b2cd8e0f5ad6f90edb58121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66fffffffff37604767b307da80d214be0779312fb1cd558b60dd2b9f0cb75054f3417a65e000000006b483045022100b3be4df8c12f1d5e6bc9f6b91c7e87ea3e96fbab9cae1f9711f2c6c6fc1681dd022064a04e18478d3fb63014283589defd7d309159c868c8c2fd441fe782f92367da8121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffff8eaea45684b59533d0d95645bdc274a96abb8727f1184076e5c07153efb1c4608f0000006b483045022100f3cbfe55ce78651529926e30bbea00e5be64242e6d380c80d4770a2bba1e621f0220745d2b6d3ee19324ee977060fd8d46cb7bd23bf34668518612937e737a312ee28121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffffe4f1b9c5e5777afa983e78178433e10c4134198c52624381bc142698e76fd1a2290100006b483045022100a45e691bfffbd94759bb38c470f50bc32c38ba015b290ff24d2f74ef9acad35d02200e465ffdbb63b213200bd0e92b0646baa5d5a486eed2ec5b5eae096976ab24dc8121030ceff2eb84415264dede5edbcabbb6d133e91fc9ba00b6805f66093f65ea6a66ffffffff0200ca9a3b000000003f76a914667a9f10534aed5946b5895ada9ae7b25808ca7188ac20dd97327d980971fa8ad0627e07a701e6cd8ea47862dcaf5cf46a3c02000000000392071ab4d5585d09000000003f76a914e7ddb38ac76967361e52d3e1fffc371d97183d0988ac20dd97327d980971fa8ad0627e07a701e6cd8ea47862dcaf5cf46a3c02000000000392071ab400000000"`
    );
  });

  test.skip('zen tx with input tx type -5', async () => {
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: zen.ScriptType.P2PKH,
      inputs: [...inputs, inputTxTypeMinus5],
      output,
      change,
      confirmCB: () => {},
      authorizedCB: () => {},
    };
    const signedTx = await zen.signTransaction(signTxData);
  });
});
