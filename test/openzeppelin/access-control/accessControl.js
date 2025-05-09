// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZAccessControlContract Test Suite', function () {
  let admin;
  let manager;
  let user;
  let accessContract;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE'));

  // Deploy the contract and set up roles before each test
  beforeEach(async function () {
    [admin, manager, user] = await ethers.getSigners();

    const AccessControlContract = await ethers.getContractFactory(
      Constants.Contract.AccessControlContract
    );
    accessContract = await AccessControlContract.deploy(
      Constants.GAS_LIMIT_1_000_000
    );

    // Grant the MANAGER_ROLE to the manager address
    await accessContract.connect(admin).grantManagerRole(manager.address);
  });

  it('admin should call adminFunction successfully', async function () {
    const result = await accessContract.connect(admin).adminFunction();
    expect(result).to.equal(
      'This function can only be called by administrators'
    );
  });

  it('manager should call managerFunction successfully', async function () {
    const result = await accessContract.connect(manager).managerFunction();
    expect(result).to.equal('This function can only be called by managers');
  });

  it('user should not be able to call adminFunction', async function () {
    await expect(accessContract.connect(user).adminFunction())
      .to.be.revertedWithCustomError(
        accessContract,
        'AccessControlUnauthorizedAccount'
      )
      .withArgs(user.address, ADMIN_ROLE);
  });

  it('user should not be able to call managerFunction', async function () {
    await expect(accessContract.connect(user).managerFunction())
      .to.be.revertedWithCustomError(
        accessContract,
        'AccessControlUnauthorizedAccount'
      )
      .withArgs(user.address, MANAGER_ROLE);
  });
});
