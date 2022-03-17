import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Transport, apdu, tx, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, ObjInputs } from '../utils/componentMaker';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function Settings(props: Props) {
  const { transport } = props;
  const disabled = !transport || props.isLocked;

  const [isAppletExist, setIsAppletExist] = useState('');
  const [SEVersion, setSEVersion] = useState('');
  const [cardInfo, setCardInfo] = useState('');
  const [cardMode, setCardMode] = useState('');
  const [progress, setProgress] = useState('');
  const [displayAddressResult, setDisplayAddressResult] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [mnemonicStatus, setMnemonicStatus] = useState('');

  const [signingKeys, setSigningKeys] = useState(['Script', 'Arguments']);
  const [signingValues, setSigningValues] = useState(['', '']);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (!transport) {
      setIsAppletExist('');
      setSEVersion('');
      setCardInfo('');
      setResetStatus('');
      setRegisterStatus('');
      setMnemonicStatus('');
    }
  }, [transport]);

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

  const checkApplet = async () => {
    handleState(async () => {
      const cardName = localStorage.getItem('cardName');
      const aid = cardName?.startsWith('CoolWalletS ') ? 'C1C2C3C4C5' : undefined;
      const { status } = await apdu.ota.selectApplet(transport!, aid);
      console.log('isAppletExist :', status);
      return status.toString();
    }, setIsAppletExist);
  };

  const getSEVersion = async () => {
    handleState(async () => {
      const data = await apdu.general.getSEVersion(transport!);
      return data.toString();
    }, setSEVersion);
  };

  const getCardInfo = async () => {
    handleState(async () => {
      const data = await apdu.info.getCardInfo(transport!);
      const formattedData = `paired: ${data.paired}, locked: ${data.locked}, walletCreated: ${data.walletCreated},showDetail: ${data.showDetail}, pairRemainTimes: ${data.pairRemainTimes}, cardanoSeed: ${data.cardanoSeed}`;
      return formattedData;
    }, setCardInfo);
  };

  const getCardMode = async () => {
    handleState(async () => {
      const data = await apdu.general.getSEMode(transport!);
      return data;
    }, setCardMode);
  };

  const upgradeSE = async () => {
    handleState(async () => {
      const cardId = await apdu.general.getCardId(transport!);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      await apdu.ota.updateSE(
        transport!,
        cardId,
        appId,
        props.appPrivateKey,
        (number) => {
          setProgress('' + number);
        },
        fetch
      );
      return '100';
    }, setProgress);
  };

  const toggleDisplayAddress = async () => {
    handleState(async () => {
      const { showDetail } = await apdu.info.getCardInfo(transport!);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const data = await apdu.info.toggleDisplayAddress(transport!, appId, props.appPrivateKey, !showDetail);
      return `showDetail: ${data.toString()}`;
    }, setDisplayAddressResult);
  };

  const resetCard = async () => {
    handleState(async () => {
      const status = await apdu.general.resetCard(transport!);
      await localStorage.removeItem('appId');
      return status ? 'success' : 'failure';
    }, setResetStatus);
  };

  const register = async () => {
    handleState(async () => {
      const name = 'TestAPP';
      const password = '12345678';
      const SEPublicKey = await config.getSEPublicKey(transport!);
      console.log(SEPublicKey);
      const appId = await apdu.pair.register(transport!, props.appPublicKey, password, name, SEPublicKey);
      await localStorage.setItem('appId', appId);
      return appId;
    }, setRegisterStatus);
  };

  const createMnemonic = async () => {
    handleState(async () => {
      const crypto = require('crypto');
      const mnemonic = await utils.createSeedByApp(12, crypto.randomBytes);
      return mnemonic;
    }, setMnemonic);
  };

  const recoverWallet = async () => {
    handleState(async () => {
      console.log('mnemonicInput :', mnemonicInput);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const SEPublicKey = await config.getSEPublicKey(transport!);
      await utils.createWalletByMnemonic(transport!, appId, props.appPrivateKey, mnemonicInput, SEPublicKey);
      return 'success';
    }, setMnemonicStatus);
  };

  const sign = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const scriptSig =
        'FA0000000000000000000000000000000000000000000000000000000000000000000000' +
        '000000000000000000000000000000000000000000000000000000000000000000000000';
      await apdu.tx.sendScript(transport!, signingValues[0] + scriptSig);
      const encryptedSig = await apdu.tx.executeScript(transport!, appId, props.appPrivateKey, signingValues[1]);
      await apdu.tx.finishPrepare(transport!);
      await apdu.tx.getTxDetail(transport!);
      const decryptingKey = await apdu.tx.getSignatureKey(transport!);
      await apdu.tx.clearTransaction(transport!);
      await apdu.mcu.control.powerOff(transport!);
      const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, false, false);
      return sig.toString('hex');
    }, setSignature);
  };

  return (
    <Container>
      <div className='title2'>Using these commands to check the state of CoolWallet Pro.</div>
      <NoInput title='Firmware Exist' content={isAppletExist} onClick={checkApplet} disabled={disabled} />
      <NoInput title='Firmware Version' content={SEVersion} onClick={getSEVersion} disabled={disabled} />
      <NoInput title='Card Information' content={cardInfo} onClick={getCardInfo} disabled={disabled} />
      <NoInput title='Card Mode' content={cardMode} onClick={getCardMode} disabled={disabled} />
      <NoInput title='Upgrade SE' content={progress} onClick={upgradeSE} disabled={disabled} />
      <NoInput
        title='Toggle showDetail'
        content={displayAddressResult}
        onClick={toggleDisplayAddress}
        disabled={disabled}
        btnName='Switch'
      />
      <div className='title2'>
        By running through below commands, CoolWallet Pro would be ready to use for a coin sdk.
      </div>
      <NoInput title='Reset Card' content={resetStatus} onClick={resetCard} disabled={disabled} btnName='Reset' />
      <NoInput
        title='Register Card'
        content={registerStatus}
        onClick={register}
        disabled={disabled}
        btnName='Register'
      />
      <NoInput
        title='Create Mnemonic'
        content={mnemonic}
        onClick={createMnemonic}
        disabled={disabled}
        btnName='Create'
      />
      <OneInput
        title='Recover Wallet'
        content={mnemonicStatus}
        onClick={recoverWallet}
        disabled={disabled}
        value={mnemonicInput}
        setValue={setMnemonicInput}
        placeholder='mnemonic'
        btnName='Recover'
        inputSize={6}
      />
      <div className='title2'>For Scriptable Signing Test</div>
      <ObjInputs
        title='Scriptable Signing'
        content={signature}
        onClick={sign}
        disabled={disabled}
        keys={signingKeys}
        values={signingValues}
        setValues={setSigningValues}
        btnName='Sign'
      />
    </Container>
  );
}

export default Settings;
