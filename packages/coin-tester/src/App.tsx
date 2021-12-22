import React, { useState, useRef } from 'react';
import { Routes, Route, Outlet, Link, Navigate } from "react-router-dom";
import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import core, { apdu, Transport } from '@coolwallet/core';
import webBleTransport, { createTransport } from '@coolwallet/transport-web-ble';
import HeadBar from './components/HeadBar';
import Settings from './components/settings';
import CoinTemplate from './components/coins/template';

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
    <Routes>
      <Route path='/' element={<Navigate to="settings" />} />
      <Route
        path='/'
        element={
          <div className='App'>
            <Container>
              <Row className='title'>
                <p>CoolWallet SDK Tester</p>
              </Row>
              <Row>
                <Col>
                  <HeadBar
                    transport={transport}
                    connect={connect}
                    disconnect={disconnect}
                  />
                </Col>
              </Row>
              <br />
            </Container>
            <Outlet />
          </div>
        }
      >
        <Route
          path='settings'
          element={<Settings
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            transport={transport}
            appPrivateKey={appPrivateKey}
            appPublicKey={appPublicKey}
          />}
        />
        <Route
          path='template'
          element={<CoinTemplate/>}
        />
        <Route path='*' element={<Navigate to="settings" />} />
      </Route>
    </Routes>
  );
}

export default App;
