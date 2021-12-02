import React, { useState } from 'react';
import { HashRouter as Router, Route, Navigate } from "react-router-dom";
import { Container, Row, Col, Button, Nav, Navbar } from "react-bootstrap";
import WebBleTransport from "@coolwallet/transport-web-ble";
import core, { apdu, Transport } from '@coolwallet/core';
import CorePage from './core-page';
import CoinPage from './coin-page';

import logo from './logo.svg';
import './App.css';

function getAppKeysOrGenerate() {
  let appPublicKey = localStorage.getItem('appPublicKey');
  let appPrivateKey = localStorage.getItem('appPrivateKey');
  if (appPublicKey !== null && appPrivateKey !== null) {
    console.log(`Got Keys from localStorage!`);
    return { appPublicKey, appPrivateKey };
  }

  const keyPair = core.crypto.key.generateKeyPair()
  localStorage.setItem('appPublicKey', keyPair.publicKey)
  localStorage.setItem('appPrivateKey', keyPair.privateKey)
  return { appPublicKey: keyPair.publicKey, appPrivateKey: keyPair.privateKey }
}

function getAppIdOrNull() {
  const appId = localStorage.getItem('appId');
  if (appId === null) {
    console.log('No Appid stored, please register!')
  } else{
    console.log('get AppId success!')
  }
  return appId
}

const { appPublicKey, appPrivateKey } = getAppKeysOrGenerate();

function App() {

  const [transport, setTransport] = useState<Transport | null>(null);
  const [SEPublicKey, setSEPublicKey] = useState('');
  const [cardName, setCardName] = useState('');
  const [appId, setAppId] = useState(getAppIdOrNull());
  const [errorMsg, setErrorMsg] = useState('');

  async function connect() {
    const device = await WebBleTransport.listen();
    console.log(device);
    if (device) {
      const cardName = device.name ?? '';
      const transport = await WebBleTransport.connect(device);
      const SEPublicKey = await core.config.getSEPublicKey(transport)
      setCardName(cardName);
      setTransport(transport);
      setSEPublicKey(SEPublicKey);
    }
  };

  async function disconnect() {
    WebBleTransport.disconnect();
    setTransport(null);
    setCardName('');
  };

  function cancelAPDU() {
    apdu.mcu.control.cancelAPDU(transport!);
    alert("cancel action success!!!");
  };

  function showConnectButton() {
    return cardName ? (
      <Button
        variant="outline-warning"
        style={{ margin: 5 }}
        onClick={disconnect}
      >
        {" "}
        Disconnect
      </Button>
    ) : (
        <Button id="connectButton" variant="light" style={{ margin: 5 }} onClick={connect}>
          Connect
        </Button>
      );
  }

  function cancelButton() {
    return (
      <Button
        variant="outline-warning"
        style={{ margin: 5 }}
        onClick={cancelAPDU}
      >
        cancel action
      </Button>
    )
  };

  function showErrorMessage() {
    return errorMsg ? (
      <Row style={{ margin: 25, background: "white" }}>
        <div style={{ width: "4px", background: "red" }} />
        <Col style={{ paddingTop: 15 }}>
          <p style={{ fontSize: 15, color: "red" }}>{errorMsg}</p>
        </Col>
      </Row>
    ) : (
      <Row style={{ margin: 25 }} />
    );
  }

  return (
    <div className="App">
      <Router>
        <Container>
          <Row>
            <Col>
              <Navbar expand="lg" bg="dark" variant="dark">
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                  <Nav className="mr-auto">
                    <Nav.Link href="#core">Core</Nav.Link>
                    <Nav.Link href="#coin-template">Coin</Nav.Link>
                  </Nav>
                </Navbar.Collapse>
              </Navbar>
            </Col>
          </Row>
          <Row style={{ marginLeft: 20 + 'px' }}   >
            {showConnectButton()}
            {cancelButton()}
            <p style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 10 }}>
              {cardName}
            </p>
          </Row>
          {showErrorMessage()}
        </Container>
        <Router>
          <Route
            path="/"
            children={
              <CorePage
                transport={transport!}
                appPrivateKey={appPrivateKey}
                appPublicKey={appPublicKey}
                appId={appId!}
                setAppId={setAppId}
              />
            }
          />{" "}
          <Route
            path="/coin/"
            children={
              <CoinPage />
            }
          />
        </Router>
      </Router>
    </div>
  );
}

export default App
