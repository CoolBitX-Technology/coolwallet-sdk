import React from 'react';
import Web3 from 'web3';
import { Container, Dropdown } from 'react-bootstrap';
import omit from 'lodash/omit';
import isNil from 'lodash/isNil';
import { Transport } from '@coolwallet/core';
import EVM, { CHAIN } from '@coolwallet/evm';
import Inputs from '../../Inputs';
import { useAppId, useRequest } from '../../../utils/hooks';
import type {
  EIP1559Transaction,
  LegacyTransaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
} from '@coolwallet/evm/lib/transaction/types';
import type { ChainProps } from '@coolwallet/evm/lib/chain/types';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

type ChainItem = {
  name: string;
  properties: ChainProps;
  rpc_url: string;
};

const CHAINS = {
  CRONOS: {
    name: 'Cronos',
    properties: CHAIN.CRONOS,
    rpc_url: 'https://evm-cronos.crypto.org',
  },
  POLYGON: {
    name: 'Polygon',
    properties: CHAIN.POLYGON,
    rpc_url: 'https://matic-mainnet.chainstacklabs.com',
  },
} as Record<'CRONOS', ChainItem>;

enum TxType {
  TRANSFER,
  ERC20,
  SMART_CONTRACT,
}

const CoinEVM: React.FC<Props> = (props: Props) => {
  const { appPrivateKey } = props;
  const transport = props.transport as Transport;
  const disabled = !transport || props.isLocked;
  const [address, setAddress] = React.useState('');
  const [selectedChain, setSelectedChain] = React.useState(CHAINS.CRONOS);
  const [txString, setTxString] = React.useState('');
  const [txResult, setTxResult] = React.useState('');
  const coin = React.useRef(new EVM(selectedChain.properties));
  const api = React.useRef(new Web3(selectedChain.rpc_url));

  React.useEffect(() => {
    coin.current = new EVM(selectedChain.properties);
    api.current = new Web3(selectedChain.rpc_url);
  }, [selectedChain]);

  const onSelectChain = (chain: ChainItem) => () => {
    setSelectedChain(chain);
  };

  const getAddress = () =>
    useRequest(async () => {
      const { current: sdk } = coin;
      const appId = useAppId();
      return sdk.getAddress(transport, appPrivateKey, appId, 0);
    }, props).then(setAddress);

  const [legacyTransfer, setLegacyTransfer] = React.useState({
    to: '',
    value: '',
    result: '',
  });

  const [legacyERC20, setLegacyERC20] = React.useState({
    to: '',
    value: '',
    symbol: '',
    result: '',
  });

  const [legacyData, setLegacyData] = React.useState({
    to: '',
    value: '',
    data: '',
    result: '',
  });

  const [eip1559Transfer, setEIP1559Transfer] = React.useState({
    to: '',
    value: '',
    result: '',
  });

  const [eip1559ERC20, setEIP1559ERC20] = React.useState({
    to: '',
    value: '',
    symbol: '',
    result: '',
  });

  const [eip1559Data, setEIP1559Data] = React.useState({
    to: '',
    value: '',
    data: '',
    result: '',
  });

  const [typedData, setTypedData] = React.useState({
    typedData: '',
    result: '',
  });

  const [messageData, setMessageData] = React.useState({
    message: '',
    result: '',
  });

  type GetDataType<Tx> = Tx extends TxType.TRANSFER
    ? typeof legacyTransfer
    : Tx extends TxType.ERC20
    ? typeof legacyERC20
    : Tx extends TxType.SMART_CONTRACT
    ? typeof legacyData
    : never;

  function signTransaction<Tx = TxType>(
    type: TxType,
    isEIP1559: boolean,
    data: GetDataType<Tx>,
    setter: React.Dispatch<React.SetStateAction<GetDataType<Tx>>>
  ) {
    return function () {
      useRequest(async () => {
        const { current: web3 } = api;
        const { current: sdk } = coin;
        let transaction = {
          nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
          to: data.to,
          value: '0x0',
          data: '',
          gasLimit: '',
        };
        switch (type) {
          case TxType.TRANSFER: {
            transaction = {
              ...transaction,
              value: web3.utils.toHex(web3.utils.toWei(data.value, 'ether')),
              gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: data.to, data: '' })),
            };
            break;
          }
          case TxType.ERC20: {
            const input = data as GetDataType<TxType.ERC20>;
            const token = selectedChain.properties.tokens[input.symbol];
            if (isNil(token)) throw new Error(`Cannot find given token ${input.symbol}`);
            // Assuming it is a USDT
            const scale = 10 ** +token.unit;
            const amount = web3.utils.toHex(Math.floor(+input.value * scale)).slice(2);
            const erc20To = input.to.startsWith('0x') ? input.to.slice(2) : input.to;
            const erc20Data = `0xa9059cbb${erc20To.padStart(64, '0')}${amount.padStart(64, '0')}`;
            const contractAddress = token.contractAddress;
            transaction = {
              ...transaction,
              to: contractAddress,
              data: erc20Data,
              gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: input.to, data: erc20Data })),
            };
            break;
          }
          case TxType.SMART_CONTRACT: {
            const input = data as GetDataType<TxType.SMART_CONTRACT>;
            transaction = {
              ...transaction,
              value: web3.utils.toHex(web3.utils.toWei(input.value, 'ether')),
              gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: input.to, data: input.data })),
              data: input.data,
            };
            break;
          }
        }

        const appId = useAppId();
        const price = web3.utils.toHex(await web3.eth.getGasPrice());
        if (isEIP1559) {
          transaction = { ...transaction, gasFeeCap: price, gasTipCap: price } as EIP1559Transaction['transaction'];
          const signTxData = {
            transport,
            appPrivateKey,
            appId,
            transaction: transaction as EIP1559Transaction['transaction'],
            addressIndex: 0,
          };
          return sdk.signEIP1559Transaction(signTxData);
        }
        transaction = { ...transaction, gasPrice: price } as LegacyTransaction['transaction'];
        const signTxData = {
          transport,
          appPrivateKey,
          appId,
          transaction: transaction as LegacyTransaction['transaction'],
          addressIndex: 0,
        };
        return sdk.signTransaction(signTxData);
      }, props).then((result) => {
        setter((prev) => ({ ...prev, result }));
      });
    };
  }

  async function signMessage() {
    return useRequest(async function () {
      const { current: sdk } = coin;
      const appId = useAppId();
      const signTxData = {
        transport,
        appPrivateKey,
        appId,
        message: messageData.message,
        addressIndex: 0,
      } as EIP712MessageTransaction;

      return sdk.signMessage(signTxData);
    }, props).then((result) => setMessageData((prev) => ({ ...prev, result })));
  }

  async function signTypedData() {
    return useRequest(async function () {
      const { current: sdk } = coin;
      const appId = useAppId();
      const signTxData = {
        transport,
        appPrivateKey,
        appId,
        typedData: JSON.parse(typedData.typedData),
        addressIndex: 0,
      } as EIP712TypedDataTransaction;

      return sdk.signTypedData(signTxData);
    }, props).then((result) => setTypedData((prev) => ({ ...prev, result })));
  }

  async function sendTransaction() {
    useRequest(async () => {
      const { current: web3 } = api;
      return web3.eth.sendSignedTransaction(txString).then((res) => res.blockHash);
    }, props).then(setTxResult);
  }

  return (
    <Container>
      <div className='title2'>1. Please select a evm compatible chain</div>
      <Dropdown id='dropdown-basic-button'>
        <Dropdown.Toggle variant='outline-light' id='dropdown-autoclose-true'>
          {selectedChain.name}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.keys(CHAINS).map((value) => {
            const key = value as keyof typeof CHAINS;
            return (
              <Dropdown.Item key={key} onClick={onSelectChain(CHAINS[key])}>
                {CHAINS[key].name}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
      <div className='title2'>2. Signing transaction</div>
      <Inputs btnTitle='Get Address' title='Get' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign'
        title='Sign Legacy Transfer'
        content={legacyTransfer.result}
        onClick={signTransaction<TxType.TRANSFER>(TxType.TRANSFER, false, legacyTransfer, setLegacyTransfer)}
        disabled={disabled}
        inputs={Object.keys(omit(legacyTransfer, 'result')).map((k) => ({
          xs: 1,
          value: legacyTransfer[k as keyof typeof legacyTransfer],
          onChange: (v) => setLegacyTransfer((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Legacy ERC20'
        content={legacyERC20.result}
        onClick={signTransaction<TxType.ERC20>(TxType.ERC20, false, legacyERC20, setLegacyERC20)}
        disabled={disabled}
        inputs={Object.keys(omit(legacyERC20, 'result')).map((k) => ({
          xs: 1,
          value: legacyERC20[k as keyof typeof legacyERC20],
          onChange: (v) => setLegacyERC20((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Legacy Smart Contract'
        content={legacyData.result}
        onClick={signTransaction<TxType.SMART_CONTRACT>(TxType.SMART_CONTRACT, false, legacyData, setLegacyData)}
        disabled={disabled}
        inputs={Object.keys(omit(legacyData, 'result')).map((k) => ({
          xs: 1,
          value: legacyData[k as keyof typeof legacyData],
          onChange: (v) => setLegacyData((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign EIP1559 Transfer'
        content={eip1559Transfer.result}
        onClick={signTransaction<TxType.TRANSFER>(TxType.TRANSFER, true, eip1559Transfer, setEIP1559Transfer)}
        disabled={disabled}
        inputs={Object.keys(omit(eip1559Transfer, 'result')).map((k) => ({
          xs: 1,
          value: eip1559Transfer[k as keyof typeof eip1559Transfer],
          onChange: (v) => setEIP1559Transfer((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign EIP1559 ERC20'
        content={eip1559ERC20.result}
        onClick={signTransaction<TxType.ERC20>(TxType.ERC20, true, eip1559ERC20, setEIP1559ERC20)}
        disabled={disabled}
        inputs={Object.keys(omit(eip1559ERC20, 'result')).map((k) => ({
          xs: 1,
          value: eip1559ERC20[k as keyof typeof eip1559ERC20],
          onChange: (v) => setEIP1559ERC20((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign EIP1559 Smart Contract'
        content={eip1559Data.result}
        onClick={signTransaction<TxType.SMART_CONTRACT>(TxType.SMART_CONTRACT, true, eip1559Data, setEIP1559Data)}
        disabled={disabled}
        inputs={Object.keys(omit(eip1559Data, 'result')).map((k) => ({
          xs: 1,
          value: eip1559Data[k as keyof typeof eip1559Data],
          onChange: (v) => setEIP1559Data((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Message'
        content={messageData.result}
        onClick={signMessage}
        disabled={disabled}
        inputs={[
          {
            value: messageData.message,
            onChange: (value) => setMessageData((prev) => ({ ...prev, message: value })),
            placeholder: 'message',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Typed Data'
        content={typedData.result}
        onClick={signTypedData}
        disabled={disabled}
        inputs={[
          {
            value: typedData.typedData,
            onChange: (value) => setTypedData((prev) => ({ ...prev, typedData: value })),
            placeholder: 'typed data',
          },
        ]}
      />
      <div className='title2'>3. Send Tx</div>
      <Inputs
        btnTitle='Send'
        title='Send Transaction'
        content={txResult}
        onClick={sendTransaction}
        disabled={disabled}
        inputs={[
          {
            xs: 4,
            value: txString,
            onChange: setTxString,
            placeholder: 'tx bytes',
          },
        ]}
      />
    </Container>
  );
};

export default CoinEVM;
