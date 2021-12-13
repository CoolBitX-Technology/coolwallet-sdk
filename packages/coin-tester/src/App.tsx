import React, { useState, useRef } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import webBleTransport, { createTransport } from '@coolwallet/transport-web-ble';
import core, { apdu, Transport } from '@coolwallet/core';
import { makeConnectComponent } from './utils/componentMaker';
import CoinPage from './components/coin';

import logo from './logo.svg';
import './App.css';

function getAppKeysOrGenerate() {
  const appPublicKey = localStorage.getItem('appPublicKey');
  const appPrivateKey = localStorage.getItem('appPrivateKey');
  if (appPublicKey !== null && appPrivateKey !== null) {
    return { appPublicKey, appPrivateKey };
  }

  const keyPair = core.crypto.key.generateKeyPair();
  localStorage.setItem('appPublicKey', keyPair.publicKey);
  localStorage.setItem('appPrivateKey', keyPair.privateKey);
  return { appPublicKey: keyPair.publicKey, appPrivateKey: keyPair.privateKey };
}

function getAppIdOrNull() {
  const appId = localStorage.getItem('appId');
  if (appId === null) {
    console.log('No Appid stored, please register!');
  } else {
    console.log('get AppId success!');
  }
  return appId;
}

const { appPublicKey, appPrivateKey } = getAppKeysOrGenerate();

function App(): JSX.Element {
  const SEPublicKey = useRef<string | undefined>(undefined);

  const [transport, setTransport] = useState<Transport | null>(null);
  const [appId, setAppId] = useState(getAppIdOrNull());
  const [msg, setMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  async function connect() {
    await setTransport(await createTransport());
    if (transport !== null) {
      SEPublicKey.current = await core.config.getSEPublicKey(transport);
    }
  }

  async function disconnect() {
    webBleTransport.disconnect();
    setTransport(null);
  }

  function cancelAPDU() {
    apdu.mcu.control.cancelAPDU(transport!);
    alert('cancel action success!!!');
  }

  function showMessage() {
    return msg ? (
      <Row style={{ margin: 25, background: 'white' }}>
        <div style={{ width: '4px', background: 'red' }} />
        <Col style={{ paddingTop: 15 }}>
          <p style={{ fontSize: 15, color: 'red' }}>{msg}</p>
        </Col>
      </Row>
    ) : (
      <Row style={{ margin: 25 }} />
    );
  }

  return (
    <div className='App'>
      <Router>
        <Container>
          <Row className='title'>
            <p>CoolWallet Coin Tester</p>
          </Row>
          <br />
          { makeConnectComponent({ transport, connect, disconnect }) }
        </Container>
        { transport
          ? <CoinPage />
          : <Col>Please Connect Card</Col> }
      </Router>
    </div>
  );
}

export default App;
