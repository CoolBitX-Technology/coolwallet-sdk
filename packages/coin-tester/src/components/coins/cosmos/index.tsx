import React from 'react';
import { Container } from 'react-bootstrap';
import omit from 'lodash/omit';
import { Transport } from '@coolwallet/core';
import { CurrencyDollarIcon } from '@heroicons/react/outline';
import CosmosSDK, { ChainProps, CHAIN } from '@coolwallet/cosmos';
import { CoinProps } from '@coolwallet/cosmos/lib/chain/base';
import CosmosClient from './client';
import Picker from '../../Picker';
import Inputs from '../../Inputs';
import { useAppId, useRequest } from '../../../utils/hooks';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

type ChainItem = {
  name: string;
  property: ChainProps;
  rpc_url: string;
};

type CoinItem = {
  name: string;
  property: CoinProps;
};

const CHAINS: Record<'ATOM' | 'KAVA' | 'THOR', ChainItem> = {
  ATOM: {
    name: 'Atom',
    property: CHAIN.ATOM,
    rpc_url: 'https://rest.cosmos.directory/cosmoshub',
  },
  KAVA: {
    name: 'Kava',
    property: CHAIN.KAVA,
    rpc_url: 'https://api.data.kava.io',
  },
  THOR: {
    name: 'ThorChain',
    property: CHAIN.THOR,
    rpc_url: 'https://thornode.ninerealms.com/',
  },
};

function TransformCoins(chain: ChainProps) {
  const chainCoins = chain.getCoins();
  return Object.keys(chainCoins).reduce<Record<string, CoinItem>>(
    (memo, key) => ({ ...memo, [key]: { name: key, property: chainCoins[key] } }),
    {}
  );
}

