type GetAddress = {
  sequence: string;
  account_number: string;
};

type AddressBalance = {
  denom: string;
  amount: string;
};

type AddressDelegation = {
  validator_address: string;
  denom: string;
  amount: string;
};

export { GetAddress, AddressBalance, AddressDelegation };
