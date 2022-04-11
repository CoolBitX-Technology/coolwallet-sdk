import { CHAIN } from '../src';

console.log('Cronos Chain Information', CHAIN.CRONOS.toHexChainInfo());
console.log('Cronos Chain Signature', CHAIN.CRONOS.getSignature());
console.log('Polygon Chain Information', CHAIN.POLYGON.toHexChainInfo());
console.log('Polygon Chain Signature', CHAIN.POLYGON.getSignature());