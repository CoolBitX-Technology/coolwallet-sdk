import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize } from '@coolwallet/testing-library';
import KAS from '../src';
import { ScriptType, SignTxType } from '../src/config/types';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;
type Mandatory = PromiseValue<ReturnType<typeof initialize>>;

const kasSDK = new KAS();

const testWalletInfo = {
  mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card',
  publicKey: '03da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef',
  address: 'kaspa:qrdga25hhaz9wd5p3rrcaynxrl0jm9kwze4jyhgdcmqu8cezaa3w7xh9a3xd9',
};

describe('Test KAS SDK', () => {
  let transport: Transport;
  let cardType: CardType;
  let props: Mandatory;

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Lite) {
      transport = (await createTransport('http://localhost:9527', CardType.Lite))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, testWalletInfo.mnemonic);
  });

  it('Test get address of index 0', async () => {
    const addressIndex = 0;
    const address = await kasSDK.getAddress(transport, props.appPrivateKey, props.appId, ScriptType.P2PK, addressIndex);
    expect(address).toEqual(testWalletInfo.address);
  });

  it('Test signing 2 outputs transaction, and if the output is 0.2 KAS', async () => {
    const signTxType: SignTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2PK,
      inputs: [
        {
          preIndex: 1,
          preTxHash: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
          preValue: '2355557326',
          purposeIndex: 44,
          addressIndex: 0,
        },
      ],
      output: {
        value: '20000000',
        address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
      },
      change: {
        value: '2335546146',
        addressIndex: 0,
        purposeIndex: 44,
      },
    };
    const signedTx = await kasSDK.signTransaction(signTxType);
    expect(signedTx).toMatchInlineSnapshot(
      `"7b227472616e73616374696f6e223a7b2276657273696f6e223a302c22696e70757473223a5b7b2270726576696f75734f7574706f696e74223a7b227472616e73616374696f6e4964223a2232316161316166663835666330353433383166383533366431616238646265363866313637336137633637623761643738313634333136303363353864333265222c22696e646578223a317d2c227369676e6174757265536372697074223a22343162383134376262336337326134333138653133613539373936373131633463313531363165333634363730353737363438356463643032666131623265653336363865646233386232353161646235383966653862656363363036613061306162313431306230353139346264656339666138383263636130303138326433613031222c2273657175656e6365223a302c227369674f70436f756e74223a317d5d2c226f757470757473223a5b7b22616d6f756e74223a32303030303030302c227363726970745075626c69634b6579223a7b2276657273696f6e223a302c227363726970745075626c69634b6579223a223230306133646136653863376138373935343430653630653436363236383662633137636439363537383030393536303463383564386431333765306634383037396163227d7d2c7b22616d6f756e74223a323333353534363134362c227363726970745075626c69634b6579223a7b2276657273696f6e223a302c227363726970745075626c69634b6579223a223230646138656161393762663434353733363831383863373865393236363166646632643936636531363662323235643064633663316333653332326566363265666163227d7d5d2c226c6f636b54696d65223a302c227375626e6574776f726b4964223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030227d2c22616c6c6f774f727068616e223a66616c73657d"`
    );
  });

  it('Test signing 2 outputs transaction, and if the output is less than 0.2 KAS will throw an error', async () => {
    const signTxType: SignTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2PK,
      inputs: [
        {
          preIndex: 1,
          preTxHash: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
          preValue: '2355557326',
          purposeIndex: 44,
          addressIndex: 0,
        },
      ],
      output: {
        value: '1000',
        address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
      },
      change: {
        value: '2355546146',
        addressIndex: 0,
        purposeIndex: 44,
      },
    };
    await expect(kasSDK.signTransaction(signTxType)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"error function: validateOutput, message: validate: invalid output value: 1000 should be greater than 19999999"`
    );
  });

  it('Test signing a transaction with 1 output, where the output is below 0.2 KAS', async () => {
    const signTxType: SignTxType = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      scriptType: ScriptType.P2PK,
      inputs: [
        {
          preIndex: 1,
          preTxHash: '21aa1aff85fc054381f8536d1ab8dbe68f1673a7c67b7ad7816431603c58d32e',
          preValue: '122100000',
          purposeIndex: 44,
          addressIndex: 0,
        },
      ],
      output: {
        value: '122067460',
        address: 'kaspa:qq9rmfhgc758j4zquc8yvcngd0qhekt90qqf2czvshvdzdlq7jq8jphmvr028',
      },
    };
    const signedTx = await kasSDK.signTransaction(signTxType);
    expect(signedTx).toMatchInlineSnapshot(
      `"7b227472616e73616374696f6e223a7b2276657273696f6e223a302c22696e70757473223a5b7b2270726576696f75734f7574706f696e74223a7b227472616e73616374696f6e4964223a2232316161316166663835666330353433383166383533366431616238646265363866313637336137633637623761643738313634333136303363353864333265222c22696e646578223a317d2c227369676e6174757265536372697074223a22343135313232343935316133656134343262396465316162356238373465636639626364346237623131653762383631653134666436383465336165663439663438396363396330356364656633316162356462323066643236323731626462633563306262393566383639393130353963363237633566333538623935386634653031222c2273657175656e6365223a302c227369674f70436f756e74223a317d5d2c226f757470757473223a5b7b22616d6f756e74223a3132323036373436302c227363726970745075626c69634b6579223a7b2276657273696f6e223a302c227363726970745075626c69634b6579223a223230306133646136653863376138373935343430653630653436363236383662633137636439363537383030393536303463383564386431333765306634383037396163227d7d5d2c226c6f636b54696d65223a302c227375626e6574776f726b4964223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030227d2c22616c6c6f774f727068616e223a66616c73657d"`
    );
  });
});
