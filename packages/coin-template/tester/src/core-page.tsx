import React, { useState } from 'react';
import { Container, InputGroup, FormControl, Row, Col, Button } from 'react-bootstrap';
import core, { apdu, Transport } from '@coolwallet/core';

interface PageInputs {
  appId: string,
  appPublicKey: string,
  appPrivateKey: string,
  transport: Transport,
  setAppId: (appId: string) => void,
}

function CorePage(
  { appId, appPublicKey, appPrivateKey, transport, setAppId } : PageInputs
) {
  const [password, setPassword] = useState('12345678');
  const [deviceName, setDeviceName] = useState('Click Get Paired APP');
  const [newPassword, setNewPassword] = useState('')
  const [cardInfo, setCardInfo] = useState('')
  const [MCUStatus, setMCUStatus] = useState('')
  const [SEVersion, setSEVersion] = useState('')
  const [pairedAPPs, setPairedAPPs] = useState('')
  const [pairedAPPID, setPairedAPPID] = useState('')
  const [newDeviceName, setNewDeviceName] = useState('')
  const [AppletExist, setAppletExist] = useState('')
  const [updateSEStatus, setUpdateSEStatus] = useState('')
  const [updateMCUStatus, setUpdateMCUStatus] = useState('')

  const [isRevokingPassword, setIsRevokingPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isGettingCardInfo, isSettingCardInfo] = useState(false)
  const [isGettingMCUStatus, isSettingMCUStatus] = useState(false)
  const [isGettingSEVersion, isSettingSEVersion] = useState(false)
  const [isGettingPairedAPPs, isSettingPairedAPPs] = useState(false)
  const [isRemovePairedDevice, setRemovePairedDevice] = useState(false)
  const [isSwitchLockStatus, setSwitchLockStatus] = useState(false)
  const [isRenameDevice, setRenameDevice] = useState(false)
  const [isAppletExist, setIsAppletExist] = useState(false)

  const getPassword = async () => {
    setIsRevokingPassword(true)
    try {
      const newPassword = await apdu.pair.getPairingPassword(transport, appId, appPrivateKey); //.then((pwd) => {
      setNewPassword(newPassword)
    } catch (error) {
      console.error(error)
    } finally {
      setIsRevokingPassword(false)
    }
  };

  const registerWithCard = async (password: string) => {
    try {
      setIsRegistering(true)
      const name = 'TestAPP'
      console.log("appPublicKey: " + appPublicKey)
      const SEPublicKey = localStorage.getItem('SEPublicKey')
      const appId = await apdu.pair.register(transport, appPublicKey, password, name, SEPublicKey!);
      setDeviceName(name)
      localStorage.setItem('appId', appId);
      console.log('appId: ' + appId)
      setAppId(appId)
    } catch (error) {
      // TODO
      // if (error instanceof Error.AlreadyRegistered) {
      //   console.log(`Already registered`);
      // } else {
        console.error(error);
      // }
    } finally {
      setIsRegistering(false)
    }
  };

  const resetCard = async () => {
    setIsResetting(true)
    try {
      await apdu.general.resetCard(transport);
    } catch (error) {
      console.error(error)
    } finally {
      setIsResetting(false)
    }

  }

  const getCardInfo = async () => {
    isSettingCardInfo(true)
    try {
      const data = await apdu.info.getCardInfo(transport);
      const cardInfo = `paired: ${data.paired}, locked: ${data.locked}, walletCreated: ${data.walletCreated},showDetail: ${data.showDetail}, pairRemainTimes: ${data.pairRemainTimes}`;
      setCardInfo(cardInfo)
    } catch (error) {
      console.error(error)
    } finally {
      isSettingCardInfo(false)
    }

  }

  const getMCUStatus = async () => {
    isSettingMCUStatus(true)
    try {
      const data = await apdu.mcu.dfu.getMCUVersion(transport)
      const cardInfo = `MCUStatus: ${data.fwStatus}, cardMCUVersion: ${data.cardMCUVersion}`;
      setMCUStatus(cardInfo)
    } catch (error) {
      console.error(error)
    } finally {
      isSettingMCUStatus(false)
    }

  }

  const getSEVersion = async () => {
    isSettingSEVersion(true)
    try {
      const data = await apdu.general.getSEVersion(transport)
      setSEVersion(data.toString(10))
    } catch (error) {
      console.error(error)
    } finally {
      isSettingSEVersion(false)
    }

  }

  const getPairedApps = async () => {
    isSettingPairedAPPs(true)
    try {

      const data = await apdu.pair.getPairedApps(transport, appId, appPrivateKey)
      let dataStr = ''
      for (let index = 0; index < data.length; index++) {
        const pairedAppId = data[index].appId;
        const pairedAppName = data[index].deviceName;
        if (appId !== pairedAppId) {
          if (dataStr) {
            dataStr = `${dataStr}, ${pairedAppName}: ${pairedAppId} `
          } else {
            dataStr = `${pairedAppName}: ${pairedAppId}`
          }
        } else {
          console.log(`${pairedAppName}: ${pairedAppId}`)
          setDeviceName(pairedAppName)
        }
      }
      setPairedAPPs(dataStr)
    } catch (error) {
      console.error(error)
    } finally {
      isSettingPairedAPPs(false)
    }
  }

  const removePairedDevice = async (pairedAPP: string) => {
    setRemovePairedDevice(true)
    try {
      console.log(pairedAPP)
      await apdu.pair.removePairedDevice(transport, appId, appPrivateKey, pairedAPP)
    } catch (error) {
      console.error(error)
    } finally {
      setRemovePairedDevice(false)
    }
  }

  const switchLockStatus = async () => {
    setSwitchLockStatus(true)
    try {
      await apdu.pair.switchLockStatus(transport, appId, appPrivateKey, true)
    } catch (error) {
      console.error(error)
    } finally {
      setSwitchLockStatus(false)
    }
  }

  const renameDevice = async (name: string) => {
    setRenameDevice(true)
    try {
      await apdu.pair.renameDevice(transport, appId, appPrivateKey, name)
    } catch (error) {
      console.error(error)
    } finally {
      setRenameDevice(false)
    }
  }

  const getApplet = async () => {
    setIsAppletExist(true)
    try {
      const result = await apdu.ota.selectApplet(transport);
      setAppletExist(`===>${result}`)
    } catch (error) {
      console.error(error)
    } finally {
      setIsAppletExist(false)
    }
  }

  const updateSE = async () => {
    let cardName = localStorage.getItem('cardName')
    cardName = cardName?.replace('CoolWallet ', '').trim() ?? '';
    console.log(cardName)
    await apdu.ota.updateSE(transport, cardName, appId, appPrivateKey,
      function (num) {
        // setUpdateStatus(<LinearProgress value={num} />);
        setUpdateSEStatus(num.toString(10));
      },
      function (url, options) {
        return fetch(url, options);
      }

    );

    await apdu.mcu.control.powerOff(transport);
  }

  const updateMCU = async () => {
    localStorage.getItem('cardName')
    await apdu.mcu.dfu.updateMCU(transport,
      function (num) {
        // setUpdateStatus(<LinearProgress value={num} />);
        setUpdateMCUStatus(num.toString(16));
      }
    );

    await apdu.mcu.control.powerOff(transport);
  }


  return (
    <Container>
      <h4>Settings ({deviceName})</h4>
      <Row>
        <Col xs={3}>
          <Button
            id='resetCard'
            disabled={isResetting}
            variant='outline-danger'
            style={{ margin: 5 }}
            onClick={resetCard}
          >
            {isResetting ? 'Please Press Button...' : 'Reset Card'}
          </Button>
        </Col>
        <Col xs={4}>
          <InputGroup className='mb-3' style={{ margin: 5 }}>
            <FormControl
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              value={password}
              placeholder='pairing password'
            />
            <Button
              id='registerWithCard'
              disabled={isRegistering}
              variant='outline-light'
              onClick={() => {
                registerWithCard(password);
              }}
            >
              {isRegistering ? 'Please Press Button...' : 'Register'}
            </Button>
          </InputGroup>
        </Col>

        <Col xs={3}>
          <Button
            id='getPassword'
            disabled={isRevokingPassword}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getPassword}>
            {isRevokingPassword ? 'Loading' : 'Get password'}
          </Button>
        </Col>
        <Col xs={1}>
          {newPassword}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isGettingMCUStatus}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getMCUStatus}>
            {isGettingMCUStatus ? 'Loading' : 'Get FW Status'}
          </Button>
        </Col>
        <Col xs={3}>
          {MCUStatus}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isGettingSEVersion}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getSEVersion}>
            {isGettingSEVersion ? 'Loading' : 'Get SE Version'}
          </Button>
        </Col>
        <Col xs={3}>
          {SEVersion}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isGettingCardInfo}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getCardInfo}>
            {isGettingCardInfo ? 'Loading' : 'Get Card Info'}
          </Button>
        </Col>
        <Col xs={3}>
          {cardInfo}
        </Col>
      </Row>
      <Row>
        <Col xs={4}>
          <Button
            disabled={isGettingPairedAPPs}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getPairedApps}>
            {isGettingPairedAPPs ? 'Loading' : 'Get Paired APP'}
          </Button>
        </Col>
        <Col xs={1}>
          {pairedAPPs}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isRemovePairedDevice}
            variant='outline-light'
            onClick={() => {
              removePairedDevice(pairedAPPID);
            }}
          >
            {isRemovePairedDevice ? 'Please Press Button...' : 'Remove Paired Device'}
          </Button>
        </Col>
        <Col>
          <InputGroup className='mb-3' style={{ margin: 5 }}>
            <FormControl
              onChange={(event) => {
                setPairedAPPID(event.target.value);
              }}
              value={pairedAPPID}
              placeholder='paired APP ID'
            />
          </InputGroup>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isSwitchLockStatus}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={switchLockStatus}>
            {isSwitchLockStatus ? 'Loading' : 'switch Lock Status'}
          </Button>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isRenameDevice}
            variant='outline-light'
            onClick={() => {
              renameDevice(newDeviceName);
            }}
          >
            {isRenameDevice ? 'Loading' : 'Rename Device'}
          </Button>
        </Col>
        <Col>
          <InputGroup className='mb-3' style={{ margin: 5 }}>
            <FormControl
              onChange={(event) => {
                setNewDeviceName(event.target.value);
              }}
              value={newDeviceName}
              placeholder='New Device Name'
            />
          </InputGroup>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            disabled={isAppletExist}
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={getApplet}>
            {isAppletExist ? 'Loading' : 'Is Applet Exist'}
          </Button>
        </Col>
        <Col xs={3}>
          {AppletExist}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={updateSE}>
            {'update SE'}
          </Button>
        </Col>
        <Col xs={3}>
          {updateSEStatus}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <Button
            variant='outline-light'
            style={{ margin: 5 }}
            onClick={updateMCU}>
            {'update MCU'}
          </Button>
        </Col>
        <Col xs={3}>
          {updateMCUStatus}
        </Col>
      </Row>
    </Container>
  );
}

export default CorePage;
