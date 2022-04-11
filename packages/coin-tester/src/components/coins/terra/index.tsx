import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Dropdown, Form, Badge } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import { CHAIN_ID, TX_TYPE, SignDataType } from '@coolwallet/terra/lib/config/types';
import { DENOMTYPE } from "@coolwallet/terra/lib/config/denomType";
import { TOKENTYPE } from "@coolwallet/terra/lib/config/tokenType";
import BigNumber from 'bignumber.js';

//import cosmosjs from './cosmos';
import { Testnet, Mainnet } from './cosmos';
import Terra from '@coolwallet/terra';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const TOKENTYPEDEV = [
  // ANC
  {
      name: "Anchor ANC Token",
      symbol: "ANC",
      unit: "6",
      contractAddress: "terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc",
      signature: "0603414E43000000007465727261313734376d6164353868307734793538397933736b3834723565667164657639713472303270633046022100B995F026DAA2D33960E339E2FBBA039E89E8D67EF4DEEB137CE0A07DBFAE63FC022100FC86C475A3A9972061DA285AFC729813ED9F7953413978812DAA0465AFC6D2EB"
  },
  // aUST
  {
      name: "Anchor aUST Token",
      symbol: "aUST",
      unit: "6",
      contractAddress: "terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl",
      signature: "060461555354000000746572726131616a7435353664707a766a776c306b6c35747a6b753366633370336b6e6b67396d6b76386a6c3046022100F043671FF10B1452408372714D4A4F9E14AD325FF5A1EB5884B4FCAB8B515807022100F0B5C1D65BC7959ED557AE1AAAE109381935FAB57F8CEBD3FD2783C4CDF2B52E"
  },
  // bLUNA
  // {
  //     name: "Anchor bLuna Token",
  //     symbol: "bLuna",
  //     unit: "6",
  //     contractAddress: "terra1u0t35drzyy0mujj8rkdyzhe264uls4ug3wdp3x",
  //     signature: "0605624C756E610000746572726131753074333564727a7979306d756a6a38726b64797a6865323634756c73347567337764703378304402207134CA1EA44A57921D33917C013C90710395D2A5A57611BBC961F79E8722F3290220790CD1B561E725EC279741C740A0459E37D2B658187193C256A6BCC0E34C2B5A"
  // }
]

