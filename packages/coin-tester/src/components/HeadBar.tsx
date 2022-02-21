import React, { useState } from 'react';
import { Container, Navbar, Nav, NavDropdown, Form, FormControl, Button, ButtonGroup } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { createTransport as createBLETransport } from '@coolwallet/transport-web-ble';
import { createTransport as createHttpTransport } from '@coolwallet/transport-jre-http';
import { Transport } from '@coolwallet/core';
import Coins from './coins';

import './HeadBar.css';

const defaultPath = '/settings';

function HeadBar(input: {
  transport?: Transport;
  connect: (newTransport: Transport) => void;
  disconnect: () => void;
}): JSX.Element {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  return (
    <Navbar variant='dark' expand='lg'>
      <Container fluid>
        <Nav
          variant='tabs'
          activeKey={activeTab}
          onSelect={(key) => {
            if (typeof key === 'string') {
              setActiveTab(key);
            }
          }}
        >
          <LinkContainer to={defaultPath}>
            <Nav.Link className='NavItem'>Settings</Nav.Link>
          </LinkContainer>
          <NavDropdown
            active={activeTab !== defaultPath}
            menuVariant='dark'
            className='NavItem'
            title={activeTab === defaultPath ? 'Coins' : `Coin-${activeTab.slice(1)}`}
            id='nav-dropdown'
          >
            {Coins.map(({ path }, i) => (
              <LinkContainer key={i} to={path}>
                <NavDropdown.Item>{path}</NavDropdown.Item>
              </LinkContainer>
            ))}
          </NavDropdown>
        </Nav>
        <Form className='d-flex col-4'>
          <FormControl
            placeholder={input.transport?.device.name ?? 'Card Name'}
            className='me-2'
            aria-label='Card Name'
            disabled
          />
          {input.transport ? (
            <Button variant='outline-success' onClick={input.disconnect}>
              Disconnect
            </Button>
          ) : (
            <ButtonGroup className='d-flex connect-btn'>
              <Button
                variant='success'
                onClick={async () => {
                  input.connect(await createBLETransport());
                }}
              >
                BLE
              </Button>
              <Button
                variant='success'
                onClick={async () => {
                  input.connect(await createHttpTransport());
                }}
              >
                HTTP
              </Button>
            </ButtonGroup>
          )}
        </Form>
      </Container>
    </Navbar>
  );
}

export default HeadBar;
