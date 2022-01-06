import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput } from '../utils/componentMaker';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function Settings(props: Props) {
  const [isAppletExist, setIsAppletExist] = useState('');
  const [SEVersion, setSEVersion] = useState('');
  const [cardInfo, setCardInfo] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [mnemonicStatus, setMnemonicStatus] = useState('');

  const { transport } = props;
  const disabled = !transport || props.isLocked;

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

  const handleState = async (
    request: () => Promise<string>,
    handleResponse: (response: string) => void
  ) => {
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
      const formattedData = `paired: ${data.paired}, locked: ${data.locked}, walletCreated: ${data.walletCreated},showDetail: ${data.showDetail}, pairRemainTimes: ${data.pairRemainTimes}`;
      return formattedData;
    }, setCardInfo);
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
      const name = 'TestAPP'
      const password = '12345678';
      const SEPublicKey = await config.getSEPublicKey(transport!);
      const appId = await apdu.pair.register(transport!, props.appPublicKey, password, name, SEPublicKey);
      await localStorage.setItem('appId', appId);
      return appId;
    }, setRegisterStatus);
  };

  const createMnemonic = async () => {
    handleState(async () => {
      const crypto = require('crypto');
      const mnemonic = await utils.createSeedByApp(12, crypto.randomBytes)
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

  return (
    <Container>
      <div className='title2'>
        Using these commands to check the state of CoolWallet Pro.
      </div>
      <NoInput
        title='Firmware Exist'
        content={isAppletExist}
        onClick={checkApplet}
        disabled={disabled}
      />
      <NoInput
        title='Firmware Version'
        content={SEVersion}
        onClick={getSEVersion}
        disabled={disabled}
      />
      <NoInput
        title='Card Detail'
        content={cardInfo}
        onClick={getCardInfo}
        disabled={disabled}
      />
      <div className='title2'>
        By running through below commands, CoolWallet Pro would be ready to use for a coin sdk.
      </div>
      <NoInput
        title='Reset Card'
        content={resetStatus}
        onClick={resetCard}
        disabled={disabled}
        btnName='Reset'
      />
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
        inputSize={4}
      />
    </Container>
  );
}

export default Settings;
