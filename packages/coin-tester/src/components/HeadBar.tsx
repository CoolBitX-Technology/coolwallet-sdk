import React, { useState } from 'react';
import {
  Container,
  Navbar,
  Nav,
  NavDropdown,
  Form,
  FormControl,
  Button
} from 'react-bootstrap';
import { Outlet, Link } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap'
import { Transport } from '@coolwallet/core';
import './HeadBar.css';

const defaultPath = '/settings';

function HeadBar(input: {
  transport: Transport | null,
  connect: () => void,
  disconnect: () => void,
}): JSX.Element {
  const [activeTab, setActiveTab] = useState(defaultPath);

  return (
    <Navbar variant='dark' expand='lg'>
      <Container fluid>
        <Nav
          variant='tabs'
          activeKey={activeTab}
          onSelect={(key) => {
            if (typeof key === 'string') {
              console.log('key :', key);
              if (key === defaultPath) {
                setActiveTab(defaultPath);
              } else {
                key = key.slice(1);
                key = key.charAt(0).toUpperCase() + key.substring(1);
                setActiveTab(key);
              }
            }
          }}
        >
          <Nav.Item>
            <LinkContainer to={defaultPath}>
              <Nav.Link className='NavItem'>
                Settings
              </Nav.Link>
            </LinkContainer>
          </Nav.Item>
          <Nav.Item>
            <NavDropdown className='NavItem' title={activeTab === defaultPath ? 'Coins' : activeTab} id='collasible-nav-dropdown'>
              <LinkContainer to="template">
                <NavDropdown.Item>Template</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </Nav.Item>
        </Nav>
        <Form className='d-flex'>
          <FormControl
            placeholder={input.transport?.device.name ?? 'Card Name'}
            className='me-2'
            aria-label='Card Name'
            disabled
          />
          {input.transport
            ? (
              <Button variant='outline-warning' onClick={input.disconnect}>
                Disconnect
              </Button>
            )
            : (
              <Button variant='light' onClick={input.connect}>
                Connect
              </Button>
            )}
        </Form>
      </Container>
    </Navbar>
  );
}

export default HeadBar;
