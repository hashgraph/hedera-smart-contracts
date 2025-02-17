// SPDX-License-Identifier: Apache-2.0

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
