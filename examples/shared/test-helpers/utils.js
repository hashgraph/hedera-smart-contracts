// SPDX-License-Identifier: Apache-2.0

const hre = require('hardhat');
const { ethers } = hre;

class Utils {
  static functionSelector(functionNameAndParams) {
    return ethers.keccak256(ethers.toUtf8Bytes(functionNameAndParams))
      .substring(0, 10);
  }

  static to32ByteString(str) {
    return str.toString(16).replace('0x', '').padStart(64, '0');
  };

  static hexToASCII(str) {
    const hex = str.toString();
    let ascii = '';
    for (let n = 0; n < hex.length; n += 2) {
      ascii += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16));
    }
    return ascii;
  };
}

module.exports = Utils;
