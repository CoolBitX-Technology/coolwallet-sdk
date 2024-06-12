import { Dropdown } from 'react-bootstrap';

type Props<T extends { name: string }> = {
  icon?: JSX.Element;
  selected: T;
  items: Record<string, T>;
  onSelectItem?(item: T): void;
};

const Picker = <T extends { name: string }>(props: Props<T>) => {
  const onClickItem = (item: T) => () => props.onSelectItem?.(item);

  return (
    <Dropdown id='dropdown-basic-button'>
      <Dropdown.Toggle
        variant='outline-light'
        id='dropdown-autoclose-true'
        style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}
      >
        {props.icon}
        {props.selected.name}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {Object.keys(props.items).map((key) => {
          return (
            <Dropdown.Item key={key} onClick={onClickItem(props.items[key])}>
              {props.items[key].name}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
};

Picker.defaultProps = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSelectItem: function () {},
};

export default Picker;
