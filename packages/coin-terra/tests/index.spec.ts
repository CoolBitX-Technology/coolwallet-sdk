import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail } from '@coolwallet/testing-library';
import Terra from '../src';
import { CHAIN_ID, TX_TYPE, SignDataType } from '../src/config/types';
import { DENOMTYPE } from "../src/config/denomType";

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const coinTerra = new Terra();

const mnemonic = 'catalog inmate announce liar young avocado oval depth tag around sting soda';

describe('Test Terra SDK', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let walletAddress = '';
  let signTxData: SignDataType = {
    addressIndex: 0,
    confirmCB: undefined,
    authorizedCB: undefined,
  };

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
  });

  it('Test Get Address', async () => {
    const address = await coinTerra.getAddress(transport, props.appPrivateKey, props.appId, 0);
    walletAddress = address;
    signTxData.transport = transport;
    signTxData.appPrivateKey = props.appPrivateKey;
    signTxData.appId = props.appId;
    expect(address).toEqual('terra1uvh92fdu5pl2k4a3gwa2990cqphwxqwzkj2kvk');
  });

  it('Test Normal Transfer', async () => {
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      fromAddress: walletAddress,
      toAddress: "terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv",
      amount: 1000000000,
      denom: DENOMTYPE.KRT,
      feeAmount: 90000,
      feeDenom: DENOMTYPE.UST,
      gas: 85000,
      memo: 'test signature',
    };
    signTxData.txType = TX_TYPE.SEND;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('CqMBCpABChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnAKLHRlcnJhMXV2aDkyZmR1NXBsMms0YTNnd2EyOTkwY3FwaHd4cXd6a2oya3ZrEix0ZXJyYTF1MjlxdHdyMHU0cHN2OHoya24ydGd4YWxmNWVmdW5mcWozd2hqdhoSCgR1a3J3EgoxMDAwMDAwMDAwEg50ZXN0IHNpZ25hdHVyZRJoClEKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECJFBUDl/ED1D9sun6qVgpSzsr/HYRaPLBLllI4fystRwSBAoCCAEYlQYSEwoNCgR1dXNkEgU5MDAwMBCImAUaQBPIckhSaSZNrwLFOU7h6mXxtY2PFSOTlVFKa4tfv14ZOcMPZvqqfCDOonULJve40DfrxIfqHY05VfgSzDvmlOQ=');  
    //const display = await getTxDetail(transport, props.appId);
    //expect(display).toEqual('what');
  });

  it('Test Delegate', async () => {
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      delegatorAddress: walletAddress,
      validatorAddress: "terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at",
      amount: 1000000,
      feeAmount: 70000000,
      gas: 520000,
      feeDenom: DENOMTYPE.JPT,
      memo: 'test delegate',
    };
    signTxData.txType = TX_TYPE.DELEGATE;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('Cq4BCpwBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ1Cix0ZXJyYTF1dmg5MmZkdTVwbDJrNGEzZ3dhMjk5MGNxcGh3eHF3emtqMmt2axIzdGVycmF2YWxvcGVyMTI1OWNtdTV6eWtsc2RrbWdzdHhod3FwZTB1dGZlNWhoeXR5MGF0GhAKBXVsdW5hEgcxMDAwMDAwEg10ZXN0IGRlbGVnYXRlEmsKUQpGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQIkUFQOX8QPUP2y6fqpWClLOyv8dhFo8sEuWUjh/Ky1HBIECgIIARiVBhIWChAKBHVqcHkSCDcwMDAwMDAwEMDeHxpAQciMb1JEQDdO1cH2dEcOkD43j8BuEI69Jo28Mr+W+nA0FVizomFa94TGEb0ZgiYg0kFGpP7VoDYNHXyOhFZMtA==');
  });

  it('Test Undelegate', async () => {
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      delegatorAddress: walletAddress,
      validatorAddress: "terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at",
      amount: 1000000,
      feeAmount: 700000,
      feeDenom: DENOMTYPE.EUT,
      gas: 550000,
      memo: 'test undelegate',
    };
    signTxData.txType = TX_TYPE.UNDELEGATE;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('CrIBCp4BCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnUKLHRlcnJhMXV2aDkyZmR1NXBsMms0YTNnd2EyOTkwY3FwaHd4cXd6a2oya3ZrEjN0ZXJyYXZhbG9wZXIxMjU5Y211NXp5a2xzZGttZ3N0eGh3cXBlMHV0ZmU1aGh5dHkwYXQaEAoFdWx1bmESBzEwMDAwMDASD3Rlc3QgdW5kZWxlZ2F0ZRJpClEKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECJFBUDl/ED1D9sun6qVgpSzsr/HYRaPLBLllI4fystRwSBAoCCAEYlQYSFAoOCgR1ZXVyEgY3MDAwMDAQ8MghGkA/R0vBr3zpzrbDvXiueLk00HFxHI/rWdWrsbCKua5ToQVB5vOY6Mrico7QeLX7H/qWw8jPpfNRGcJVeIzX5Z7n');
  });

  it('Test Withdraw', async () => {
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      delegatorAddress: walletAddress,
      validatorAddress: "terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at",
      feeAmount: 1330000000,
      feeDenom: DENOMTYPE.MNT,
      gas: 400000,
      memo: 'test withdraw',
    };
    signTxData.txType = TX_TYPE.WITHDRAW;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('CrABCp4BCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmMKLHRlcnJhMXV2aDkyZmR1NXBsMms0YTNnd2EyOTkwY3FwaHd4cXd6a2oya3ZrEjN0ZXJyYXZhbG9wZXIxMjU5Y211NXp5a2xzZGttZ3N0eGh3cXBlMHV0ZmU1aGh5dHkwYXQSDXRlc3Qgd2l0aGRyYXcSbQpRCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAiRQVA5fxA9Q/bLp+qlYKUs7K/x2EWjywS5ZSOH8rLUcEgQKAggBGJUGEhgKEgoEdW1udBIKMTMzMDAwMDAwMBCAtRgaP+F/i+PwQVLI+2n3llwSPJrKCysWuewCOvTq67KK+80gR4OJ+K6FBGbFI4vm/uwcSKuqeZ65OsKSQvavXVBmfg==');
  });

  it('Test Smart Contract: Luna to bLuna Swap', async () => {
    const executeMsgObj = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: DENOMTYPE.LUNA.unit
            }
          },
          amount: "345000"
        }
      }
    };
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      senderAddress: walletAddress,
      contractAddress: "terra19qx5xe6q9ll4w0890ux7lv2p4mf3csd4qvt3ex",
      execute_msg: JSON.stringify(executeMsgObj),
      funds: {
        amount: 345000,
        denom: DENOMTYPE.LUNA
      },
      feeAmount: 200000,
      feeDenom: DENOMTYPE.SDT,
      gas: 250000,
      memo: 'Swap test',
    };
    signTxData.txType = TX_TYPE.SMART;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('CpACCoICCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBLXAQosdGVycmExdXZoOTJmZHU1cGwyazRhM2d3YTI5OTBjcXBod3hxd3prajJrdmsSLHRlcnJhMTlxeDV4ZTZxOWxsNHcwODkwdXg3bHYycDRtZjNjc2Q0cXZ0M2V4Gmgie1wic3dhcFwiOntcIm9mZmVyX2Fzc2V0XCI6e1wiaW5mb1wiOntcIm5hdGl2ZV90b2tlblwiOntcImRlbm9tXCI6XCJ1bHVuYVwifX0sXCJhbW91bnRcIjpcIjM0NTAwMFwifX19IioPCgV1bHVuYRIGMzQ1MDAwEglTd2FwIHRlc3QSaQpRCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAiRQVA5fxA9Q/bLp+qlYKUs7K/x2EWjywS5ZSOH8rLUcEgQKAggBGJUGEhQKDgoEdXNkchIGMjAwMDAwEJChDxpAayWLE76FjspsEtGYIbPYdF8i88RdCSm6w/o5e1C1TkAkeNNFA/mxaRA+P4MC7uEuAGLsGMTsF/Jg9V/hdOAf9g==');
  });

  it('Test Send CW20 Transfer', async () => {
    const executeMsgObj = {
      
    };
    const transaction = {
      chainId: CHAIN_ID.MAIN,
      accountNumber: "123456",
      sequence: "789",
      senderAddress: walletAddress,
      contractAddress: "terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76",
      execute_msg: {
        transfer: {
          amount: "12000000",
          recipient: "terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv"
        }
      },
      option: {
        info: {
          symbol: "ANC",
          decimals: "6"
        }
      },
      feeAmount: 5000000,
      feeDenom: DENOMTYPE.THT,
      gas: 120000,
      memo: 'Send cw20 test',
    };
    signTxData.txType = TX_TYPE.CW20;
    signTxData.transaction = transaction;
    const signedTx = await coinTerra.signTransaction(signTxData);
    expect(signedTx).toEqual('CvkBCuYBCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBK7AQosdGVycmExdXZoOTJmZHU1cGwyazRhM2d3YTI5OTBjcXBod3hxd3prajJrdmsSLHRlcnJhMTR6NTZsMGZwMmxzZjg2enkzaHR5Mno0N2V6a2hudGh0cjl5cTc2Gl17InRyYW5zZmVyIjp7ImFtb3VudCI6IjEyMDAwMDAwIiwicmVjaXBpZW50IjoidGVycmExdTI5cXR3cjB1NHBzdjh6MmtuMnRneGFsZjVlZnVuZnFqM3doanYifX0SDlNlbmQgY3cyMCB0ZXN0EmoKUQpGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQIkUFQOX8QPUP2y6fqpWClLOyv8dhFo8sEuWUjh/Ky1HBIECgIIARiVBhIVCg8KBHV0aGISBzUwMDAwMDAQwKkHGkC4TNWvgUqRTFg9yzrym079OPpwM9364ObohHrlIZUqcHX9USMml8WKeEqyjiXZe/UWzN+zMYQgaYXen4iuGAWD');
  });
});