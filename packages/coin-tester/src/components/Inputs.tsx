import React, { memo, FC } from 'react';
import { Row, Col, ButtonGroup, Button as BootStrapButton, Form } from 'react-bootstrap';
import './Inputs.css'

const row = 'inputs-component';

const textArea = 'text-area';

const inputCol = 'input-col';

const buttonGroup = 'button-group';

const button = 'button';

interface Input {
  xs?: number;
  value: string;
  placeholder: string;
  onChange(value: string): void;
}

interface Props {
  title: string;
  inputs: Input[];
  content: string;
  onClick(): void;
  btnTitle?: string;
  variant?: string;
  disabled?: boolean;
}

const ButtonInputs: FC<Props> = (props: Props) => {
  return (
    <Row className={row}>
      <Col xs={2}>{props.title}</Col>
      {props.inputs.map((input, i) => (
        <Col xs={input.xs ?? 2} key={'' + i + ''} className={inputCol}>
          <Form.Control
            value={input.value}
            onChange={(event) => {
              input.onChange(event.target.value);
            }}
            placeholder={input.placeholder}
          />
        </Col>
      ))}
      <Col className={textArea}>{props.content}</Col>
      <Col xs={2}>
        <ButtonGroup className={buttonGroup}>
          <BootStrapButton className={button} variant={props.variant} disabled={props.disabled} onClick={props.onClick}>
            {props.btnTitle}
          </BootStrapButton>
        </ButtonGroup>
      </Col>
    </Row>
  );
};

ButtonInputs.defaultProps = { disabled: false, variant: 'outline-light', btnTitle: 'Get' };

export default memo(ButtonInputs);
