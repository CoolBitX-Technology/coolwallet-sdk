// import Web3 from "web3";

const Web3 = require('web3');

// const web3 = new Web3();

export const {
  isHex,
  keccak256,
  toChecksumAddress,
  asciiToHex,
  padRight,
  toHex,
  sha3,
  hexStr2byteArray
} = Web3.utils;
