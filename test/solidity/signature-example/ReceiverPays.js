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
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv3 Signature Example ReceiverPays Tests', function () {
  let receiverPaysContract, provider, signers, currentNonce, sender, receiver;

  before(async function () {
    signers = await ethers.getSigners();
    sender = signers[0];
    receiver = signers[1];
    ethers.provider = sender.provider;
    provider = ethers.provider;
    const factory = await ethers.getContractFactory(
      Constants.Path.RECEIVER_PAYS
    );
    const initialFund = ethers.parseEther('4');
    receiverPaysContract = await factory.deploy({
      gasLimit: 15000000,
      value: initialFund,
    });
    currentNonce = 0;
  });

  // claim payment
  it('receiver should be able to claim payment and pay for transaction fees', async function () {
    const recipientAddress = receiver.address;
    const contractBalanceBefore = await signers[0].provider.getBalance(
      receiverPaysContract.address
    );
    // There is a discrepancy between the amount of decimals for 1 ETH and 1 HBAR. see the tinybar to wei coefficient of 10_000_000_000
    // it should be ethers.parseEther('1');
    const amountToTransfer = 100000000;

    // Generate signature for payment
    const signedPayment = await signPayment(
      recipientAddress,
      amountToTransfer,
      currentNonce,
      receiverPaysContract.address
    );

    // Claim payment
    const contract = receiverPaysContract.connect(receiver);
    await contract.claimPayment(amountToTransfer, currentNonce, signedPayment);

    // Verify payment is received
    const contractBalanceAfter = await signers[0].provider.getBalance(
      receiverPaysContract.address
    );

    expect(contractBalanceAfter).to.equal(
      contractBalanceBefore.sub(ethers.parseEther('1'))
    );

    currentNonce++;
  });

  // try to shutdown contract as receiver
  it('receiver should not be able to shutdown contract', async function () {
    const contract = receiverPaysContract.connect(receiver);
    let errorOccurred = false;
    try {
      const tx = await contract.shutdown();
      await tx.wait();
    } catch (error) {
      expect(error.reason).to.be.equal('transaction failed');
      errorOccurred = true;
    }
    expect(errorOccurred).to.be.true;
    // verify the contract still has balance
    const contractBalance = await signers[0].provider.getBalance(
      receiverPaysContract.address
    );
    expect(contractBalance).to.be.gt(0);
  });

  // should be able to shutdown as sender
  it('sender should be able to shutdown contract', async function () {
    const contract = receiverPaysContract.connect(sender);
    await contract.shutdown();
    // verify contract is shutdown, contract should have no balance left
    const contractBalance = await signers[0].provider.getBalance(
      receiverPaysContract.address
    );
    expect(contractBalance).to.be.equal(0);
  });

  async function signPayment(recipient, amount, nonce, contractAddress) {
    const hash = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'uint256', 'address'],
      [recipient, amount, nonce, contractAddress]
    );
    // Sign the hash
    const signature = await sender.signMessage(ethers.utils.arrayify(hash));
    return signature;
  }
});
