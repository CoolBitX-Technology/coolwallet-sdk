const MSG_SEND = [
  {
    account_number: 350,
    sequence: 46489,
    toAddress: 'kava1ys70jvnajkv88529ys6urjcyle3k2j9r24g6a7',
    coin: {
      denom: 'ukava',
      amount: 7429807824,
    },
    fee: {
      denom: 'ukava',
      amount: 6294,
      gas_limit: 125880,
    },
    memo: '',
    txHash: '1C4448B726332D05B64ACAA8993D42F72D2C5BF3AE65E09C26BB68AC5750D067',
  },
];

const MSG_DELEGATE = [
  {
    account_number: 399081,
    sequence: 6,
    validator_address: 'kavavaloper1ffcujj05v6220ccxa6qdnpz3j48ng024ykh2df',
    coin: {
      denom: 'ukava',
      amount: 700000,
    },
    fee: {
      denom: 'ukava',
      amount: 12500,
      gas_limit: 250000,
    },
    memo: '',
    txHash: 'ED23669D04D29F3B29EF3043A7A19B1BD22CE426031E3E9067692F50BA45D54E',
  },
  {
    account_number: 2206870,
    sequence: 0,
    coin: {
      denom: 'ukava',
      amount: 845000,
    },
    fee: {
      denom: 'ukava',
      amount: 5000,
      gas_limit: 500000,
    },
    memo: '',
    validator_address: 'kavavaloper1ffcujj05v6220ccxa6qdnpz3j48ng024ykh2df',
    txHash: '92E156492A5072B1BAE4B0EA94902FE6EA7A765C02ED27BC5D90DF650662186B',
  },
];

const MSG_UNDELEGATE = [
  {
    account_number: 2206870,
    sequence: 1,
    coin: {
      denom: 'ukava',
      amount: 845000,
    },
    fee: {
      denom: 'ukava',
      amount: 5000,
      gas_limit: 500000,
    },
    validator_address: 'kavavaloper1ffcujj05v6220ccxa6qdnpz3j48ng024ykh2df',
    memo: '',
    txHash: '512F37C61CDEA5A48B524A364EA9996CF045F515E5DE99184B36DD276A3B2733',
  },
];

const MSG_WITHDRAW = [
  {
    account_number: 292642,
    sequence: 26,
    validator_address: 'kavavaloper1c9ye54e3pzwm3e0zpdlel6pnavrj9qqvh0atdq',
    fee: {
      denom: 'ukava',
      amount: 14000,
      gas_limit: 140000,
    },
    memo: '',
    txHash: '932DE9DEB9FDB009A30CC12144BE0B9D8D4B43A0366148889D0E7836CF579938',
  },
];

export { MSG_SEND, MSG_DELEGATE, MSG_UNDELEGATE, MSG_WITHDRAW };
