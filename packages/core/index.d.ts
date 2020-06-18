declare module '@coolwallet/core' {
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
				transport: Transport,
				signature: string
			): Promise<
				Array<{
					appId: string;
					appName: string;
				}>
			>;
			export function removePairedDevice(
				transport: Transport,
				appIdWithSig: string
			): Promise<
				Boolean
			>;
			export function renameDevice(
				transport: Transport,
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

	export namespace coin {
		export class ECDSACoin {
			public transport: Transport;

			public appId: string;

			public appPrivateKey: string;

			public coinType: string;

			constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string);

			getPublicKey(addressIndex: number): Promise<string>;

			getBIP32NodeInfo(): Promise<{ parentPublicKey: string; parentChainCode: string }>;
		}

		export class EDDSACoin {
			public transport: Transport;

			public appId: string;

			public appPrivateKey: string;

			public coinType: string;

			constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string);

			getPublicKey(addressIndex: number, protocol:string): Promise<string>;
		}
	}

	export namespace error {
		export class SDKError {
			public name: string
			constructor(name: string, message: string);
		}
	}
	export class Transport {
		constructor(
			device: any,
			sendCommandToCard: Function,
			sendDataToCard: Function,
			checkCardStatus: Function,
			readCharacteristic: Function)

		static isSupported(): Promise<boolean>;

		static listen(callback: (error: Error, device: any) => void): any;

		static connect(deviceOrId: object | string): Promise<Transport>;

		static disconnect(deviceOrId: object | string): Promise<void>;

		static setOnDisconnect(deviceOrId: object | string, onDisconnect: Function): void;

		sendCommandToCard(command: number[]): Promise<void>;

		sendDataToCard(packets: number[]): Promise<void>;

		checkCardStatus(): Promise<number>;

		readDataFromCard(): Promise<number[]>;
	}
	
	export namespace device {
		export type DeviceModelId = string;

		export type DeviceModel = {
			id: string,
			productName: string,
			bluetoothSpec?: Array<{
				serviceUuid: string,
				writeUuid: string,
				dataUuid: string,
				checkUuid: string,
				readUuid: string
			}>
		};

		export type BluetoothInfos = {
			deviceModel: DeviceModel,
			serviceUuid: string,
			writeUuid: string,
			dataUuid: string,
			checkUuid: string,
			readUuid: string
		};

		export function getBluetoothServiceUuids(): string[];

		export function getInfosForServiceUuid(uuid: string): BluetoothInfos;
	}

}
