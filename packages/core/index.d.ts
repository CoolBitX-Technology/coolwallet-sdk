declare module '@coolwallets/core' {
  type Transport = import('@coolwallets/transport').default;
  export namespace apdu {
    export namespace coin {
      export function authGetExtendedKey(transport: Transport, signature: string): Promise<string>;
      export function getAccountExtendedKey(
        transport: Transport,
        coinType: string,
        accIndex: string
      ): Promise<string>;
      export function getEd25519AccountPublicKey(
        transport: Transport,
        coinType: string,
        accIndex: string,
        protocol: string
      ): Promise<string>;
    }

    export namespace control {
      export function sayHi(transport: Transport, appId: string): Promise<Boolean>;
      export function getNonce(transport: Transport): Promise<string>;
      export function cancelAPDU(transport: Transport): Promise<void>;
      export function powerOff(transport: Transport): Promise<void>;
    }

    export namespace pairing {
      export function registerDevice(
        transport: Transport,
        data: string,
        P1: string
      ): Promise<string>;
      export function getPairingPassword(transport: Transport, data: string): Promise<string>;
      export function getPairedApps(
        trasnport: Transport,
        signature: string
      ): Promise<Array<{ appId: string; appName: string }>>;
      export function removePairedDevice(
        trasnport: Transport,
        appIdWithSig: string
      ): Promise<Boolean>;
      export function renameDevice(trasnport: Transport, nameWithSig: string): Promise<Boolean>;
    }

    export namespace setting {
      export function resetCard(transport: Transport): Promise<boolean>;
      export function getCardInfo(transport: Transport): Promise<string>;
      export function getSEVersion(transport: Transport): Promise<number>;
    }
  }

  export namespace config {
    export namespace KEY {
      export const SEPublicKey: string;
    }
  }

  export namespace core {
    export namespace auth {
      export function generalAuthorization(
        transport: Transport,
        appId: string,
        appPrivateKey: string,
        commandName: string,
        data: string,
        params1: string,
        params2: string,
        test: string
      ): Promise<string>;

      export function versionCheck(transport: Transport, requiredSEVersion: number): Promise<void>;
    }

    export namespace flow {
      export function prepareSEData(
        keyId: string,
        rawData: Buffer | Array<Buffer>,
        readType: string
      ): Buffer;
      export function sendDataToCoolWallet(
        transport: Transport,
        appId: String,
        appPrivateKey: String,
        data: Buffer,
        P1: String,
        P2: String,
        isEDDSA?: Boolean,
        preAction?: Function,
        txPrepareComplteCallback?: Function,
        authorizedCallback?: Function,
        returnCanonical?: Boolean
      ): Promise<{ r: string; s: string } | string | Buffer>;
    }

    export namespace util {
      export function addressIndexToKeyId(coinType: string, addressIndex: number): string;
    }
  }

  export namespace crypto {
    export namespace encryption {
      export function ECIESenc(recipientPubKey: string, msg: string): string;
      export function ECIESDec(recipientPrivKey: string, encryptionName: string): Buffer;
    }
  }
}
