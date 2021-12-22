import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu } from '@coolwallet/core';
import { Get } from '../utils/componentMaker';

interface Props {
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
}

function Settings(props: Props) {
  const [isAppletExist, setIsAppletExist] = useState('');
  const [cardInfo, setCardInfo] = useState('');
  const [SEVersion, setSEVersion] = useState('');

  const { transport, isLocked } = props;
  const disabled = !transport || isLocked;

  useEffect(() => {
    if (!transport) {
      setCardInfo('');
      setIsAppletExist('');
      setSEVersion('');
    }
  }, [transport]);

  const checkApplet = async () => {
    props.setIsLocked(true);
    try {
      const cardName = localStorage.getItem('cardName');
      const aid = cardName?.startsWith('CoolWalletS ') ? 'C1C2C3C4C5' : undefined;
      const { status } = await apdu.ota.selectApplet(transport!, aid);
      console.log('isAppletExist :', status);
      setIsAppletExist(status.toString());
    } catch (error: any) {
      setIsAppletExist(error.message);
      console.error(error);
    } finally {
      props.setIsLocked(false);
    }
  };

  const getSEVersion = async () => {
    props.setIsLocked(true);
    try {
      const data = await apdu.general.getSEVersion(transport!);
      setSEVersion(data.toString());
    } catch (error: any) {
      setSEVersion(error.message);
      console.error(error);
    } finally {
      props.setIsLocked(false);
    }
  };

  const getCardInfo = async () => {
    props.setIsLocked(true);
    try {
      const data = await apdu.info.getCardInfo(transport!);
      const formattedData = `paired: ${data.paired}, locked: ${data.locked}, walletCreated: ${data.walletCreated},showDetail: ${data.showDetail}, pairRemainTimes: ${data.pairRemainTimes}`;
      setCardInfo(formattedData);
    } catch (error: any) {
      setCardInfo(error.message);
      console.error(error);
    } finally {
      props.setIsLocked(false);
    }
  };

  return (
    <Container>
      <Get
        title='SE Exist'
        content={isAppletExist}
        onClick={checkApplet}
        disabled={disabled}
      />
      <Get
        title='SE Version'
        content={SEVersion}
        onClick={getSEVersion}
        disabled={disabled}
      />
      <Get
        title='Card Info'
        content={cardInfo}
        onClick={getCardInfo}
        disabled={disabled}
      />
    </Container>
  );
}

export default Settings;
