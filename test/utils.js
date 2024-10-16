/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
