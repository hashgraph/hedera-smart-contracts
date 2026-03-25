// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');

describe('Admin Key and Contract ID Validation', function () {
  let signers;
  let sdkClient;
  let hollowWallet;

  before(async function () {
    signers = await ethers.getSigners();
    sdkClient = await utils.createSDKClient();
    hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

    await (
      await signers[0].sendTransaction({
        to: hollowWallet.address,
        value: ethers.parseEther('100'),
        gasLimit: 1_000_000,
      })
    ).wait();
  });

  it('should ensure that the admin key matches the contract ID after deploying the contract with the hollow account', async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.Base,
      hollowWallet
    );
    const contract = await factory.deploy();
    const info = await utils.getContractInfo(contract.target, sdkClient);

    const adminkey = info.adminKey.num;
    const contractId = info.contractId.num;

    expect(adminkey.equals(contractId)).to.be.true;
  });

  it('should ensure that the admin key matches the contract ID after deploying a contract', async function () {
    const factory = await ethers.getContractFactory(Constants.Contract.Base);
    const contract = await factory.deploy();
    
    await contract.waitForDeployment();

    const info = await utils.getContractInfo(contract.target, sdkClient);

    const adminkey = info.adminKey.num;
    const contractId = info.contractId.num;

    expect(adminkey.equals(contractId)).to.be.true;
  });
});
