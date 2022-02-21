import { coin as COIN, Transport, utils, config, apdu, tx } from '@coolwallet/core';

export default class Template extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super("800001f5");
  }

  getAddress = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {

    const accExtKey = await this.getPublicKey(transport, appPrivateKey, appId, true, addressIndex);
    return accExtKey;
  };

  signTransaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: any,
    script: string,
    argument: string
  ): Promise<any> => {
    try {
      // *** 3. Scriptable Signing ***

      // Scriptable Signing is a process to generate a signature by setting a script
      // and arguments consecutively.

      // 3-1. Script

      // The script aims to describe how a signed data composed from arguments
      // and what to display on the screen for validation.
      // (eg. amount, to-address)

      // const script = '03000202C7070000000091CC07C0022001CAAC570022CC07C0023333CAA0C70016C2ACC700160CCC071099CC07C0028080C3709710DC07C003534F4CBAA0CF6C160E04DDF09700DAACC7C0160C0AD207CC05065052455353425554544F4E';

      // The script signature is generated by the coolwallet team. It secures the
      // transaction against abused formats.

      const scriptSig = 'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

      await apdu.tx.sendScript(transport, script + scriptSig);

      // 3-2. Arguments

      // The arguments are concatenated with custom length and prefixed with
      // a full path. The order of arguments depends on the script. Commands in
      // a script should bring the offset and the length to fetch argument.
      //
      // Format : [fullPath length (1B)] [fullPath (~)] [arguments (~)]

      // const path = await utils.getFullPath({
      //   pathType: config.PathType.BIP32,
      //   // pathString: "44'/60'/0'/0/0",
      //   pathString: "44'/501'/0'"
      // });
      const path = await utils.getPath("800001f5", 0, 3)
      console.log('path :', path);

      const newTx = transaction as any

      // const argument = '15' + path +
      //   handleHex(Buffer.from(transaction.to).toString('hex')) +
      //   handleHex(newTx.fee).padStart(20, "0") +
      //   handleHex(newTx.amount).padStart(20, "0") +
      //   handleHex(transaction.data);
      const extendArgument = '15' + path + argument

      console.log("🚀 ~ file: index.ts ~ line 119 ~ Template ~ argument", extendArgument)


      // *** 4. Validation and The Encrypted Signature ***

      // The executeScript sends arguments and returns a encrypted signature. 
      // A decripting key would be received after transaction validation.

      const encryptedSig = await apdu.tx.executeScript(
        transport,
        appId,
        appPrivateKey,
        extendArgument
      );

      console.log('encryptedSig', encryptedSig)

      // 4-1. The finishPrepare should always be called to end the signing session.

      await apdu.tx.finishPrepare(transport);

      // 4-2. The getTxDetail starts the validation session and displays the transaction
      // information on the screen.

      await apdu.tx.getTxDetail(transport);

      // 4-3. After pressing the button for validating transaction information,
      // the getSignatureKey is allowed to be called to return the decrypting key.

      const decryptingKey = await apdu.tx.getSignatureKey(transport);
      console.log('decryptingKey', decryptingKey)
      // 4-4. Close the validation session.

      await apdu.tx.clearTransaction(transport);

      // 4-5. Call powerOff to reset the screen display.

      await apdu.mcu.control.powerOff(transport);


      // *** 5. Decrypting Signature and Constructing The Signed Transaction ***

      // 5-1. Get the real signature for the transaction

      const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, true);
      console.log('sig', sig)
      // 5-2. (Optional) The getSignedHex is available to check the raw transaction
      // generated by the scriptable signing.

      const { signedTx: rawTx } = await apdu.tx.getSignedHex(transport);
      console.log('rawTx', rawTx)

      console.log("sigedTx: ",
        "01" +
        (sig as Buffer).toString("hex") +
        rawTx
      )

      // 5-3. As a result, a signed transaction should be constructed and return to
      // the client who uses this coin sdk. The signed transactions vary from each
      // other. Please refer to the coin specification which you are integrating.
      // Below sample code is from ETH.

      // const hash = createKeccakHash('keccak256').update(rawData).digest('hex');
      // const data = Buffer.from(handleHex(hash), 'hex');

      // const publicKey = await this.getPublicKey(
      //   transport, appPrivateKey, appId, addressIndex
      // );

      // const keyPair = ec.keyFromPublic(publicKey, 'hex');

      // const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);
      // const v = recoveryParam + 27;
      // const { r, s } = sig as { r: string; s: string; };

      // const vValue = v + transaction.chainId * 2 + 8;
      // const signedTransaction = rawTx.slice(0, 6);
      // signedTransaction.push(
      //   Buffer.from([vValue]),
      //   Buffer.from(r, 'hex'),
      //   Buffer.from(s, 'hex')
      // );
      // const serializedTx = rlp.encode(signedTransaction);
      return 'success';
    } catch (error) {
      console.log("errrrrrrrrrrr: ", error)
    }
  };


  // signTransaction = async (transport: Transport,
  //   appPrivateKey: string,
  //   appId: string,
  //   addressIndex: number,
  //   transaction: any,
  //   script: string,
  //   argument: string): Promise<any> => {
  //     // const { transaction, transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;
  //     const scriptSig = 'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

  //     const extendArgument = '0D' + "8000002C800001f580000000" + argument

  //     const preActions = [];

  //     console.log(script + scriptSig, extendArgument)
    
  //     const sendScript = async () => {
  //       await apdu.tx.sendScript(transport, script + scriptSig);
  //     };
  //     preActions.push(sendScript);
    
  //     const sendArgument = async () => {
  //       return apdu.tx.executeScript(transport, appId, appPrivateKey, extendArgument);
  //     };
    
  //     const signature = await tx.flow.getSingleSignatureFromCoolWallet(
  //       transport,
  //       preActions,
  //       sendArgument,
  //       true,
  //       undefined,
  //       undefined,
  //       false
  //     );
  //     await utils.checkSupportScripts(transport);
    
  //     return signature;
  // }
}
