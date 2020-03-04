/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
import ETH from '../src';

const appId = '0533ac5f177331221642adc02f7265bc3edb84d1';
// const appPublicKey = '04cc68637846686549886133daa6acc4dceeed546bc04b8f258211df59ba2e28bbb5d4a1384a920acf0bbd1654dbcb5431ea1629e9856551bccb425c641de9f801';
const appPrivateKey = '57a1c4ecdfc2dad7d392bf0f707ddd7280623f1b7de21e5efd42895b4b178737';

class MockTransport {
  async request(fullCommand) {
    const command = fullCommand.slice(4, 8);
    return ethScriptableResponse(command);
  }
}

const transport = new MockTransport();
const eth = new ETH(transport, appPrivateKey, appId);

test('should sign transaction with script command ', async () => {
  const transaction = {
    chainId: 1,
    nonce: '0x31b',
    gasPrice: '0x3b9aca00',
    gasLimit: '0x520c',
    to: '0x0644De2A0Cf3f11Ef6Ad89C264585406Ea346a96',
    value: '0xde0b6b3a7640000',
    data: '0x00',
  };
  const tx = await eth.signTransaction(transaction, 0);
  expect(tx).toBe('0xf86d82031b843b9aca0082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a76400008026a0b4e08a2e33aaf1d231b5df29dd9bebec506b761a31547cd5f94ed931096e7812a01834892558f5d28c3c2b4dd588457c4eea73563c72e6c24f8d329f0d94928960');
});

const ethScriptableResponse = (command) => {
  switch (command) {
    case '80A6': { // GET_SIGNED_HEX -> return success -> support script command
      return 'eb820319848f0d180082520c940644de2a0cf3f11ef6ad89c264585406ea346a968609184e72a000800180809000';
    }
    case '8054': { // GET_NONCE
      return '72e1488569216da19000';
    }
    case '8028': { // GET_EXT_KEY
      return '04d02edc07a5b0945de7fdc3d7f62c11bc360bc9532f40b6c067b98d2f900b439365a92035a19c4ccbddd27b6a7442658c62bd3f5f1fc23df4aa84a7491751d379bac09cb74b4c3f9c25a61ee30d457ed83182bd8d51f95cebd801442dde7849771bb4b55e2ff7725a8b31fb4a4462c04b8a32f498b3effe481c84b130e3142b62b951fefb0fe15cbd1bc585bca73630554d56149ca88402c5a0ca9c6898a1955e2fdaf1e89000';
    }
    case '80A2': { // EXECUTE_SCRIPT
      return '63e96899cd55f2d935fcf06a2c5b99389a8b3e31aced35cd8962ae9b6a55345c9a388f258f6b6edc3050eeeb7cc9f9019aee907c7866702d910409874e5ae86e2fca9c3f1ef4c3b0c63c88ebbab43e6a9000';
    }
    case '803A': { // GET_TX_KEY
      return 'f7f1ebce055aec57384e580a43e980e674fbf50753c007aff8ac9f29b818281a9000';
    }
    default: { // 80A6 (GET_SIGNED_HEX) 80AC (SEND_SCRIPT)
      return '9000';
    }
  }
};
