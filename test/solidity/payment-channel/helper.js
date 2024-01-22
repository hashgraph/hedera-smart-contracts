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

const { ethers } = require('hardhat');

class PaymentChannelHelper {
  /**
   * @dev constructs a payment message
   *
   * @param contractAddress used to prevent cross-contract replay attacks
   *
   * @param amount specifies how much Hbar should be sent
   *
   * @return Keccak256 hash string
   */
  static constructPaymentMessage(contractAddress, amount) {
    return ethers.solidityPackedKeccak256(
      ['address', 'uint256'],
      [contractAddress, amount]
    );
  }

  /**
   * @dev sign the payment message
   *
   * @param signer signing account
   *
   * @param contractAddress used to prevent cross-contract replay attacks
   *
   * @param amount specifies how much Hbar should be sent
   *
   * @return 65 bytes signature
   */
  static async signPayment(signer, contractAddress, amount) {
    const message = this.constructPaymentMessage(contractAddress, amount);
    return await signer.signMessage(ethers.getBytes(message));
  }
}

module.exports = PaymentChannelHelper;
