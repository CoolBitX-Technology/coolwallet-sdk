import { transport } from '@coolwallet/core';

export type Transport = transport.default;

export type signTxType = {
	transport: Transport,
	appPrivateKey: string,
	appId: string,
	transaction: Object,
	addressIndex: number,
	confirmCB: Function | undefined,
	authorizedCB: Function | undefined
}

