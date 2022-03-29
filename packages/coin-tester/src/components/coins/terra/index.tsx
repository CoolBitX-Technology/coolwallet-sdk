import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Dropdown, Form, Badge } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import { CHAIN_ID, TX_TYPE, SignDataType } from '@coolwallet/terra/lib/config/types';
import { DENOMTYPE } from "@coolwallet/terra/lib/config/denomType";
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

function CoinTerra(props: Props) {
  const terra = new Terra();
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(CHAIN_ID.TEST);
  const [netLabel, setNetLabel] = useState("Test Net");
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
  const [undelegateFeeAmount, setUndelegateFeeAmount] = useState(0.006);
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
  const [swapFeeAmount, setSwapFeeAmount] = useState(0.0025);
  const [swapFeeDenom, setSwapFeeDenom] = useState(DENOMTYPE.LUNA);

  const ancMain = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76'; // mainnet ANC
  const ancTest = 'terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc'; // testnet ANC
  const [ancValue, setAncValue] = useState('0');
  const [signedSendAnc, setSignedSendAnc] = useState('');
  const [ancAddress, setAncAddress] = useState(ancTest);
  const [ancRecipient, setAncRecipient] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv');
  const [ancFeeAmount, setAncFeeAmount] = useState(0.0015);
  const [ancFeeDenom, setAncFeeDenom] = useState(DENOMTYPE.LUNA);

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
    }
    else{
      newNetwork = Mainnet;
      setNetwork(Mainnet);
      setChainId(CHAIN_ID.MAIN);
      setAncAddress(ancMain);
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

  const signTransaction = async () => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        fromAddress: address,
        toAddress: to,
        amount: new BigNumber(value).multipliedBy(1000000).toNumber(),
        feeAmount: new BigNumber(feeAmount).multipliedBy(1000000).toNumber(),
        gas: 85000,
        accountNumber: account_number,
        sequence,
        feeDenom: feeDenom,
        denom: denom,
        memo: 'test signature',
      };
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.SEND,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      };
      const signedTx = await terra.signTransaction(signTxData);
      console.log('signedTx: ' + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log('sendTx: ' + sendTx);

      updateAccStatus(cosmosjs, address);

      return sendTx;
    }, setSignedTransaction);
  };

  const signDelegate = async() => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        delegatorAddress: address,
        validatorAddress: delegateValidator,
        amount: new BigNumber(delegateValue).multipliedBy(1000000).toNumber(),
        feeAmount: new BigNumber(delegateFeeAmount).multipliedBy(1000000).toNumber(),
        feeDenom: delegateFeeDenom,
        gas: 520000,
        accountNumber: account_number,
        sequence,
        memo: '',
      };
      console.log("temp gas amount transaction: ");
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.DELEGATE,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      }
      // const tempSignedTx = await terra.signTransaction(signTxData);
      // console.log("tempSignedTx: " + tempSignedTx);

      // const getGas = await cosmosjs.getGas(tempSignedTx);
      // transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      // transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      // console.log("new gas amount transaction: ");
      // console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);

      updateAccStatus(cosmosjs, address);

      return sendTx;
    }, setSignedDelegate);
  };

  const signUndelegate = async() => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        delegatorAddress: address,
        validatorAddress: undelegateValidator,
        amount: new BigNumber(undelegateValue).multipliedBy(1000000).toNumber(),
        feeAmount: new BigNumber(undelegateFeeAmount).multipliedBy(1000000).toNumber(),
        feeDenom: undelegateFeeDenom,
        gas: 520000,
        accountNumber: account_number,
        sequence,
        memo: '',
      };
      console.log("temp gas amount transaction: ");
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.UNDELEGATE,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      }
      // const tempSignedTx = await terra.signTransaction(signTxData);
      // console.log("tempSignedTx: " + tempSignedTx);

      // const getGas = await cosmosjs.getGas(tempSignedTx);
      // transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      // transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      // console.log("new gas amount transaction: ");
      // console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);

      updateAccStatus(cosmosjs, address);

      return sendTx;
    }, setSignedUndelegate);
  }

  const signWithdraw = async() => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        delegatorAddress: address,
        validatorAddress: withdrawValidator,
        feeAmount: new BigNumber(withdrawFeeAmount).multipliedBy(1000000).toNumber(),
        feeDenom: withdrawFeeDenom,
        gas: 400000,
        accountNumber: account_number,
        sequence,
        memo: '',
      };
      console.log("temp gas amount transaction: ");
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.WITHDRAW,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      }
      // const tempSignedTx = await terra.signTransaction(signTxData);
      // console.log("tempSignedTx: " + tempSignedTx);

      // const getGas = await cosmosjs.getGas(tempSignedTx);
      // transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      // transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      // console.log("new gas amount transaction: ");
      // console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);

      updateAccStatus(cosmosjs, address);
      
      return sendTx;
    }, setSignedWithdraw);
  };

  const signSmartContract = async(_transaction, handleResponse: (response: string) => void) => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        senderAddress: address,
        accountNumber: account_number,
        sequence,
        ..._transaction
      };
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.SMART,
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
      return sendTx;
    }, handleResponse);

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
      contractAddress: swapAddress,
      execute_msg: JSON.stringify(executeMsgObj),
      // funds: undefined,
      funds: {
        denom: swapDenom, 
        amount: new BigNumber(swapValue).multipliedBy(1000000).toNumber()
      },
      feeDenom: swapFeeDenom,
      feeAmount: new BigNumber(swapFeeAmount).multipliedBy(1000000).toNumber(),
      gas: 180000,
      memo: 'Swap test',
    };

    return signSmartContract(transaction, setSignedSwap);
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
      contractAddress: ancAddress,
      execute_msg: JSON.stringify(executeMsgObj),
      funds: undefined,
      feeDenom: ancFeeDenom,
      feeAmount: new BigNumber(ancFeeAmount).multipliedBy(1000000).toNumber(),
      gas: 120000,
      memo: 'Send anc test',
    };

    return signSmartContract(transaction, setSignedSendAnc);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
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
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
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
          >Tx:</Col>
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
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={2}>Validators:</Col>
          <Col
            xs={8}>
            {validators.map(function(validator){
              return <Badge bg="success" key={validator.validator_address}  style={{margin: '0 10px'}}>{validator.validator_address} = {validator.amount}{validator.denom}</Badge>;
            })}
          </Col>
        </Row>
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
    </Container>
  );
}

export default CoinTerra;
