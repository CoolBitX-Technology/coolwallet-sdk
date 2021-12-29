import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, config } from '@coolwallet/core';
import { NoInput } from '../utils/componentMaker';

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

  const { transport } = props;
  const disabled = !transport || props.isLocked;

  useEffect(() => {
    if (!transport) {
      setIsAppletExist('');
      setSEVersion('');
      setCardInfo('');
      setResetStatus('');
      setRegisterStatus('');
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

  return (
    <Container>
      <NoInput
        title='SE Exist'
        content={isAppletExist}
        onClick={checkApplet}
        disabled={disabled}
      />
      <NoInput
        title='SE Version'
        content={SEVersion}
        onClick={getSEVersion}
        disabled={disabled}
      />
      <NoInput
        title='Card Info'
        content={cardInfo}
        onClick={getCardInfo}
        disabled={disabled}
      />
      <NoInput
        title='Reset Card'
        content={resetStatus}
        onClick={resetCard}
        disabled={disabled}
        btnName='reset'
      />
      <NoInput
        title='Register Card'
        content={registerStatus}
        onClick={register}
        disabled={disabled}
        btnName='register'
      />
    </Container>
  );
}

export default Settings;
