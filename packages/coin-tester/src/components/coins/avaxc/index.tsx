import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

const Web3 = require('web3');
const sigUtil = require('eth-sig-util');

const web3 = new Web3('https://api.avax-test.network/ext/bc/C/rpc');

import Template from '@coolwallet/avaxc';

interface Props {
	transport: Transport | null;
	appPrivateKey: string;
	appPublicKey: string;
	isLocked: boolean;
	setIsLocked: (isLocked: boolean) => void;
}

function CoinTemplate(props: Props) {
	const temp = new Template();
	const [address, setAddress] = useState('');
	const [signedTransaction, setSignedTransaction] = useState('');
	const [signedERC20Transaction, setSignedERC20Transaction] = useState('');
	const [signedSmartContractTransaction, setSignedSmartContractTransaction] = useState('');
	const [signedMessage, setSignedMessage] = useState('');
	const [signedTypedData, setSignedTypedData] = useState('');
	const [value, setValue] = useState('0');
	const [to, setTo] = useState('');
	const [data, setData] = useState('');

	const { transport, appPrivateKey } = props;
	const disabled = !transport || props.isLocked;

	const handleState = async (request: () => Promise<string>, handleResponse: (response: string) => void) => {
		props.setIsLocked(true);
		try {
			const response = await request();
			handleResponse(response);
		} catch (error) {
			handleResponse(error.message);
			console.error(error);
		} finally {
			props.setIsLocked(false);
		}
	};

	const getAddress = async () => {
		handleState(async () => {
			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');
			const address = await temp.getAddress(transport!, appPrivateKey, appId, 0);
			return address;
		}, setAddress);
	};

	const signTransaction = async () => {
		handleState(async () => {
			const transaction = {
				nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
				gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
				gasLimit: web3.utils.toHex(8000000),
				to: to,
				value: web3.utils.toHex(web3.utils.toWei(value.toString(), 'ether')),
				data: '',
			};

			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');
			const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction);
			await web3.eth.sendSignedTransaction(signedTx);
			return signedTx;
		}, setSignedTransaction);
	};

	const signERC20Transaction = async () => {
		handleState(async () => {
			const contractAddress = '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846';

			const abiArray = [
				{
					constant: true,
					inputs: [],
					name: 'name',
					outputs: [{ name: '', type: 'string' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_spender', type: 'address' },
						{ name: '_value', type: 'uint256' },
					],
					name: 'approve',
					outputs: [{ name: '', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: true,
					inputs: [],
					name: 'totalSupply',
					outputs: [{ name: '', type: 'uint256' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_from', type: 'address' },
						{ name: '_to', type: 'address' },
						{ name: '_value', type: 'uint256' },
					],
					name: 'transferFrom',
					outputs: [{ name: '', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: true,
					inputs: [],
					name: 'decimals',
					outputs: [{ name: '', type: 'uint8' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_to', type: 'address' },
						{ name: '_value', type: 'uint256' },
						{ name: '_data', type: 'bytes' },
					],
					name: 'transferAndCall',
					outputs: [{ name: 'success', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_spender', type: 'address' },
						{ name: '_subtractedValue', type: 'uint256' },
					],
					name: 'decreaseApproval',
					outputs: [{ name: 'success', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: true,
					inputs: [{ name: '_owner', type: 'address' }],
					name: 'balanceOf',
					outputs: [{ name: 'balance', type: 'uint256' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{
					constant: true,
					inputs: [],
					name: 'symbol',
					outputs: [{ name: '', type: 'string' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_to', type: 'address' },
						{ name: '_value', type: 'uint256' },
					],
					name: 'transfer',
					outputs: [{ name: 'success', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: false,
					inputs: [
						{ name: '_spender', type: 'address' },
						{ name: '_addedValue', type: 'uint256' },
					],
					name: 'increaseApproval',
					outputs: [{ name: 'success', type: 'bool' }],
					payable: false,
					stateMutability: 'nonpayable',
					type: 'function',
				},
				{
					constant: true,
					inputs: [
						{ name: '_owner', type: 'address' },
						{ name: '_spender', type: 'address' },
					],
					name: 'allowance',
					outputs: [{ name: 'remaining', type: 'uint256' }],
					payable: false,
					stateMutability: 'view',
					type: 'function',
				},
				{ inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' },
				{
					anonymous: false,
					inputs: [
						{ indexed: true, name: 'from', type: 'address' },
						{ indexed: true, name: 'to', type: 'address' },
						{ indexed: false, name: 'value', type: 'uint256' },
						{ indexed: false, name: 'data', type: 'bytes' },
					],
					name: 'Transfer',
					type: 'event',
				},
				{
					anonymous: false,
					inputs: [
						{ indexed: true, name: 'owner', type: 'address' },
						{ indexed: true, name: 'spender', type: 'address' },
						{ indexed: false, name: 'value', type: 'uint256' },
					],
					name: 'Approval',
					type: 'event',
				},
				{
					anonymous: false,
					inputs: [
						{ indexed: true, name: 'from', type: 'address' },
						{ indexed: true, name: 'to', type: 'address' },
						{ indexed: false, name: 'value', type: 'uint256' },
					],
					name: 'Transfer',
					type: 'event',
				},
			];

			const contract = new web3.eth.Contract(abiArray, contractAddress, {
				from: '0xd22b659b218fabf5936a4052f699d373f2b74313',
			});

			await contract.methods
				.balanceOf('0xd22b659b218fabf5936a4052f699d373f2b74313')
				.call()
				.then(function (wei) {
					const balance = web3.utils.fromWei(wei, 'ether');
					console.log('balance', balance);
				});

			const transaction = {
				nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
				gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
				gasLimit: web3.utils.toHex(8000000),
				to: contractAddress,
				value: '0x0',
				data: contract.methods.transfer(to, web3.utils.toWei(value.toString(), 'ether')).encodeABI(),
			};

			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');
			const signedTx = await temp.signERC20Transaction(transport!, appPrivateKey, appId, 0, transaction);
			await web3.eth.sendSignedTransaction(signedTx);

			return signedTx;
		}, setSignedERC20Transaction);
	};

	const signSmartContractTransaction = async () => {
		handleState(async () => {
			const transaction = {
				nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
				gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
				gasLimit: web3.utils.toHex(8000000),
				to: '0x256C73C6Dc56710E8BE6B1c3673Caa1B2173fF27',
				value: '0x0',
				data: '0x6057361d000000000000000000000000000000000000000000000000000000000000000b',
			};

			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');

			const signedTx = await temp.signSmartContractTransaction(transport!, appPrivateKey, appId, 0, transaction);

			await web3.eth.sendSignedTransaction(signedTx);

			return signedTx;
		}, setSignedSmartContractTransaction);
	};

	const signMessage = async () => {
		handleState(async () => {
			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');

			const message = 'hellow world';

			const signedMessage = await web3.eth.accounts.sign(message, appPrivateKey);

			const signedTx = await temp.signMessage(transport!, appPrivateKey, appId, 0, web3.utils.toHex(message));

			const recover = await web3.eth.accounts.recover(message, signedTx);

			console.log('recover', recover);

			return signedTx;
		}, setSignedMessage);
	};

	const signTypedData = async () => {
		handleState(async () => {
			const appId = localStorage.getItem('appId');
			if (!appId) throw new Error('No Appid stored, please register!');

			const typedData = {
				types: {
					EIP712Domain: [
						{ name: 'name', type: 'string' },
						{ name: 'version', type: 'string' },
						{ name: 'chainId', type: 'uint256' },
						{ name: 'verifyingContract', type: 'address' },
					],
					Mail: [
						{ name: 'from', type: 'address' },
						{ name: 'to', type: 'address' },
						{ name: 'value', type: 'uint256' },
					],
				},
				domain: {
					name: 'Demo',
					version: '1.0',
					chainId: 1,
					verifyingContract: '0x0000000000000000000000000000000000000000',
				},
				primaryType: 'Mail',
				message: {
					from: '0xd22b659b218fabf5936a4052f699d373f2b74313',
					to: '0x0000000000000000000000000000000000000000',
					value: 12345,
				},
			};

			const signedTx = await temp.signTypedData(transport!, appPrivateKey, appId, 0, typedData);

			const recover = sigUtil.recoverTypedSignature_v4({
				data: typedData,
				sig: signedTx,
			});

			console.log('recover', recover);

			return signedTx;
		}, setSignedTypedData);
	};

	return (
		<Container>
			<div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
			<NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
			<TwoInputs
				title='Sign Transaction'
				content={signedTransaction}
				onClick={signTransaction}
				disabled={disabled}
				btnName='Sign'
				value={value}
				setValue={setValue}
				placeholder='value'
				inputSize={1}
				value2={to}
				setValue2={setTo}
				placeholder2='to'
				inputSize2={3}
			/>
			<TwoInputs
				title='Sign ERC20 Transaction'
				content={signedERC20Transaction}
				onClick={signERC20Transaction}
				disabled={disabled}
				btnName='Sign'
				value={value}
				setValue={setValue}
				placeholder='value'
				inputSize={1}
				value2={to}
				setValue2={setTo}
				placeholder2='to'
				inputSize2={3}
			/>
			<TwoInputs
				title='Sign SmartContract Transaction'
				content={signedSmartContractTransaction}
				onClick={signSmartContractTransaction}
				disabled={disabled}
				btnName='Sign'
				value={value}
				setValue={setValue}
				placeholder='value'
				inputSize={1}
				value2={to}
				setValue2={setTo}
				placeholder2='to'
				inputSize2={3}
			/>
			<TwoInputs
				title='Sign Message'
				content={signedMessage}
				onClick={signMessage}
				disabled={disabled}
				btnName='Sign'
				value={value}
				setValue={setValue}
				placeholder='value'
				inputSize={1}
				value2={to}
				setValue2={setTo}
				placeholder2='to'
				inputSize2={3}
			/>
			<TwoInputs
				title='Sign TypedData'
				content={signedTypedData}
				onClick={signTypedData}
				disabled={disabled}
				btnName='Sign'
				value={value}
				setValue={setValue}
				placeholder='value'
				inputSize={1}
				value2={to}
				setValue2={setTo}
				placeholder2='to'
				inputSize2={3}
			/>
		</Container>
	);
}

export default CoinTemplate;
