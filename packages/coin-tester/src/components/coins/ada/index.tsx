/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { useState } from 'react';
import { ButtonGroup, Container, ToggleButton } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import ADA, { TxTypes } from '@coolwallet/ada';
import { NoInput, OneInput } from '../../../utils/componentMaker';
import {
  setTestnetApi,
  getLatestBlock,
  getAddressInfo,
  getLatestProtocolParameters,
  getUtxos,
  getStakePools,
  getRegistrationHistory,
  getDelegationHistory,
  getAccountInfo,
} from './utils/api';

import TxField from './txField';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

// const txWithoutFee = {
//   addrIndexes: [0],
//   inputs: [{
//     txId: '0x8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
//     index: 0,
//   }],
//   output: {
//     address: 'addr1qxn5anyxv6dhtl57yvgvpp25emy0pc9wenqzzemxktyr94ahaaap0f0tn4wxaqsydnzty2m0y4gfeu39ckjvsjycs4nssxhc25',
//     amount: 10523059,
//   },
//   change: {
//     address: 'addr1q8wyqhxud34ejxjm5tyj74qeuttr7z9vnjuxy6upyn2w8ryau3fvcuaywgncvz89verfyy24vverl9pw2h5uwv30aq9qm6xj7s',
//     amount: 360000,
//   },
//   ttl: '0x641a5',
// };

