import React from 'react';
import { Form, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';

export const NoInput = (input: {
  title: string,
  content: string,
  onClick: () => void,
  disabled: boolean,
  btnName?: string,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={8} className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'Get'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);

export const OneInput = (input: {
  title: string,
  content: string,
  onClick: () => void,
  disabled: boolean,
  btnName?: string,
  value: string,
  setValue?: (value: string) => void,
  setNumberValue?: (value: number) => void,
  placeholder: string,
  inputSize?: number,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={input.inputSize ?? 3} className='input-col'>
      <Form.Control
        value={input.value}
        onChange={(event) => {
          if (input.setValue) {
            input.setValue(event.target.value);
          } else if (input.setNumberValue) {
            const value = parseInt(event.target.value);
            input.setNumberValue(value? value : 0);
          }
        }}
        placeholder={input.placeholder}
      />
    </Col>
    <Col xs={input.inputSize ? 8-input.inputSize : 5} className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'Send'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);

export const TwoInputs = (input: {
  title: string,
  content: string,
  onClick: () => void,
  disabled: boolean,
  btnName?: string,
  value: string,
  setValue?: (value: string) => void,
  setNumberValue?: (value: number) => void,
  placeholder: string,
  inputSize?: number,
  value2: string,
  setValue2?: (value: string) => void,
  setNumberValue2?: (value: number) => void,
  placeholder2: string,
  inputSize2?: number,
}): JSX.Element => {
  const inputSize = input.inputSize ?? 2;
  const inputSize2 = input.inputSize2 ?? 2;
  const outputSize = 8 - inputSize - inputSize2;
  return (<Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={inputSize} className='input-col'>
      <Form.Control
        value={input.value}
        onChange={(event) => {
          if (input.setValue) {
            input.setValue(event.target.value);
          } else if (input.setNumberValue) {
            const value = parseInt(event.target.value);
            input.setNumberValue(value? value : 0);
          }
        }}
        placeholder={input.placeholder}
      />
    </Col>
    <Col xs={inputSize2} className='input-col'>
      <Form.Control
        value={input.value2}
        onChange={(event) => {
          if (input.setValue2) {
            input.setValue2(event.target.value);
          } else if (input.setNumberValue2) {
            const value = parseInt(event.target.value);
            input.setNumberValue2(value? value : 0);
          }
        }}
        placeholder={input.placeholder2}
      />
    </Col>
    <Col xs={outputSize} className='show-text-area'>
      {input.content}
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'Send'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>);
};

export const ObjInputs = (input: {
  title: string,
  content: string,
  onClick: () => void,
  disabled: boolean,
  btnName?: string,
  keys: string[],
  values: string[],
  setValues: (values: string[]) => void,
}): JSX.Element => (
  <Row className='function-component'>
    <Col xs={2}>
      {input.title}
    </Col>
    <Col xs={8}>
      {input.keys.map((key, i) => (
        <Row key={i} className='function-component'>
          <Col xs={3} className='input-title'>
            {key}
          </Col>
          <Col xs={9}>
            <Form.Control
              value={input.values[i]}
              onChange={(event) => {
                const values = [...input.values];
                values[i] = event.target.value;
                input.setValues(values);
              }}
              placeholder={key}
            />
          </Col>
        </Row>
      ))}
      <Row className='function-component'>
        <Col className='show-text-area'>
          {input.content}
        </Col>
      </Row>
    </Col>
    <Col xs={2}>
      <ButtonGroup className='d-flex'>
        <Button
          disabled={input.disabled}
          variant='outline-light'
          onClick={input.onClick}
        >
          {input.btnName ?? 'Send'}
        </Button>
      </ButtonGroup>
    </Col>
  </Row>
);