function CoinTerra(props: Props) {
  const terra = new Terra();
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(CHAIN_ID.TEST);
  const [netLabel, setNetLabel] = useState("Test Net");
  const [txUrl, setTxUrl] = useState("https://finder.terra.money/testnet/tx/");
  const [cosmosjs, setNetwork] = useState(Testnet);
  const [balances, setBalances] = useState([]);
  const [validators, setValidators] = useState([]);

  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  //const [to, setTo] = useState('terra1seckusy09dzgtyxtz9xqzg2x7xfgtf0lhyzmf9');
  const [to, setTo] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv'); // Testnet - Wallet
  const [denom, setDenom] = useState(DENOMTYPE.LUNA);
  const [feeAmount, setFeeAmount] = useState(0.001);
  const [feeDenom, setFeeDenom] = useState(DENOMTYPE.LUNA);

  const [delegateValue, setDelegateValue] = useState('0');
  const [signedDelegate, setSignedDelegate] = useState('');
  //const [delegateValidator, setDelegateValidator] = useState('terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at');
  const [delegateValidator, setDelegateValidator] = useState('terravaloper15fl0fcnzreazj50x25rvyvr0rtn0nq2n742cxm'); // Testnet - Accomplice Blockchain
  const [delegateFeeAmount, setDelegateFeeAmount] = useState(0.006);
  const [delegateFeeDenom, setDelegateFeeDenom] = useState(DENOMTYPE.LUNA);

  const [undelegateValue, setUndelegateValue] = useState('0');
  const [signedUndelegate, setSignedUndelegate] = useState('');
  const [undelegateValidator, setUndelegateValidator] = useState('terravaloper15fl0fcnzreazj50x25rvyvr0rtn0nq2n742cxm');
  const [undelegateFeeAmount, setUndelegateFeeAmount] = useState(0.008);
  const [undelegateFeeDenom, setUndelegateFeeDenom] = useState(DENOMTYPE.LUNA);

  const [signedWithdraw, setSignedWithdraw] = useState('');
  const [withdrawValidator, setWithdrawValidator] = useState('terravaloper15fl0fcnzreazj50x25rvyvr0rtn0nq2n742cxm');
  const [withdrawFeeAmount, setWithdrawFeeAmount] = useState(0.005);
  const [withdrawFeeDenom, setWithdrawFeeDenom] = useState(DENOMTYPE.LUNA);

  const [swapValue, setSwapValue] = useState('0');
  const [signedSwap, setSignedSwap] = useState('');
  //const [swapAddress, setSwapAddress] = useState('terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6'); // mainnet luna2ust
  const [swapAddress, setSwapAddress] = useState('terra156v8s539wtz0sjpn8y8a8lfg8fhmwa7fy22aff'); // testnet luna2ust
  const [swapDenom, setSwapDenom] = useState(DENOMTYPE.LUNA);
  const [swapFeeAmount, setSwapFeeAmount] = useState(0.003);
  const [swapFeeDenom, setSwapFeeDenom] = useState(DENOMTYPE.LUNA);

  const ancMain = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76'; // mainnet ANC
  const ancTest = 'terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc'; // testnet ANC
  const [ancValue, setAncValue] = useState('0');
  const [signedSendAnc, setSignedSendAnc] = useState('');
  const [ancAddress, setAncAddress] = useState(ancTest);
  const [ancRecipient, setAncRecipient] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv');
  const [ancFeeAmount, setAncFeeAmount] = useState(0.0015);
  const [ancFeeDenom, setAncFeeDenom] = useState(DENOMTYPE.LUNA);

  const [cw20TokenType, setCw20TokenType] = useState(TOKENTYPEDEV);
  const [cw20Value, setCw20Value] = useState('0');
  const [cw20SignedSend, setCw20SignedSend] = useState('');
  const [cw20Token, setCw20Token] = useState(TOKENTYPEDEV[0]);
  const [cw20Recipient, setCw20Recipient] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv');
  //const [cw20FeeAmount, setCw20FeeAmount] = useState(0.0057); // bLuna
  const [cw20FeeAmount, setCw20FeeAmount] = useState(0.0015);
  const [cw20FeeDenom, setCw20FeeDenom] = useState(DENOMTYPE.LUNA);

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

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

  const updateAccStatus = (_network, _address)=> {
    _network.getBalance(_address).then((_balances:[]) => {
      setBalances(_balances);
    });
    _network.getValidators(_address).then((_validators:[]) => {
      setValidators(_validators);
    });
  };

  const handleNetChange = (e)=>{
    let newNetwork;
    if('Test Net' === e){
      newNetwork = Testnet;
      setNetwork(Testnet);
      setChainId(CHAIN_ID.TEST);
      setAncAddress(ancTest);
      setTxUrl("https://finder.terra.money/testnet/tx/");
      setCw20TokenType(TOKENTYPEDEV);
      setCw20Token(TOKENTYPEDEV[0]);
    }
    else{
      newNetwork = Mainnet;
      setNetwork(Mainnet);
      setChainId(CHAIN_ID.MAIN);
      setAncAddress(ancMain);
      setTxUrl("https://finder.terra.money/mainnet/tx/");
      setCw20TokenType(TOKENTYPE);
      setCw20Token(TOKENTYPE[0]);
    }
    setNetLabel(e); 
    if(address.length > 0) {
      updateAccStatus(newNetwork, address);
    }
  }

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const tAdd = await terra.getAddress(transport!, appPrivateKey, appId, 0);

      updateAccStatus(cosmosjs, tAdd);

      return tAdd;
    }, setAddress);
  };

  const signTransaction = async(_transaction, _transactionType, handleResponse: (response: string) => void) => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        accountNumber: account_number,
        sequence,
        ..._transaction
      };
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: _transactionType,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      };
      const signedTx = await terra.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);
      return txUrl + sendTx.slice(1, -1);
    }, handleResponse);
  };

  const signSendTransaction = async () => {
    const transaction = {
      fromAddress: address,
      toAddress: to,
      amount: new BigNumber(value).multipliedBy(1000000).toNumber(),
      feeAmount: new BigNumber(feeAmount).multipliedBy(1000000).toNumber(),
      gas: 85000,
      feeDenom: feeDenom,
      denom: denom,
      memo: 'test signature',
    };
    await signTransaction(transaction, TX_TYPE.SEND, setSignedTransaction);
    updateAccStatus(cosmosjs, address);
  };

  const signDelegate = async() => {
    const transaction = {
      delegatorAddress: address,
      validatorAddress: delegateValidator,
      amount: new BigNumber(delegateValue).multipliedBy(1000000).toNumber(),
      feeAmount: new BigNumber(delegateFeeAmount).multipliedBy(1000000).toNumber(),
      feeDenom: delegateFeeDenom,
      gas: 520000,
      memo: '',
    };
    await signTransaction(transaction, TX_TYPE.DELEGATE, setSignedDelegate);
    updateAccStatus(cosmosjs, address);
  };

  const signUndelegate = async() => {
    const transaction = {
      delegatorAddress: address,
      validatorAddress: undelegateValidator,
      amount: new BigNumber(undelegateValue).multipliedBy(1000000).toNumber(),
      feeAmount: new BigNumber(undelegateFeeAmount).multipliedBy(1000000).toNumber(),
      feeDenom: undelegateFeeDenom,
      gas: 550000,
      memo: '',
    };
    await signTransaction(transaction, TX_TYPE.UNDELEGATE, setSignedUndelegate);
    updateAccStatus(cosmosjs, address);
  }

  const signWithdraw = async() => {
    const transaction = {
      delegatorAddress: address,
      validatorAddress: withdrawValidator,
      feeAmount: new BigNumber(withdrawFeeAmount).multipliedBy(1000000).toNumber(),
      feeDenom: withdrawFeeDenom,
      gas: 400000,
      memo: '',
    };
    await signTransaction(transaction, TX_TYPE.WITHDRAW, setSignedWithdraw);
    updateAccStatus(cosmosjs, address);
  };

  const signSmartSwap = async() => {
    // based on the structure of the smart contract- execute_msg may be different and funds may be undefined
    const executeMsgObj = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: swapDenom.unit
            }
          },
          amount: new BigNumber(swapValue).multipliedBy(1000000).toString()
        }
      }
    };
    
    const transaction = {
      senderAddress: address,
      contractAddress: swapAddress,
      execute_msg: JSON.stringify(executeMsgObj),
      // funds: undefined,
      funds: {
        denom: swapDenom, 
        amount: new BigNumber(swapValue).multipliedBy(1000000).toNumber()
      },
      feeDenom: swapFeeDenom,
      feeAmount: new BigNumber(swapFeeAmount).multipliedBy(1000000).toNumber(),
      gas: 250000,
      //gas: 180000,
      memo: 'Swap test',
    };

    signTransaction(transaction, TX_TYPE.SMART, setSignedSwap);
  };

  const signSmartSendAnc = async() => {
    // based on the structure of the smart contract- execute_msg may be different and funds may be undefined
    const executeMsgObj = {
      transfer: {
        amount: new BigNumber(ancValue).multipliedBy(1000000).toString(),
        recipient: ancRecipient
      }
    };
    
    const transaction = {
      senderAddress: address,
      contractAddress: ancAddress,
      execute_msg: JSON.stringify(executeMsgObj),
      funds: undefined,
      feeDenom: ancFeeDenom,
      feeAmount: new BigNumber(ancFeeAmount).multipliedBy(1000000).toNumber(),
      gas: 120000,
      memo: 'Send anc test',
    };

    signTransaction(transaction, TX_TYPE.SMART, setSignedSendAnc);
  };

  const signCw20Send = async() => {
    const executeMsgObj = {
      transfer: {
        amount: new BigNumber(cw20Value).multipliedBy(1000000).toString(),
        recipient: cw20Recipient
      }
    };
    
    const transaction = {
      senderAddress: address,
      contractAddress: cw20Token.contractAddress,
      execute_msg: executeMsgObj,
      funds: undefined,
      feeDenom: cw20FeeDenom,
      feeAmount: new BigNumber(cw20FeeAmount).multipliedBy(1000000).toNumber(),
      //gas: 500000, // bLuna,
      gas: 120000,
      memo: 'Send cw20 test',
    };

    signTransaction(transaction, TX_TYPE.SMART, setCw20SignedSend);
  };

  return (
    <Container>
      <div className='title2'>Support: Normal transfer, Stacking and Smart Contract</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={3}
            md={1}
          >
            <Dropdown onSelect={handleNetChange}>
              <Dropdown.Toggle variant='danger'>
                {netLabel}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey='Test Net'>Test Net</Dropdown.Item>
                <Dropdown.Item eventKey='Main Net'>Main Net</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col>
          {balances.map(function(balance){
            return <Badge bg="secondary" key={balance.denom}  style={{margin: '0 10px'}}>{balance.amount} {balance.denom}</Badge>;
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
          <Col 
            xs={2}
            md={{ span: 1, offset: 2 }}
          >Coin:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {denom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={2}
            md={1}>Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {feeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={feeAmount}
              onChange={(event) => {
                setFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {<TwoInputs
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
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={{ span: 2, offset: 2 }}
            md={{ span: 1, offset: 5 }}
          >Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setDelegateFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {delegateFeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={delegateFeeAmount}
              onChange={(event) => {
                setDelegateFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {
        (validators.length > 0) ? (<Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={2}>Validators:</Col>
          <Col
            xs={8}>
            {validators.map(function(validator){
              return <Badge bg="success" key={validator.validator_address}  style={{margin: '0 10px'}}>{validator.validator_address} = {validator.amount}{validator.denom}</Badge>;
            })}
          </Col>
        </Row>):<></>
      }
      {<TwoInputs
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
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={{ span: 2, offset: 2 }}
            md={{ span: 1, offset: 5 }}
          >Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setUndelegateFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {undelegateFeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={undelegateFeeAmount}
              onChange={(event) => {
                setUndelegateFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {<OneInput
        title='Withdraw' 
        content={signedWithdraw} 
        onClick={signWithdraw}
        disabled={disabled}
        btnName='Withdraw'
        value={withdrawValidator}
        setValue={setWithdrawValidator}
        placeholder='withdrawValidator'
        inputSize={4}
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={{ span: 2, offset: 2 }}
            md={{ span: 1, offset: 5 }}
          >Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setWithdrawFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {withdrawFeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={withdrawFeeAmount}
              onChange={(event) => {
                setWithdrawFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {<TwoInputs
        title='Smart: Swap' 
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
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={2}
            md={{ span: 1, offset: 2 }}
          >Source:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setSwapDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {swapDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={2}
            md={1}>Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setSwapFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {swapFeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={swapFeeAmount}
              onChange={(event) => {
                setSwapFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {<TwoInputs
        title='Smart: ANC send' 
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
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={{ span: 2, offset: 2 }}
            md={{ span: 1, offset: 5 }}
          >Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setAncFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {ancFeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={ancFeeAmount}
              onChange={(event) => {
                setAncFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
      {<TwoInputs
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
      />}
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={2}
            md={{ span: 1, offset: 2 }}
          >Token:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setCw20Token(cw20TokenType[parseInt(e)])}}>
              <Dropdown.Toggle variant='success'>
                {cw20Token.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(cw20TokenType).map(function(token, index){
                  return <Dropdown.Item key={token.name} eventKey={index}>{token.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={2}
            md={1}>Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setCw20FeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {cw20FeeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={cw20FeeAmount}
              onChange={(event) => {
                setCw20FeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
    </Container>
  );
}

export default CoinTerra;
