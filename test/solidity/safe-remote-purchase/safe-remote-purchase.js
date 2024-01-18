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
const { Contract } = require('../../constants');

const contractStates = {
  Created: 0,
  Locked: 1,
  Release: 2,
  Inactive: 3,
};
const tinybarToHbarCoef = 100_000_000;
const EVEN_NUMBER_PRICE = 1 * tinybarToHbarCoef;
async function setupContract() {
  const signers = await ethers.getSigners();
  const seller = signers[0];
  const buyer = signers[1];
  const factoryPurchase = await ethers.getContractFactory(Contract.Purchase);
  const contract = await factoryPurchase.deploy({
    value: EVEN_NUMBER_PRICE,
  });

  return {
    contract,
    seller,
    buyer,
    factoryPurchase,
  };
}

describe('@solidityequiv2 Safe remote purchase Test Suite', function () {
  let contract, factoryPurchase, seller, buyer;

  beforeEach(async function () {
    const setup = await setupContract();
    contract = setup.contract;
    factoryPurchase = setup.factoryPurchase;
    seller = setup.seller;
    buyer = setup.buyer;
  });

  it('should revert deployment', async function () {
    const cont = await factoryPurchase.deploy({
      value: ethers.parseEther('3.0') - 1n,
      gasLimit: 1000000,
    });

    const receipt = await cont.deploymentTransaction().wait();
    expect(receipt.logs[0].fragment.name).to.equal('MsgValue');
    expect(receipt.logs[1].fragment.name).to.equal('RevertCreationForOdd');
  });

  it('should Abort contract', async function () {
    await ethers.provider.getBalance(seller.address);
    await contract.value();
    const initialState = await contract.state();
    expect(initialState).to.equal(contractStates.Created);

    const trxAbort = await contract.abort();
    const receiptAbort = await trxAbort.wait();

    await ethers.provider.getBalance(seller.address);
    const finalState = await contract.state();

    expect(receiptAbort.logs[0].fragment.name).to.equal('Aborted');
    expect(finalState).to.equal(contractStates.Inactive);
  });

  describe('standard flow buyer -> seller tests: ', async function () {
    let contract, seller, buyer;

    before(async function () {
      const setup = await setupContract();
      contract = setup.contract;
      seller = setup.seller;
      buyer = setup.buyer;
    });

    it('should Confirm the purchase as buyer', async function () {
      const initialState = await contract.state();
      expect(initialState).to.equal(contractStates.Created);

      const trxConfirm = await contract
        .connect(buyer)
        .confirmPurchase({ value: 2 * EVEN_NUMBER_PRICE });
      const receiptConfirm = await trxConfirm.wait();

      expect(receiptConfirm.logs[0].fragment.name).to.equal(
        'PurchaseConfirmed'
      );
      const finalState = await contract.state();
      expect(finalState).to.equal(contractStates.Locked);
    });

    it('should confirm that purchase is Received', async function () {
      const initialState = await contract.state();
      expect(initialState).to.equal(contractStates.Locked);

      const trxConfirm = await contract.connect(buyer).confirmReceived();
      const receiptConfirm = await trxConfirm.wait(2);

      expect(receiptConfirm.logs[0].fragment.name).to.equal('ItemReceived');
      const finalState = await contract.state();
      expect(finalState).to.equal(contractStates.Release);
    });

    it('should confirm that seller can be refunded', async function () {
      const initialState = await contract.state();
      expect(initialState).to.equal(contractStates.Release);

      const trxRefund = await contract.connect(seller).refundSeller();
      const receiptRefund = await trxRefund.wait(2);

      expect(receiptRefund.logs[0].fragment.name).to.equal('SellerRefunded');
      const finalState = await contract.state();
      expect(finalState).to.equal(contractStates.Inactive);
    });
  });

  describe('test contract modifiers', async () => {
    it('should confirm onlyBuyer modifier', async function () {
      const trxConfirm = await contract
        .connect(buyer)
        .confirmPurchase({ value: 2 * EVEN_NUMBER_PRICE });
      await trxConfirm.wait();

      await expect(contract.connect(seller).confirmReceived.staticCall()).to
        .eventually.be.rejected;
      // .to.eventually.be.rejected.and.have.property('errorName', 'OnlyBuyer');
    });

    it('should confirm onlySeller modifier', async function () {
      await expect(contract.connect(buyer).abort.staticCall()).to.eventually.be
        .rejected;
      // .to.eventually.be.rejected.and.have.property('errorName', 'OnlySeller');
    });

    it('should confirm inState modifier', async function () {
      const trxConfirm = await contract
        .connect(buyer)
        .confirmPurchase({ value: 2 * EVEN_NUMBER_PRICE });
      await trxConfirm.wait();

      await expect(contract.connect(seller).abort.staticCall()).to.eventually.be
        .rejected;
      // .to.eventually.be.rejected.and.have.property(
      //   'errorName',
      //   'InvalidState'
      // );
    });

    it('should confirm condition modifier', async function () {
      await expect(
        contract
          .connect(buyer)
          .confirmPurchase.staticCall({ value: ethers.parseEther('3.0') })
      ).to.eventually.be.rejected;
    });
  });
});
