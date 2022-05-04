import { DenomInfo, DENOMTYPE } from '@coolwallet/terra';
import { Col, Dropdown, Form } from 'react-bootstrap';

interface Props {
  title: string;
  denom: DenomInfo;
  setDenom(denom: DenomInfo): void;
  hideAmount?: boolean;
  amount?: string;
  setAmount?(amount: string): void;
}

const AmountAdjustment = (props: Props) => (
  <>
    <Col xs={2} md={1}>
      {`${props.title}:`}
    </Col>
    <Col xs={2}>
      <Dropdown
        onSelect={(e) => {
          const selectedItem = e as keyof typeof DENOMTYPE;
          props.setDenom(DENOMTYPE[selectedItem]);
        }}
      >
        <Dropdown.Toggle variant='primary'>{props.denom.name}</Dropdown.Toggle>

        <Dropdown.Menu className='limited-dropdown'>
          {Object.values(DENOMTYPE).map(function (denomT) {
            return (
              <Dropdown.Item key={denomT.name} eventKey={denomT.name}>
                {denomT.name}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </Col>
    {!props.hideAmount && (
      <Col xs={3} md={2}>
        <Form.Control
          type='number'
          placeholder='amount'
          value={props.amount}
          onChange={(event) => {
            props.setAmount?.(event.target.value);
          }}
        />
      </Col>
    )}
  </>
);

AmountAdjustment.defaultProps = {
  hideAmount: false,
  amount: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAmount: function () {},
};

export default AmountAdjustment;
