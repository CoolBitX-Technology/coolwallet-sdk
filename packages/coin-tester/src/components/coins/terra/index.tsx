import { useState } from 'react';
import { Container, Row, Col, Dropdown, Form, Badge, Button } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import Terra, {
  CHAIN_ID,
  DENOMTYPE,
  DENOMTYPE_CLASSIC,
  TOKENTYPE,
  TOKENTYPEDEV,
  TOKENTYPE_CLASSIC,
} from '@coolwallet/terra';
import BigNumber from 'bignumber.js';
import cosmos, { Testnet, Mainnet, Classic } from './cosmos';
import { AddressBalance, AddressDelegation } from './cosmos/response';
import { useAppId } from '../../../utils/hooks';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import Inputs from '../../Inputs';
import AmountAdjustment from './components/AmountAdjustment';

type ArrayOf<U> = U extends Array<infer P> ? P : never;

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appId: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const DEFAULT_BLIND_ARGS = {
  toAddress: '',
  coin: {
    denom: DENOMTYPE.LUNA,
    amount: '0.000001',
  },
};

//CqEBCo4BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm4KLHRlcnJhMWNqMjJybHNwZGcwdDU4eTc5cW5rOTc0cWhjOWVnZWE0ZWtyOHhzEix0ZXJyYTFhbW1sbmVtcWs4cXh4YzdhdDM0emNuOTRzcGd1Mm51eWt0ZHZtbBoQCgV1bHVuYRIHMTAwMDAwMBIOdGVzdCBzaWduYXR1cmUSagpRCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA0KrQmH8A4KMYc+36u6QM/Tq/Foo87Bk+W9XjGL1ANlZEgQKAggBGJQBEhUKDwoFdWx1bmESBjUwMDAwMBCImAUaQPTAQuO3aEQxYjVyCMd6x4yyXmczvRzrHMBLXRva6XRMU10jhUmoFIkDq8uV3bqKCYsSNngkhRiHpcP0A/Bfhxk=

