declare module '@coolwallets/core' {
	type Transport = import('@coolwallets/transport').default;
	export namespace apdu {
		export namespace coin {
			export function authGetExtendedKey(
				transport: Transport,
				signature: string
			): Promise<
				string
			>;
			export function getAccountExtendedKey(
				transport: Transport,
				coinType: string,
				accIndex: string
			): Promise<
				string
			>;
			export function getEd25519AccountPublicKey(
				transport: Transport,
				coinType: string,
				accIndex: string,
				protocol: string
			): Promise<
				string
			>;
		}

		export namespace control {
			export function sayHi(
				transport: Transport,
				appId: string
			): Promise<
				Boolean
			>;
			export function getNonce(
				transport: Transport
			): Promise<
				string
			>;
			export function cancelAPDU(
				transport: Transport
			): Promise<
				void
			>;
			export function powerOff(
				transport: Transport
			): Promise<
				void
			>;
		}

		export namespace pairing {
			export function registerDevice(
				transport: Transport,
				data: string,
				P1: string
			): Promise<
				string
			>;
			export function getPairingPassword(
				transport: Transport,
				data: string
			): Promise<
				string
			>;
			export function getPairedApps(
				trasnport: Transport,
				signature: string
			): Promise<
				Array<{
					appId: string;
					appName: string;
				}>
			>;
			export function removePairedDevice(
				trasnport: Transport,
				appIdWithSig: string
			): Promise<
				Boolean
			>;
			export function renameDevice(
				trasnport: Transport,
				nameWithSig: string
			): Promise<
				Boolean
			>;
		}

		export namespace setting {
			export function resetCard(
				transport: Transport
			): Promise<
				boolean
			>;
			export function getCardInfo(
				transport: Transport
			): Promise<
				string
			>;
			export function getSEVersion(
				transport: Transport
			): Promise<
				number
			>;
		}

		export namespace tx {
			export function setChangeKeyId(
				transport: Transport,
				pathWithSig: string,
				redeemType: string
			): Promise<
				string
			>;
		}
	}

	export namespace config {
		export namespace KEY {
			export const SEPublicKey: string;
		}
	}

	export namespace core {
		export namespace auth {
			export function getCommandSignature(
				transport: Transport,
				appId: string,
				appPrivateKey: string,
				commandName: string,
				data: string,
				params1?: string,
				params2?: string
			): Promise<{
				signature: string;
				forceUseSC: boolean;
			}>;

			/* export function generalAuthorization(
				transport: Transport,
				appId: string,
				appPrivateKey: string,
				commandName: string,
				data: string,
				params1?: string,
				params2?: string,
				test?: string
			): Promise<
				string
			>; */

			export function versionCheck(
				transport: Transport,
				requiredSEVersion: number
			): Promise<
				void
			>;
		}

		export namespace flow {
			export function prepareSEData(
				keyId: string,
				rawData:
					| Buffer
					| Array<
						Buffer
					>,
				readType: string
			): string;
			export function sendDataToCoolWallet(
				transport: Transport,
				appId: String,
				appPrivateKey: String,
				txDataHex: String,
				txDataType: String,
				isEDDSA?: Boolean,
				preAction?: Function,
				txPrepareCompleteCallback?: Function,
				authorizedCallback?: Function,
				returnCanonical?: Boolean
			): Promise<
				| {
					r: string;
					s: string;
				}
				| string
				| Buffer
			>;
			export function sendScriptAndDataToCard(
				transport: Transport,
				appId: string,
				appPrivateKey: string,
				script: string,
				argument: string,
				isEDDSA?: boolean,
				txPrepareComplteCallback?: Function,
				authorizedCallback?: Function,
				return_canonical?: boolean
			): Promise<
				string
			>;
			export function sendBatchDataToCoolWallet(
				transport: Transport,
				appId: String,
				appPrivateKey: String,
				preActions: Function[],
				actions: Function[],
				isEDDSA?: Boolean,
				txPrepareCompleteCallback?: Function,
				authorizedCallback?: Function,
				returnCanonical?: Boolean
			): Promise<
				Array<
					| {
						r: string;
						s: string;
					}
					| Buffer
				>
			>;
		}

		export namespace util {
			export function getEncryptedSignatures(
				transport: Transport,
				TxpPrepCommands: Array<{
					encodedData: String;
					P1: String;
					P2: String;
				}>
			): Promise<
				Array<{
					encryptedSignature: String;
					publicKey: String;
				}>
			>;

			export function addressIndexToKeyId(
				coinType: string,
				addressIndex: number
			): string;
			/* export function getEncryptedSignatures(
        transport: Transport,
        actions: [Function],
        appPrivateKey: string,
        txPrepareCompleteCallback?: Function
      ): Promise<Array<string>>; */
			export function prepareOutputData(
				transport: Transport,
				txDataHex: string,
				txDataType: string
			): void;
			export function prepareTx(
				transport: Transport,
				txDataHex: string,
				txDataType: string,
				appPrivateKey: string
			): string;
		}

		export namespace controller {
			export function checkSupportScripts(
				transport: Transport
			): Promise<
				boolean
			>;
		}
	}

	export namespace crypto {
		export namespace encryption {
			export function ECIESenc(
				recipientPubKey: string,
				msg: string
			): string;
			export function ECIESDec(
				recipientPrivKey: string,
				encryptionName: string
			): Buffer;
		}
	}
}
