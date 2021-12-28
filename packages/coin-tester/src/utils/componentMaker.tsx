import React from 'react';
import { Form, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';

export const NoInput = (input: {
  title: string,
  content: string,
  btnName?: string,
  onClick: () => void,
  disabled: boolean,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'get'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);

export const OneInput = (input: {
  title: string,
  content: string,
  btnName: string | undefined,
  onClick: () => void,
  disabled: boolean,
  value: string,
  setValue: (value: string) => void,
  placeholder: string,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={3} className='input-col'>
      <Form.Control
        value={input.value}
        onChange={(event) => {
          input.setValue(event.target.value);
        }}
        placeholder={input.placeholder}
      />
    </Col>
    <Col className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'send'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);

export const TwoInputs = (input: {
  title: string,
  content: string,
  btnName: string | undefined,
  onClick: () => void,
  disabled: boolean,
  value: string,
  setValue: (value: string) => void,
  placeholder: string,
  value2: string,
  setValue2: (value: string) => void,
  placeholder2: string,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={2} className='input-col'>
      <Form.Control
        value={input.value}
        onChange={(event) => {
          input.setValue(event.target.value);
        }}
        placeholder={input.placeholder}
      />
    </Col>
    <Col xs={2} className='input-col'>
      <Form.Control
        value={input.value2}
        onChange={(event) => {
          input.setValue2(event.target.value);
        }}
        placeholder={input.placeholder2}
      />
    </Col>
    <Col className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'send'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);
