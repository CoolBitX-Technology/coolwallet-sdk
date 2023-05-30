const TRANSFER_TRANSACTION = [
  {
    nonce: '0x0',
    gasPrice: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '',
  },
];

const ERC20_TRANSACTION = [
  {
    nonce: '0x0',
    gasPrice: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0x0',
    amount: '0.1',
  },
];

const SMART_CONTRACT_TRANSACTION = [
  {
    nonce: '0x0',
    gasPrice: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '0x96Cd30C0C545f2656Ba40b00E0263A934532fa25',
  },
  {
    nonce: '0x40',
    gasPrice: '0xa0954bf07',
    gasLimit: '0xb504',
    to: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    value: '0.00001',
    data: `0x095ea7b3000000000000000000000000bdcc4dbd6bbccc5b0d1c83c62d6ceeef1746a48a0000000000000000000000000000000000000000000000000000000000000001`,
  },
  {
    nonce: '0x2',
    gasPrice: '0x91494C600',
    gasLimit: '0x5208',
    to: '',
    value: '0',
    data: '0x6080604052348015610010576000'.padEnd(32, '0'),
  },
];

const SMART_CONTRACT_SEGMENT_TRANSACTION = [
  {
    nonce: '0x0',
    gasPrice: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '0x96Cd30C0C545f2656Ba40b00E0263A934532fa25'.padEnd(16000, '0'),
  },
  {
    nonce: '0x4',
    gasPrice: '0x9502f90e',
    gasLimit: '0x112f0e',
    to: '',
    value: '0',
    data: '0x608060405234801562000011576000'.padEnd(16000, '0'),
  },
];

const TYPED_DATA_TRANSACTION = [
  {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Order: [
        { name: 'exchange', type: 'address' },
        { name: 'maker', type: 'address' },
        { name: 'taker', type: 'address' },
        { name: 'makerRelayerFee', type: 'uint256' },
        { name: 'takerRelayerFee', type: 'uint256' },
        { name: 'makerProtocolFee', type: 'uint256' },
        { name: 'takerProtocolFee', type: 'uint256' },
        { name: 'feeRecipient', type: 'address' },
        { name: 'feeMethod', type: 'uint8' },
        { name: 'side', type: 'uint8' },
        { name: 'saleKind', type: 'uint8' },
        { name: 'target', type: 'address' },
        { name: 'howToCall', type: 'uint8' },
        { name: 'calldata', type: 'bytes' },
        { name: 'replacementPattern', type: 'bytes' },
        { name: 'staticTarget', type: 'address' },
        { name: 'staticExtradata', type: 'bytes' },
        { name: 'paymentToken', type: 'address' },
        { name: 'basePrice', type: 'uint256' },
        { name: 'extra', type: 'uint256' },
        { name: 'listingTime', type: 'uint256' },
        { name: 'expirationTime', type: 'uint256' },
        { name: 'salt', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    domain: {
      name: 'Wyvern Exchange Contract',
      version: '2.3',
      chainId: 1,
      verifyingContract: '0x7f268357a8c2552623316e2562d90e642bb538e5',
    },
    primaryType: 'Order',
    message: {
      maker: '0xbdcc4dbd6bbccc5b0d1c83c62d6ceeef1746a48a',
      exchange: '0x7f268357a8c2552623316e2562d90e642bb538e5',
      taker: '0x0000000000000000000000000000000000000000',
      makerRelayerFee: '250',
      takerRelayerFee: '0',
      makerProtocolFee: '0',
      takerProtocolFee: '0',
      feeRecipient: '0x5b3256965e7c3cf26e11fcaf296dfc8807c01073',
      feeMethod: 1,
      side: 1,
      saleKind: 0,
      target: '0xbaf2127b49fc93cbca6269fade0f7f31df4c88a7',
      howToCall: 1,
      calldata: `0x96809f90000000000000000000000000bdcc4dbd6bbccc5b0d1c83c62d6ceeef1746a48a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d07dc4262bcdbf85190c01c996b4c06a461d243000000000000000000000000000000000000000000000000000000000000b668f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000`,
      replacementPattern: `0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
      staticTarget: '0x0000000000000000000000000000000000000000',
      staticExtradata: '0x',
      paymentToken: '0x0000000000000000000000000000000000000000',
      basePrice: '100000000000000',
      extra: '0',
      listingTime: '1646360374',
      expirationTime: '1646965260',
      salt: '74000149914510975405190780544863990949311878905588154472610807045828601115975',
      nonce: 0,
    },
  },
];

const MESSAGE_TRANSACTION = [
  `0x4920776f756c64206c696b6520746f2075706461746520707265666572656e6365732e20557365726e616d65206973204342583636362c207069637475726520697320697066733a2f2f697066732f516d56676b3578337136476233484a7136556f444d517053475542535839753462345a4268794e733959463766522c2073686f72742075726c206973206e756c6c2c20636f76657220697320697066733a2f2f697066732f516d5365575968544b4c5056624d6e7171627269474e38567756654362534175736f694d385739645833596f644b2c206465736372697074696f6e206973202768656c6c6f20776f726c647e0a0a272c20656d6f6a69206973206e756c6c2c206a6f62206973206e756c6c2c20656d706c6f796572206973206e756c6c2c2077656273697465206973206e756c6c2c206c6f636174696f6e206973206e756c6c2c2072656365697665456d61696c4e6f74696669636174696f6e732069732074727565`,
];

const EIP1559_TRANSFER_TRANSACTION = [
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '',
  },
];

const EIP1559_ERC20_TRANSACTION = [
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0x0',
    amount: '0.1',
  },
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0x00',
    amount: '0.1',
  },
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '',
    amount: '0.1',
  },
];

const EIP1559_SMART_CONTRACT_TRANSACTION = [
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '0x96Cd30C0C545f2656Ba40b00E0263A934532fa25',
  },
  {
    nonce: '0x4',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '',
    value: '0',
    data: '0x608060405234801562000011576000'.padEnd(16000, '0'),
  },
];

const EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION = [
  {
    nonce: '0x0',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '0x8A1628c2397F6cA75579A45E81EE3e17DF19720e',
    value: '0.00001',
    data: '0x96Cd30C0C545f2656Ba40b00E0263A934532fa25'.padEnd(16000, '0'),
  },
  {
    nonce: '0x9',
    gasFeeCap: '0x91494C600',
    gasTipCap: '0x91494C600',
    gasLimit: '0x5208',
    to: '',
    value: '0',
    data: '0x608060405234801562000011576000'.padEnd(16000, '0'),
  },
];

export {
  TRANSFER_TRANSACTION,
  ERC20_TRANSACTION,
  SMART_CONTRACT_TRANSACTION,
  SMART_CONTRACT_SEGMENT_TRANSACTION,
  TYPED_DATA_TRANSACTION,
  MESSAGE_TRANSACTION,
  EIP1559_TRANSFER_TRANSACTION,
  EIP1559_ERC20_TRANSACTION,
  EIP1559_SMART_CONTRACT_TRANSACTION,
  EIP1559_SMART_CONTRACT_SEGMENT_TRANSACTION,
};
