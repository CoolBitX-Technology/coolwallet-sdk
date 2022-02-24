import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { apdu, crypto, Transport } from '@coolwallet/core';
import HeadBar from './components/HeadBar';
import Settings from './components/settings';
import Coins from './components/coins';

import logo from './logo.svg';
import './App.css';

function getAppKeysOrGenerate() {
  const appPublicKey = localStorage.getItem('appPublicKey');
  const appPrivateKey = localStorage.getItem('appPrivateKey');
  if (appPublicKey !== null && appPrivateKey !== null) {
    return { appPublicKey, appPrivateKey };
  }

  const keyPair = crypto.key.generateKeyPair();
  localStorage.setItem('appPublicKey', keyPair.publicKey);
  localStorage.setItem('appPrivateKey', keyPair.privateKey);
  return { appPublicKey: keyPair.publicKey, appPrivateKey: keyPair.privateKey };
}

const { appPublicKey, appPrivateKey } = getAppKeysOrGenerate();

function App(): JSX.Element {
  const [transport, setTransport] = useState<Transport | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (transport) {
      const appId = localStorage.getItem('appId');
      if (appId === null) {
        console.log('No Appid stored, please register!');
      } else {
        console.log('get AppId success!');
      }
    }
  }, [transport]);

  async function connect(newTransport: Transport) {
    // await setTransport(await createTransport());
    await setTransport(newTransport);
  }

  async function disconnect() {
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
      <Route path="/" element={<Navigate to="settings" />} />
      <Route
        path="/"
        element={
          <div className="App">
            <Container>
              <Row className="title">
                <p>CoolWallet SDK Tester</p>
              </Row>
              <Row>
                <Col>
                  <HeadBar transport={transport} connect={connect} disconnect={disconnect} />
                </Col>
              </Row>
              <br />
            </Container>
            <Outlet />
          </div>
        }
      >
        <Route
          path="settings"
          element={
            <Settings
              transport={transport}
              appPrivateKey={appPrivateKey}
              appPublicKey={appPublicKey}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
            />
          }
        />
        {Coins.map(({ path, Element }, i) => (
          <Route
            key={i}
            path={path}
            element={
              <Element
                transport={transport}
                appPrivateKey={appPrivateKey}
                appPublicKey={appPublicKey}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
              />
            }
          />
        ))}
        <Route path="*" element={<Navigate to="settings" />} />
      </Route>
    </Routes>
  );
}

export default App;
