/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
import ETH from '../src';

const appId = '0533ac5f177331221642adc02f7265bc3edb84d1';
// const appPublicKey = '04cc68637846686549886133daa6acc4dceeed546bc04b8f258211df59ba2e28bbb5d4a1384a920acf0bbd1654dbcb5431ea1629e9856551bccb425c641de9f801';
const appPrivateKey = '57a1c4ecdfc2dad7d392bf0f707ddd7280623f1b7de21e5efd42895b4b178737';

class MockTransport {
  constructor() {
    this.name = 'Mock Transport';
  }

  async request(fullCommand) {
    const command = fullCommand.slice(4, 8);
    switch (command) {
      case '80A6': { // GET_SIGNED_HEX
        return '6d00';
      }
      case '8054': { // GET_NONCE
        return '72e1488569216da19000';
      }
      case '8050': { // SAY HI
        return '9000';
      }
      case '802C': { // AUTH_EXT_KEY
        return '9000';
      }
      case '8028': { // GET_EXT_KEY
        return '04d02edc07a5b0945de7fdc3d7f62c11bc360bc9532f40b6c067b98d2f900b439365a92035a19c4ccbddd27b6a7442658c62bd3f5f1fc23df4aa84a7491751d379bac09cb74b4c3f9c25a61ee30d457ed83182bd8d51f95cebd801442dde7849771bb4b55e2ff7725a8b31fb4a4462c04b8a32f498b3effe481c84b130e3142b62b951fefb0fe15cbd1bc585bca73630554d56149ca88402c5a0ca9c6898a1955e2fdaf1e89000';
      }
      case '8032': { // TX_PREP
        return '8462f047063294959645cb731c2a0badfaa2be352ae1d5ac8f35cc8e7867b144d661caf95fa729c3c4618aa80ae51963f480dff733168ce6230ceaf4e4c005d43b47878c6bbbbc65c94c8fb45070cd609000';
      }
      case '8034': { // FINISH_PREP
        return '9000';
      }
      case '8036': {
        return '9000';
      }
      case '803A': { // GET_TX_KEY
        return '170ad2e81afa2d03297299bb552a287579a1de5df942ebf01291f6c1fe14a1a49000';
      }
      case '8030': { // CLEAR_TX
        return '9000';
      }
      case '7F80': {
        return '9000';
      }
      default: {
        throw new Error('not mocked');
      }
    }
  }
}

const transport = new MockTransport();
const eth = new ETH(transport, appPrivateKey, appId);

test('should get address ', async () => {
  const address = await eth.getAddress(0);
  expect(address).toBe('0xbAF99eD5b5663329FA417953007AFCC60f06F781');
});

test('should sign transaction ', async () => {
  const transaction = {
    chainId: 1,
    nonce: '0x31b',
    gasPrice: '0xee6b2800',
    gasLimit: '0x520c',
    to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
    value: '0xde0b6b3a7640000',
    data: '0x00'
  };
  const tx = await eth.signTransaction(transaction, 0);
  expect(tx).toBe('0xf86d82031b84ee6b280082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a76400008025a0fa6ec1b0fe76146835b77d1d5155c43b91186bd2a6ab89e44a6498515050ce1aa04a068bf387357def9ce2b98e7ac75f7513bee96d2f34620a5345ac61f5d6af5e');
});
