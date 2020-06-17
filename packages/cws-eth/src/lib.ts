// import Web3 from "web3";

const Web3 = require('Web3');

const web3 = new Web3();

export const {
  isHex,
  keccak256,
  toChecksumAddress,
  asciiToHex,
  padRight,
} = web3.utils;
