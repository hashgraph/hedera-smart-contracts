// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('hedera-examples-test-helpers/constants');

describe('@solidityequiv1 Solidity Account Non Existing Test Suite', function () {
  let contract, randomAddress, hasError, fakeContract, contractDup, factory, wallet, provider;
  const NO_IMPLEMENTED_ERROR = 'NotImplementedError';
  const ADDR_DOES_NOT_EXIST = 'nonExtAddr is not defined';

  before(async function () {
    const signers = await ethers.getSigners();
    wallet = signers[0];
    randomAddress = ethers.Wallet.createRandom().address;
    factory = await ethers.getContractFactory(Constants.Contract.NonExisting);
    const factoryDup = await ethers.getContractFactory(
      Constants.Contract.NonExtDup
    );
    fakeContract = factory.attach(randomAddress);
    provider = ethers.getDefaultProvider();

    contractDup = await factoryDup.deploy();
    contract = await factory.deploy(await contractDup.getAddress());
  });

  beforeEach(function () {
    hasError = false;
  });

  // Skipped: measures gas through contract.balanceOf(); BALANCE evaluated through eth_call (mirror node web3) does not match eth_getBalance on Solo.
  // Ethereum-equivalence of the EVM is tested by the consensus node, mirror node and relay repos.
  it.skip('should confirm `call` on a non existing account', async function () {
    // call to non existing account
    const MINIMAL_GAS_USED = 21432
    const initialBalance = await contract.balanceOf(wallet.address);
    const tx = await fakeContract.callOnNonExistingAccount(randomAddress, {gasLimit: 1000000});
    receipt = await tx.wait();
    const finalBalance = await contract.balanceOf(wallet.address);
    const diff = initialBalance - finalBalance;

    expect(diff > MINIMAL_GAS_USED).to.be.true;
    expect(receipt.status).to.equal(1);
  });

  it('should confirm `call` on a non existing account internal ', async function () {
      const tx = await contract.callOnNonExistingAccount(randomAddress);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
  });

  // Skipped: Hedera (consensus node v0.77) no longer reverts a delegatecall to a non-existing account, as on Ethereum.
  // Ethereum-equivalence of the EVM is tested by the consensus node, mirror node and relay repos.
  it.skip('should confirm `delegatecall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.delegatecallOnNonExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.code).to.equal(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `delegatecall` on a non existing account internal', async function () {
      const tx = await contract.delegatecallOnNonExistingAccount(
        randomAddress
      );
      const rec = await tx.wait();
      expect(rec.status).to.equal(1);
  });

  it('should confirm `staticcall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.staticcallOnNonExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.value).to.equal('0x');
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `staticcall` on a non existing account internal', async function () {
      const tx = await contract.staticcallOnNonExistingAccount(randomAddress);
      expect(tx).to.equal(true);
  });

  it('should confirm creation of a contract on non Existing addr', async function () {
    try {
      contract = await factory.deploy('randomAddress');
    } catch (err) {
      hasError = true;
      expect(err.name).to.equal(NO_IMPLEMENTED_ERROR);
    }
    expect(hasError).to.equal(true);
  });

  it("should confirm function call balance on an address that doesn't exist. ", async function () {
    try {
      await contract.balanceNoneExistingAddr(nonExtAddr);
    } catch (err) {
      hasError = true;
      expect(err.message).to.equal(ADDR_DOES_NOT_EXIST);
    }
    expect(hasError).to.equal(true);
  });
});