function CoinTerra(props: Props) {
  const terra = new Terra();
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(CHAIN_ID.TEST);
  const [netLabel, setNetLabel] = useState('Test Net');
  const [txUrl, setTxUrl] = useState('https://finder.terra.money/testnet/tx/');
  const [cosmosjs, setNetwork] = useState(Testnet);
  const [balances, setBalances] = useState<AddressBalance[]>([]);
  const [validators, setValidators] = useState<AddressDelegation[]>([]);
  const [currentDenomType, setCurrentDenomType] = useState(DENOMTYPE);

  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  //const [to, setTo] = useState('terra1seckusy09dzgtyxtz9xqzg2x7xfgtf0lhyzmf9');
  const [to, setTo] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv'); // Testnet - Wallet
  const [denom, setDenom] = useState(currentDenomType.LUNA);
  const [feeAmount, setFeeAmount] = useState('0.001');
  const [feeDenom, setFeeDenom] = useState(currentDenomType.LUNA);

  const [delegateValue, setDelegateValue] = useState('0');
  const [signedDelegate, setSignedDelegate] = useState('');
  //const [delegateValidator, setDelegateValidator] = useState('terravaloper1ygwhuksjq3nymd9n8kmceaxd3vxv97u7ja33aj'); // Mainnet - FreshLUNA.com
  const [delegateValidator, setDelegateValidator] = useState('terravaloper1gtw2uxdkdt3tvq790ckjz8jm8qgwkdw3uptstn'); // Testnet - Terran One
  const [delegateFeeAmount, setDelegateFeeAmount] = useState('0.006');
  const [delegateFeeDenom, setDelegateFeeDenom] = useState(currentDenomType.LUNA);

  const [undelegateValue, setUndelegateValue] = useState('0');
  const [signedUndelegate, setSignedUndelegate] = useState('');
  const [undelegateValidator, setUndelegateValidator] = useState('terravaloper1gtw2uxdkdt3tvq790ckjz8jm8qgwkdw3uptstn');
  const [undelegateFeeAmount, setUndelegateFeeAmount] = useState('0.008');
  const [undelegateFeeDenom, setUndelegateFeeDenom] = useState(currentDenomType.LUNA);

  const [signedWithdraw, setSignedWithdraw] = useState('');
  const [withdrawValidator, setWithdrawValidator] = useState('terravaloper1gtw2uxdkdt3tvq790ckjz8jm8qgwkdw3uptstn');
  const [withdrawFeeAmount, setWithdrawFeeAmount] = useState('0.005');
  const [withdrawFeeDenom, setWithdrawFeeDenom] = useState(currentDenomType.LUNA);

  const [swapValue, setSwapValue] = useState('0');
  const [signedSwap, setSignedSwap] = useState('');
  //const [swapAddress, setSwapAddress] = useState('terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6'); // mainnet luna2ust
  const [swapAddress, setSwapAddress] = useState('terra1dyw9wrmqd6z4jw69jf6e77ynlckmk2305ny8w9wtmq6xg02yvphqqdg3dr'); // testnet luna2usdt
  const [swapDenom, setSwapDenom] = useState(currentDenomType.LUNA);
  const [swapFeeAmount, setSwapFeeAmount] = useState('0.003');
  const [swapFeeDenom, setSwapFeeDenom] = useState(currentDenomType.LUNA);

  const ancMain = ''; // mainnet
  const ancTest = 'terra1dwtyvyrkw0s7e0rucwgfwypr4m4emshvsf56nmjn3gertd2jwdzsjt33nl'; // testnet USDT
  const ancClassic = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76'; // classic
  const [ancValue, setAncValue] = useState('0');
  const [signedSendAnc, setSignedSendAnc] = useState('');
  const [ancAddress, setAncAddress] = useState(ancTest);
  const [ancRecipient, setAncRecipient] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv');
  const [ancFeeAmount, setAncFeeAmount] = useState('0.0015');
  const [ancFeeDenom, setAncFeeDenom] = useState(currentDenomType.LUNA);

  const [cw20TokenType, setCw20TokenType] = useState(TOKENTYPEDEV);
  const [cw20Value, setCw20Value] = useState('0');
  const [cw20SignedSend, setCw20SignedSend] = useState('');
  const [cw20Token, setCw20Token] = useState(TOKENTYPEDEV[0]);
  const [cw20Recipient, setCw20Recipient] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv');
  //const [cw20FeeAmount, setCw20FeeAmount] = useState(0.0057); // bLuna
  const [cw20FeeAmount, setCw20FeeAmount] = useState('0.0015');
  const [cw20FeeDenom, setCw20FeeDenom] = useState(currentDenomType.LUNA);
  const [blindArguments, setBlindArguments] = useState([DEFAULT_BLIND_ARGS]);
  const [blindSignedSend, setBlindSignedSend] = useState('');
  const [blindFeeDenom, setBlindFeeDenom] = useState(currentDenomType.LUNA);
  const [blindFeeAmount, setBlindFeeAmount] = useState('0.001');

  const [txResult, setTxResult] = useState('');
  const [txString, setTxString] = useState('');

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const appId = useAppId();

  const handleState = async (request: () => Promise<string>, handleResponse: (response: string) => void) => {
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

  const updateAccStatus = (_network: typeof cosmos, _address: string) => {
    _network.getBalance(_address).then((_balances: AddressBalance[]) => {
      setBalances(_balances);
    });
    _network.getValidators(_address).then((_validators: AddressDelegation[]) => {
      setValidators(_validators);
    });
  };

  const handleNetChange = (e: string | null) => {
    let newNetwork;
    if ('Test Net' === e) {
      newNetwork = Testnet;
      setNetwork(Testnet);
      setChainId(CHAIN_ID.TEST);
      setCurrentDenomType(DENOMTYPE);
      setAncAddress(ancTest);
      setTxUrl('https://finder.terra.money/testnet/tx/');
      setCw20TokenType(TOKENTYPEDEV);
      setCw20Token(TOKENTYPEDEV[0]);
    } else if ('Classic' === e) {
      newNetwork = Classic;
      setNetwork(Classic);
      setChainId(CHAIN_ID.CLASSIC);
      setCurrentDenomType(DENOMTYPE_CLASSIC);
      setAncAddress(ancClassic);
      setTxUrl('https://finder.terra.money/classic/tx/');
      setCw20TokenType(TOKENTYPE_CLASSIC);
      setCw20Token(TOKENTYPE_CLASSIC[0]);
    } else {
      newNetwork = Mainnet;
      setNetwork(Mainnet);
      setChainId(CHAIN_ID.MAIN);
      setCurrentDenomType(DENOMTYPE);
      setAncAddress(ancMain);
      setTxUrl('https://finder.terra.money/mainnet/tx/');
      setCw20TokenType(TOKENTYPE);
      setCw20Token(TOKENTYPE[0]);
    }
    setNetLabel(e ?? '');
    if (address.length > 0) {
      updateAccStatus(newNetwork, address);
    }
  };

  const getAddress = async () => {
    handleState(async () => {
      const tAdd = await terra.getAddress(transport!, appPrivateKey, appId, 0);

      updateAccStatus(cosmosjs, tAdd);

      return tAdd;
    }, setAddress);
  };

  const sendTransaction = async () => {
    const sendTx = await cosmosjs.broadcastGRPC(txString);
    console.log('sendTx: ' + sendTx);
    setTxResult(txUrl + sendTx.slice(1, -1));
  };

  const signSendTransaction = async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      fromAddress: address,
      toAddress: to,
      coin: {
        denom: denom,
        amount: new BigNumber(value).multipliedBy(1000000).toNumber(),
      },
      fee: {
        gas_limit: 85000,
        denom: feeDenom,
        amount: new BigNumber(feeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'test signature',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };
    console.log('Sign Param:', signTxData);
    const signature = await terra.signTransferTransaction(signTxData);
    setSignedTransaction(signature);
    updateAccStatus(cosmosjs, address);
  };

  const signDelegate = async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      delegatorAddress: address,
      validatorAddress: delegateValidator,
      coin: {
        amount: new BigNumber(delegateValue).multipliedBy(1000000).toNumber(),
      },
      fee: {
        gas_limit: 520000,
        denom: feeDenom,
        amount: new BigNumber(delegateFeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'test signature',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };

    console.log('Sign Param:', transaction);

    const signature = await terra.signDelegateTransaction(signTxData);
    setSignedDelegate(signature);
    updateAccStatus(cosmosjs, address);
  };

  const signUndelegate = async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      delegatorAddress: address,
      validatorAddress: undelegateValidator,
      coin: {
        amount: new BigNumber(undelegateValue).multipliedBy(1000000).toNumber(),
      },
      fee: {
        gas_limit: 550000,
        denom: undelegateFeeDenom,
        amount: new BigNumber(undelegateFeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'Undelegate test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };
    console.log('Sign Param:', transaction);
    const signature = await terra.signUndelegateTransaction(signTxData);
    setSignedUndelegate(signature);
    updateAccStatus(cosmosjs, address);
  };

  const signWithdraw = async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      delegatorAddress: address,
      validatorAddress: withdrawValidator,
      fee: {
        gas_limit: 450000,
        denom: withdrawFeeDenom,
        amount: new BigNumber(withdrawFeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'withdraw test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };
    const signature = await terra.signWithdrawTransaction(signTxData);
    setSignedWithdraw(signature);
    updateAccStatus(cosmosjs, address);
  };

  const signSmartSwap = async () => {
    // based on the structure of the smart contract- execute_msg may be different and funds may be undefined
    const executeMsgObj = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: swapDenom.unit,
            },
          },
          amount: new BigNumber(swapValue).multipliedBy(1000000).toString(),
        },
      },
    };
    const { sequence, account_number } = await cosmosjs.getSequence(address);

    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      senderAddress: address,
      contractAddress: swapAddress,
      execute_msg: executeMsgObj,
      funds: {
        denom: swapDenom,
        amount: new BigNumber(swapValue).multipliedBy(1000000).toNumber(),
      },
      fee: {
        gas_limit: 400000,
        denom: swapFeeDenom,
        amount: new BigNumber(swapFeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'Swap test',
    };

    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };
    const signature = await terra.signMsgExecuteContractTransaction(signTxData);
    setSignedSwap(signature);
  };

  const signSmartSendAnc = async () => {
    // based on the structure of the smart contract- execute_msg may be different and funds may be undefined
    const executeMsgObj = {
      transfer: {
        amount: new BigNumber(ancValue).multipliedBy(1000000).toString(),
        recipient: ancRecipient,
      },
    };

    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      senderAddress: address,
      contractAddress: ancAddress,
      execute_msg: executeMsgObj,
      fee: {
        gas_limit: 200000,
        denom: ancFeeDenom,
        amount: new BigNumber(ancFeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'Send anc test',
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };

    console.log('Sign Param:', transaction);

    const signature = await terra.signMsgExecuteContractTransaction(signTxData);
    setSignedSendAnc(signature);
  };

  const signCw20Send = async () => {
    const executeMsgObj = {
      transfer: {
        amount: new BigNumber(cw20Value).multipliedBy(1000000).toString(),
        recipient: cw20Recipient,
      },
    };

    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      senderAddress: address,
      contractAddress: cw20Token.contractAddress,
      execute_msg: executeMsgObj,
      fee: {
        gas_limit: 120000,
        denom: cw20FeeDenom,
        amount: new BigNumber(cw20FeeAmount).multipliedBy(1000000).toNumber(),
      },
      memo: 'Send cw20 test',
      option: {
        info: {
          symbol: 'ANC',
          decimals: '6',
        },
      },
    };
    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };

    console.log('Sign Param:', transaction);

    const signature = await terra.signMsgCW20Transaction(signTxData);
    setCw20SignedSend(signature);
  };

  const signBlindTransaction = async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId,
      accountNumber: account_number,
      sequence,
      msgs: blindArguments.map((b) => ({
        '@type': '/cosmos.bank.v1beta1.MsgSend',
        amount: [
          {
            amount: new BigNumber(b.coin.amount).multipliedBy(1000000).toString(), // transaction amount,
            denom: b.coin.denom.unit,
          },
        ],
        from_address: address,
        to_address: b.toAddress,
      })),
      fee: {
        amount: [{ amount: new BigNumber(blindFeeAmount).multipliedBy(1000000).toString(), denom: blindFeeDenom.unit }],
        gas_limit: '200000',
      },
      memo: 'test multiple signature',
    };

    const signTxData = {
      appPrivateKey: props.appPrivateKey,
      appId,
      addressIndex: 0,
      transaction,
      transport: transport!,
    };
    const signature = await terra.signTransaction(signTxData);
    setBlindSignedSend(signature);
  };

  return (
    <Container>
      <div className='title2'>Support: Normal transfer, Stacking, Smart Contract, and CW20 Token Transfer</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={3} md={1}>
            <Dropdown onSelect={handleNetChange}>
              <Dropdown.Toggle variant='danger'>{netLabel}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey='Test Net'>Test Net</Dropdown.Item>
                <Dropdown.Item eventKey='Main Net'>Main Net</Dropdown.Item>
                <Dropdown.Item eventKey='Classic'>Classic</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col>
            {balances.map(function (balance) {
              return (
                <Badge bg='secondary' key={balance.denom} style={{ margin: '0 10px' }}>
                  {balance.amount} {balance.denom}
                </Badge>
              );
            })}
          </Col>
        </Row>
      }
      <TwoInputs
        title='Normal Transfer'
        content={signedTransaction}
        onClick={signSendTransaction}
        disabled={disabled}
        btnName='Sign'
        value={value}
        setValue={setValue}
        placeholder='value'
        inputSize={1}
        value2={to}
        setValue2={setTo}
        placeholder2='to'
        inputSize2={3}
      />
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={2} />
          <AmountAdjustment hideAmount title='Coin' denomType={currentDenomType} denom={denom} setDenom={setDenom} />
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={feeDenom}
            amount={feeAmount}
            setDenom={setFeeDenom}
            setAmount={setFeeAmount}
          />
        </Row>
      }
      {
        <TwoInputs
          title='Delegate'
          content={signedDelegate}
          onClick={signDelegate}
          disabled={disabled}
          btnName='Delegate'
          value={delegateValue}
          setValue={setDelegateValue}
          placeholder='delegateValue'
          inputSize={1}
          value2={delegateValidator}
          setValue2={setDelegateValidator}
          placeholder2='delegateValidator'
          inputSize2={3}
        />
      }
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={5} />
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={delegateFeeDenom}
            amount={delegateFeeAmount}
            setDenom={setDelegateFeeDenom}
            setAmount={setDelegateFeeAmount}
          />
        </Row>
      }
      {validators.length > 0 ? (
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={2}>Validators:</Col>
          <Col xs={8}>
            {validators.map(function (validator) {
              return (
                <Badge bg='success' key={validator.validator_address} style={{ margin: '0 10px' }}>
                  {validator.validator_address} = {validator.amount}
                  {validator.denom}
                </Badge>
              );
            })}
          </Col>
        </Row>
      ) : (
        <></>
      )}
      {
        <TwoInputs
          title='Undelegate'
          content={signedUndelegate}
          onClick={signUndelegate}
          disabled={disabled}
          btnName='Undelegate'
          value={undelegateValue}
          setValue={setUndelegateValue}
          placeholder='undelegateValue'
          inputSize={1}
          value2={undelegateValidator}
          setValue2={setUndelegateValidator}
          placeholder2='undelegateValidator'
          inputSize2={3}
        />
      }
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={5} />
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={undelegateFeeDenom}
            amount={undelegateFeeAmount}
            setDenom={setUndelegateFeeDenom}
            setAmount={setUndelegateFeeAmount}
          />
        </Row>
      }
      {
        <OneInput
          title='Withdraw'
          content={signedWithdraw}
          onClick={signWithdraw}
          disabled={disabled}
          btnName='Withdraw'
          value={withdrawValidator}
          setValue={setWithdrawValidator}
          placeholder='withdrawValidator'
          inputSize={4}
        />
      }
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={5} />
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={withdrawFeeDenom}
            amount={withdrawFeeAmount}
            setDenom={setWithdrawFeeDenom}
            setAmount={setWithdrawFeeAmount}
          />
        </Row>
      }
      {
        <TwoInputs
          title='Smart Contract: Swap Luna to UST'
          content={signedSwap}
          onClick={signSmartSwap}
          disabled={disabled}
          btnName='Execute'
          value={swapValue}
          setValue={setSwapValue}
          placeholder='swapValue'
          inputSize={1}
          value2={swapAddress}
          setValue2={setSwapAddress}
          placeholder2='swapAddress'
          inputSize2={3}
        />
      }
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={2} />
          <AmountAdjustment title='Funds' hideAmount denomType={currentDenomType} denom={swapDenom} setDenom={setSwapDenom} />
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={swapFeeDenom}
            amount={swapFeeAmount}
            setDenom={setSwapFeeDenom}
            setAmount={setSwapFeeAmount}
          />
        </Row>
      }
      {
        <TwoInputs
          title='Smart Contract: ANC Transfer'
          content={signedSendAnc}
          onClick={signSmartSendAnc}
          disabled={disabled}
          btnName='Execute'
          value={ancValue}
          setValue={setAncValue}
          placeholder='ancValue'
          inputSize={1}
          value2={ancRecipient}
          setValue2={setAncRecipient}
          placeholder2='ancRecipient'
          inputSize2={3}
        />
      }
      <Row style={{ marginBottom: '15px' }}>
        <Col xs={5} />
        <AmountAdjustment
          title='Fee'
          denomType={currentDenomType}
          denom={ancFeeDenom}
          amount={ancFeeAmount}
          setDenom={setAncFeeDenom}
          setAmount={setAncFeeAmount}
        />
      </Row>
      {
        <TwoInputs
          title='CW20 Transfer'
          content={cw20SignedSend}
          onClick={signCw20Send}
          disabled={disabled}
          btnName='Sign'
          value={cw20Value}
          setValue={setCw20Value}
          placeholder='cw20Value'
          inputSize={1}
          value2={cw20Recipient}
          setValue2={setCw20Recipient}
          placeholder2='cw20Recipient'
          inputSize2={3}
        />
      }
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col xs={2} md={{ span: 1, offset: 2 }}>
            Token:
          </Col>
          <Col xs={2}>
            <Dropdown
              onSelect={(e) => {
                setCw20Token(cw20TokenType[+(e ?? 0)]);
              }}
            >
              <Dropdown.Toggle variant='success'>{cw20Token.name}</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.values(cw20TokenType).map(function (token: ArrayOf<typeof TOKENTYPE>, index) {
                  return (
                    <Dropdown.Item key={token.name} eventKey={index}>
                      {token.name}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={cw20FeeDenom}
            setDenom={setCw20FeeDenom}
            amount={cw20FeeAmount}
            setAmount={setCw20FeeAmount}
          />
        </Row>
      }

      <div className='title2'>Send Multi MsgSend</div>
      <Container className='function-component'>
        {blindArguments.map((b, i) => (
          <Row key={'' + i + ''} style={{ marginBottom: '15px' }}>
            <Col className='input-col' xs={6}>
              <Form.Control
                onChange={(event) => {
                  setBlindArguments((prev) =>
                    prev.map((k, index) => {
                      if (index === i) {
                        return {
                          ...k,
                          toAddress: event.target.value,
                        };
                      }
                      return k;
                    })
                  );
                }}
                value={b.toAddress}
                placeholder={'To Address'}
              />
            </Col>
            <AmountAdjustment
              title='Coin'
              denomType={currentDenomType}
              denom={b.coin.denom}
              setDenom={(result) => {
                setBlindArguments((prev) =>
                  prev.map((k, index) => {
                    if (index === i) {
                      return {
                        ...k,
                        coin: {
                          ...k.coin,
                          denom: result,
                        },
                      };
                    }
                    return k;
                  })
                );
              }}
              amount={b.coin.amount}
              setAmount={(result) => {
                console.log(result);
                setBlindArguments((prev) =>
                  prev.map((k, index) => {
                    if (index === i) {
                      return {
                        ...k,
                        coin: {
                          ...k.coin,
                          amount: result,
                        },
                      };
                    }
                    return k;
                  })
                );
              }}
            />
          </Row>
        ))}
        <Row style={{ marginBottom: '15px' }}>
          <AmountAdjustment
            title='Fee'
            denomType={currentDenomType}
            denom={blindFeeDenom}
            amount={blindFeeAmount}
            setDenom={setBlindFeeDenom}
            setAmount={setBlindFeeAmount}
          />
        </Row>
        <Row style={{ marginBottom: '15px' }}>
          <Button
            onClick={() => {
              setBlindArguments((prev) => prev.concat(DEFAULT_BLIND_ARGS));
            }}
          >
            Add MsgSend
          </Button>
        </Row>

        <Row>
          <Col xs={8} className='show-text-area'>
            {blindSignedSend}
          </Col>
          <Col>
            <Button style={{ width: '100%' }} variant='outline-light' onClick={signBlindTransaction}>
              Sign
            </Button>
          </Col>
        </Row>
      </Container>
      <div className='title2'>Send Tx</div>
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
}

export default CoinTerra;