function CoinAda(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const ada = new ADA();

  const appId = localStorage.getItem('appId');
  if (!appId) throw new Error('No Appid stored, please register!');

  const confirmCB = () => {
    alert('Please confirm your info on card');
  };

  const authorizedCB = () => {
    alert('Transaction has authorized and signed');
  };

  const handleState = async (request: () => Promise<any>, handleResponse: (response: any) => void) => {
    props.setIsLocked(true);
    try {
      const response = await request();
      handleResponse(response);
    } catch (error: any) {
      handleResponse(error.message);
      console.error(error);
    } finally {
      props.setIsLocked(false);
    }
  };

  const options = {
    transport: transport!,
    appPrivateKey,
    appId,
    confirmCB,
    authorizedCB,
  };

  // Address

  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('');

  // On chain data

  const [info, setInfo] = useState('');
  const [block, setBlock] = useState('');
  const [protocolParameters, setProtocolParameters] = useState('');
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [utxos, setUtxos] = useState('');
  const [stakePools, setStakePools] = useState('');
  const [stakeAddress, setStakeAddress] = useState('');
  const [registrationHistory, setRegistrationHistory] = useState('');
  const [delegationHistory, setDelegationHistory] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [isTestNet, setTestNet] = useState(false);

  setTestnetApi(isTestNet);

  const getAddress = async () => {
    handleState(async () => {
      // const address = await ada.getAddress(
      //   transport!,
      //   appPrivateKey,
      //   appId,
      //   addressIndex,
      // );
      const acckey = await ada.getAccountPubKey(transport!, appPrivateKey, appId);
      const address = ada.getAddressByAccountKey(acckey, addressIndex, isTestNet);
      //  to.addressIndex = from.addressIndex == 0 ? 1 : 0;
      //  change.addressIndex = from.addressIndex
      const toIndex = addressIndex === 0 ? 1 : 0;
      const to = ada.getAddressByAccountKey(acckey, toIndex, isTestNet);

      {
        const value = [...transferTxValues];
        value[2] = address;
        value[5] = to;
        setTransferTxValues(value);
      }
      {
        const value = [...stakeRegisterValues];
        value[2] = address;
        setStakeRegisterValues(value);
      }
      {
        const value = [...stakeDelegateValues];
        value[2] = address;
        setStakeDelegateValues(value);
      }
      {
        const value = [...stakeDeregisterValues];
        value[2] = address;
        setStakeDeregisterValues(value);
      }
      {
        const value = [...stakeWithdrawValues];
        value[2] = address;
        setStakeWithdrawValues(value);
      }

      return address;
    }, setAddress);
  };

  const clickToGetAddressInfo = async () => {
    handleState(async () => {
      if (address === '') return 'please getAddress in advance';
      const result = await getAddressInfo(address);
      {
        setStakeAddress(result.stake_address);
      }
      return JSON.stringify(result);
    }, setInfo);
  };

  const clickToGetLatestBlock = async () => {
    handleState(async () => {
      const latestBlock = await getLatestBlock();
      const ttl = (latestBlock.slot + 400).toString(10);
      {
        const value = [...transferTxValues];
        value[4] = ttl;
        setTransferTxValues(value);
      }
      {
        const value = [...stakeRegisterValues];
        value[4] = ttl;
        setStakeRegisterValues(value);
      }
      {
        const value = [...stakeDelegateValues];
        value[4] = ttl;
        setStakeDelegateValues(value);
      }
      {
        const value = [...stakeDeregisterValues];
        value[4] = ttl;
        setStakeDeregisterValues(value);
      }
      {
        const value = [...stakeWithdrawValues];
        value[4] = ttl;
        setStakeWithdrawValues(value);
      }
      return JSON.stringify(latestBlock);
    }, setBlock);
  };

  const clickToGetLatestProtocolParameters = async () => {
    handleState(async () => {
      const latestProtocolParameters = await getLatestProtocolParameters();
      setA(latestProtocolParameters.min_fee_a);
      setB(latestProtocolParameters.min_fee_b);
      return JSON.stringify(latestProtocolParameters);
    }, setProtocolParameters);
  };

  const clickToGetUtxos = async () => {
    handleState(async () => {
      if (address === '') return 'please get address in advance';
      const utxos = await getUtxos(address);
      return JSON.stringify(utxos);
    }, setUtxos);
  };

  const clickToGetStakePools = async () => {
    handleState(async () => {
      const pools = await getStakePools();
      return JSON.stringify(pools);
    }, setStakePools);
  };

  const clickToGetRegistrationHistory = async () => {
    handleState(async () => {
      if (stakeAddress === '') return 'please get address info in advance';
      const history = await getRegistrationHistory(stakeAddress);
      return JSON.stringify(history);
    }, setRegistrationHistory);
  };

  const clickToGetDelegationHistory = async () => {
    handleState(async () => {
      if (stakeAddress === '') return 'please get address info in advance';
      const history = await getDelegationHistory(stakeAddress);
      return JSON.stringify(history);
    }, setDelegationHistory);
  };

  const clickToGetAccountInfo = async () => {
    handleState(async () => {
      if (stakeAddress === '') return 'please get address info in advance';
      const accountInfo = await getAccountInfo(stakeAddress);
      return JSON.stringify(accountInfo);
    }, setAccountInfo);
  };

  // Transfer

  const transferTxKeys = [
    'Transaction ID',
    'UTXO Index',
    'Change Address',
    'Change Amount',
    'Time to Live',
    'To Address',
    'To Amount',
  ];

  const [transferTxValues, setTransferTxValues] = useState(['', '0', '', '', '0', '', '0']);

  // Stake Register

  const stakeRegisterKeys = ['Transaction ID', 'UTXO Index', 'Change Address', 'Change Amount', 'Time to Live'];
  const [stakeRegisterValues, setStakeRegisterValues] = useState(['', '0', '', '0', '0']);

  // Stake Delegate

  const stakeDelegateKeys = [
    'Transaction ID',
    'UTXO Index',
    'Change Address',
    'Change Amount',
    'Time to Live',
    'Pool Id',
  ];
  const [stakeDelegateValues, setStakeDelegateValues] = useState(['', '0', '', '0', '0', '']);

  // Stake Deregister

  const stakeDeregisterKeys = ['Transaction ID', 'UTXO Index', 'Change Address', 'Change Amount', 'Time to Live'];
  const [stakeDeregisterValues, setStakeDeregisterValues] = useState(['', '0', '', '0', '0']);

  // Stake Withdraw

  const stakeWithdrawKeys = [
    'Transaction ID',
    'UTXO Index',
    'Change Address',
    'Change Amount',
    'Time to Live',
    'Withdraw Amount',
  ];
  const [stakeWithdrawValues, setStakeWithdrawValues] = useState(['', '0', '', '0', '0', '0']);

  return (
    <Container>
      <ButtonGroup>
        <ToggleButton
          key={0}
          type='radio'
          value='main'
          variant={isTestNet ? 'outline-primary' : 'primary'}
          checked={!isTestNet}
          onClick={() => {
            console.log('\u001b[32m' + 'main' + '\u001b[0m');
            setTestNet(false);
          }}
        >
          Main Net
        </ToggleButton>
        <ToggleButton
          key={1}
          type='radio'
          value='test'
          variant={isTestNet ? 'primary' : 'outline-primary'}
          checked={isTestNet}
          onClick={() => {
            console.log('\u001b[32m' + 'test' + '\u001b[0m');
            setTestNet(true);
          }}
        >
          Test Net
        </ToggleButton>
      </ButtonGroup>
      <div className='title2'>0. Address</div>
      <OneInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
        btnName='Get from SDK'
        value={`${addressIndex}`}
        setNumberValue={setAddressIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <div className='title2'>1. On chain data</div>
      <NoInput
        title='Get Address Info'
        content={info}
        onClick={clickToGetAddressInfo}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Latest Block'
        content={block}
        onClick={clickToGetLatestBlock}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Latest Protocol Parameters'
        content={protocolParameters}
        onClick={clickToGetLatestProtocolParameters}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput title='Get UTXOs' content={utxos} onClick={clickToGetUtxos} disabled={disabled} btnName='Get from API' />
      <NoInput
        title='Get Stake Pools'
        content={stakePools}
        onClick={clickToGetStakePools}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Registration History'
        content={registrationHistory}
        onClick={clickToGetRegistrationHistory}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Delegation History'
        content={delegationHistory}
        onClick={clickToGetDelegationHistory}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Account Info'
        content={accountInfo}
        onClick={clickToGetAccountInfo}
        disabled={disabled}
        btnName='Get from API'
      />

      <div className='title2'>2. Transfer Tx</div>
      <TxField
        txType={TxTypes.Transfer}
        txKeys={transferTxKeys}
        txValues={transferTxValues}
        setTxValues={setTransferTxValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />

      <div className='title2'>3. Stake Register & Delegate Tx</div>
      <TxField
        txType={TxTypes.StakeRegisterAndDelegate}
        txKeys={stakeDelegateKeys}
        txValues={stakeDelegateValues}
        setTxValues={setStakeDelegateValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />

      <div className='title2'>3A. Stake Register Tx</div>
      <TxField
        txType={TxTypes.StakeRegister}
        txKeys={stakeRegisterKeys}
        txValues={stakeRegisterValues}
        setTxValues={setStakeRegisterValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />

      <div className='title2'>3B. Stake Delegate Tx</div>
      <TxField
        txType={TxTypes.StakeDelegate}
        txKeys={stakeDelegateKeys}
        txValues={stakeDelegateValues}
        setTxValues={setStakeDelegateValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />

      <div className='title2'>4. Stake Deregister Tx</div>
      <TxField
        txType={TxTypes.StakeDeregister}
        txKeys={stakeDeregisterKeys}
        txValues={stakeDeregisterValues}
        setTxValues={setStakeDeregisterValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />

      <div className='title2'>5. Stake Withdraw Tx</div>
      <TxField
        txType={TxTypes.StakeWithdraw}
        txKeys={stakeWithdrawKeys}
        txValues={stakeWithdrawValues}
        setTxValues={setStakeWithdrawValues}
        a={a}
        b={b}
        utxos={utxos}
        handleState={handleState}
        options={options}
        disabled={disabled}
        ada={ada}
        addrIndex={addressIndex}
        isTestNet={isTestNet}
      />
    </Container>
  );
}

export default CoinAda;
