/* eslint-disable max-len */
export const core = {
  util: {
    addressIndexToKeyId: () => '3C0000000000',
    checkSupportScripts: () => false,

  },
  flow: {
    prepareSEData: () => Buffer.from('f700003c853c00000000ed82031b84b2d05e0082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a764000080018080'),
    sendDataToCoolWallet: () => ({
      r: 'ac1feeae6a0d9c0b6e23152432a270889495dcfc837db978f10000d38102be02',
      s: '1570ac1cea178b10c2bc4d1693ba6599c80679eac83c2548234a3ad8e4f117a4'
    }),
    sendScriptAndDataToCard: () => ({
      r: '7cce23b352f3c1f11ef4833e76b3b0cb14ca17bb0097d197b307690a551d19ee',
      s: '156703269448e84d2a82e07531375896fd6fc6e0478cdda876315611d4cad697',
    })
  }

};