const Cosmos = (props: Props) => {
  const { appPrivateKey } = props;
  const transport = props.transport as Transport;
  const disabled = !transport || props.isLocked;

  const [selectedChain, setSelectedChain] = React.useState(CHAINS.ATOM);
  const [coins, setCoins] = React.useState(() => TransformCoins(selectedChain.property));
  const sdk = React.useRef(new CosmosSDK(selectedChain.property));
  const client = React.useRef(new CosmosClient(selectedChain.rpc_url));

  const [address, setAddress] = React.useState('');

  const [transferArgs, setTransferArgs] = React.useState({
    to: 'cosmos1gmezj8ws4467l4qxm7fs9a4gh60mygpf67vlmt',
    denom: Object.values(coins)[0],
    value: '0.000001',
    memo: 'CoolWallet',
    result: '',
  });

  const [delegateArgs, setDelegateArgs] = React.useState({
    validator: '',
    denom: Object.values(coins)[0],
    value: '0.000001',
    memo: '',
    result: '',
  });

  const [undelegateArgs, setUndelegateArgs] = React.useState({
    validator: '',
    denom: Object.values(coins)[0],
    value: '0.000001',
    memo: '',
    result: '',
  });

  const [withdrawArgs, setWithdrawArgs] = React.useState({
    validator: '',
    memo: '',
    result: '',
  });

  const [txString, setTxString] = React.useState('');
  const [txResult, setTxResult] = React.useState('');

  const setSelectedTransferArgsCoin = (denom: CoinItem) => {
    setTransferArgs((prev) => ({ ...prev, denom }));
  };

  const setSelectedDelegateArgsCoin = (denom: CoinItem) => {
    setDelegateArgs((prev) => ({ ...prev, denom }));
  };

  const setSelectedUndelegateArgsCoin = (denom: CoinItem) => {
    setDelegateArgs((prev) => ({ ...prev, denom }));
  };

  React.useEffect(() => {
    sdk.current = new CosmosSDK(selectedChain.property);
    client.current = new CosmosClient(selectedChain.rpc_url);
    const newCoins = TransformCoins(selectedChain.property);
    setCoins(newCoins);
    setTransferArgs((prev) => ({ ...prev, denom: Object.values(newCoins)[0] }));
    setDelegateArgs((prev) => ({ ...prev, denom: Object.values(newCoins)[0] }));
    setUndelegateArgs((prev) => ({ ...prev, denom: Object.values(newCoins)[0] }));
    setAddress('');
  }, [selectedChain]);

  const getAddress = () =>
    useRequest(async () => {
      const appId = useAppId();
      return sdk.current.getAddress(transport, appPrivateKey, appId, 0);
    }, props).then(setAddress);

  const signTransferTransaction = () =>
    useRequest(async () => {
      const appId = useAppId();
      const { account_number: accountNumber, sequence } = await client.current.getAccountInfo(address);
      const decimal = transferArgs.denom.property.getDecimal();
      const transaction = {
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction: {
          accountNumber,
          sequence,
          memo: transferArgs.memo,
          fromAddress: address,
          toAddress: transferArgs.to,
          coin: {
            denom: transferArgs.denom.property,
            amount: +transferArgs.value * 10 ** decimal,
          },
          fee: {
            denom: transferArgs.denom.property,
            amount: 2000,
            gas_limit: 200000,
          },
        },
      };
      console.log('Transaction: ', transaction);
      return sdk.current.signMsgSendTransaction(transaction);
    }, props).then((result) => setTransferArgs((prev) => ({ ...prev, result })));

  const signDelegateTransaction = () =>
    useRequest(async () => {
      const appId = useAppId();
      const { account_number: accountNumber, sequence } = await client.current.getAccountInfo(address);
      const decimal = delegateArgs.denom.property.getDecimal();
      const transaction = {
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction: {
          accountNumber,
          sequence,
          memo: delegateArgs.memo,
          delegatorAddress: address,
          validatorAddress: delegateArgs.validator,
          coin: {
            denom: delegateArgs.denom.property,
            amount: +delegateArgs.value * 10 ** decimal,
          },
          fee: {
            denom: delegateArgs.denom.property,
            amount: 5000,
            gas_limit: 200000,
          },
        },
      };
      return sdk.current.signMsgDelegateTransaction(transaction);
    }, props).then((result) => setDelegateArgs((prev) => ({ ...prev, result })));

  const signUndelegateTransaction = () =>
    useRequest(async () => {
      const appId = useAppId();
      const { account_number: accountNumber, sequence } = await client.current.getAccountInfo(address);
      const decimal = undelegateArgs.denom.property.getDecimal();
      const transaction = {
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction: {
          accountNumber,
          sequence,
          memo: undelegateArgs.memo,
          delegatorAddress: address,
          validatorAddress: undelegateArgs.validator,
          coin: {
            denom: undelegateArgs.denom.property,
            amount: +undelegateArgs.value * 10 ** decimal,
          },
          fee: {
            denom: undelegateArgs.denom.property,
            amount: 5000,
            gas_limit: 200000,
          },
        },
      };
      return sdk.current.signMsgUndelegateTransaction(transaction);
    }, props).then((result) => setUndelegateArgs((prev) => ({ ...prev, result })));

  const signWithdrawTransaction = () =>
    useRequest(async () => {
      const appId = useAppId();
      const { account_number: accountNumber, sequence } = await client.current.getAccountInfo(address);
      const transaction = {
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction: {
          accountNumber,
          sequence,
          memo: withdrawArgs.memo,
          delegatorAddress: address,
          validatorAddress: withdrawArgs.validator,
          fee: {
            denom: selectedChain.property.getNativeCoin().getDenom(),
            amount: 5000,
            gas_limit: 200000,
          },
        },
      };
      return sdk.current.signMsgWithdrawDelegatorRewardTransaction(transaction);
    }, props).then((result) => setWithdrawArgs((prev) => ({ ...prev, result })));

  const sendTransaction = () =>
    useRequest(() => client.current.broadcastTransaction(txString), props).then(setTxResult);

  return (
    <Container>
      <div className='title2'>1. Please select a Cosmos SDK compatible chain</div>
      <Picker selected={selectedChain} items={CHAINS} onSelectItem={setSelectedChain} />
      <div className='title2'>2. Signing transaction</div>
      <Inputs btnTitle='Get Address' title='Get' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign'
        title='Sign MsgSend Transfer'
        content={transferArgs.result}
        disabled={disabled}
        onClick={signTransferTransaction}
        inputs={Object.keys(omit(transferArgs, ['result', 'denom'])).map((k) => ({
          xs: 1,
          value: transferArgs[k as keyof Omit<typeof transferArgs, 'denom' | 'result'>],
          onChange: (v) => setTransferArgs((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
        elements={[
          {
            xs: 1,
            element: (
              <Picker
                icon={<CurrencyDollarIcon className='icon' />}
                key='transferCoinPicker'
                selected={transferArgs.denom}
                items={coins}
                onSelectItem={setSelectedTransferArgsCoin}
              />
            ),
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign MsgDelegate Transfer'
        content={delegateArgs.result}
        disabled={disabled}
        onClick={signDelegateTransaction}
        inputs={Object.keys(omit(delegateArgs, ['result', 'denom'])).map((k) => ({
          xs: 1,
          value: delegateArgs[k as keyof Omit<typeof delegateArgs, 'denom'>],
          onChange: (v) => setDelegateArgs((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
        elements={[
          {
            xs: 1,
            element: (
              <Picker
                icon={<CurrencyDollarIcon className='icon' />}
                key='delegateCoinPicker'
                selected={delegateArgs.denom}
                items={coins}
                onSelectItem={setSelectedDelegateArgsCoin}
              />
            ),
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign MsgUndelegate Transfer'
        content={undelegateArgs.result}
        disabled={disabled}
        onClick={signUndelegateTransaction}
        inputs={Object.keys(omit(undelegateArgs, ['result', 'denom'])).map((k) => ({
          xs: 1,
          value: undelegateArgs[k as keyof Omit<typeof undelegateArgs, 'denom'>],
          onChange: (v) => setUndelegateArgs((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
        elements={[
          {
            xs: 1,
            element: (
              <Picker
                icon={<CurrencyDollarIcon className='icon' />}
                key='undelegateCoinPicker'
                selected={undelegateArgs.denom}
                items={coins}
                onSelectItem={setSelectedUndelegateArgsCoin}
              />
            ),
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign MsgWithdraw Transfer'
        content={withdrawArgs.result}
        disabled={disabled}
        onClick={signWithdrawTransaction}
        inputs={Object.keys(omit(withdrawArgs, ['result', 'denom'])).map((k) => ({
          xs: 1,
          value: withdrawArgs[k as keyof Omit<typeof withdrawArgs, 'denom'>],
          onChange: (v) => setWithdrawArgs((prev) => ({ ...prev, [k]: v })),
          placeholder: k,
        }))}
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

export default Cosmos;
