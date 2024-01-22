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

const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const Utils = require('../../utils');
chai.use(chaiAsPromised);

describe('@OZTransparentUpgradeableProxy Test Suite', function () {
  let contractProxy, contractBox, contractBoxV2;
  let owner, signer, proxyAdminAddress;
  before(async function () {
    [owner, signer] = await ethers.getSigners();
    const factoryBox = await ethers.getContractFactory(Constants.Contract.Box);
    contractBox = await factoryBox.deploy();

    const factory = await ethers.getContractFactory(
      Constants.Contract.MyCustomTransparentUpgradeableProxy
    );
    contractProxy = await factory.deploy(
      await contractBox.getAddress(),
      owner.address,
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );

    const upgradeLogs = (await contractProxy.deploymentTransaction().wait())
      .logs;

    proxyAdminAddress = upgradeLogs[2].args.newAdmin;
  });

  it('should verify it calls the correct contract and method via proxy', async function () {
    const storeFunctionData =
      '0x6057361d0000000000000000000000000000000000000000000000000000000000000008';
    const signedTx = await owner.sendTransaction({
      to: await contractProxy.getAddress(),
      data: storeFunctionData,
      gasLimit: 5000000,
    });
    const receipt = await signedTx.wait();
    const encodedInt =
      '0x0000000000000000000000000000000000000000000000000000000000000008';
    expect(receipt.to).to.eq(await contractProxy.getAddress());
    expect(receipt.from).to.eq(owner.address);
    expect(receipt.logs[0].data).to.eq(encodedInt);
  });

  it('should verify it can change the underlying contract', async function () {
    const factoryBoxV2 = await ethers.getContractFactory(
      Constants.Contract.BoxV2
    );
    contractBoxV2 = await factoryBoxV2.deploy();

    const functionSelectorUpgradeAndCall = Utils.functionSelector(
      'upgradeAndCall(address,address,bytes)'
    );

    const abi = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abi.encode(
      ['address', 'address', 'bytes'],
      [await contractProxy.getAddress(), await contractBoxV2.getAddress(), '0x']
    );

    const signedTx = await owner.sendTransaction({
      to: proxyAdminAddress,
      data: functionSelectorUpgradeAndCall + encoded.replace('0x', ''),
      gasLimit: 5000000,
    });

    const receipt = await signedTx.wait();

    const topics = receipt.logs[0].topics;
    const eventUpgradedNameHashed = ethers.keccak256(
      ethers.toUtf8Bytes('Upgraded(address)')
    );
    const newContractAddressEncoded =
      '0x000000000000000000000000' +
      (await contractBoxV2.getAddress()).replace('0x', '');
    expect(eventUpgradedNameHashed).to.eq(topics[0]);
    expect(newContractAddressEncoded.toLowerCase()).to.eq(topics[1]);

    const functionSelectorIncrement = Utils.functionSelector('increment()');
    const eventValueChangedNameHashed = ethers.keccak256(
      ethers.toUtf8Bytes('ValueChanged(uint256)')
    );
    const signedTxToNewContract = await owner.sendTransaction({
      to: await contractProxy.getAddress(),
      data: functionSelectorIncrement,
      gasLimit: 5000000,
    });

    const receipt2 = await signedTxToNewContract.wait();

    expect(eventValueChangedNameHashed).to.eq(receipt2.logs[0].topics[0]);
  });

  it('should verify proxy admin cannot be called by anyone other than owner', async function () {
    const factoryBoxV2 = await ethers.getContractFactory(
      Constants.Contract.BoxV2
    );
    contractBoxV2 = await factoryBoxV2.deploy();
    const functionSelectorUpgradeAndCall = ethers
      .keccak256(ethers.toUtf8Bytes('upgradeAndCall(address,address,bytes)'))
      .substring(0, 10);
    const abi = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abi.encode(
      ['address', 'address', 'bytes'],
      [await contractProxy.getAddress(), await contractBoxV2.getAddress(), '0x']
    );
    const tx = await signer.sendTransaction({
      to: proxyAdminAddress,
      data: functionSelectorUpgradeAndCall + encoded.replace('0x', ''),
      gasLimit: 5000000,
    });
    await expect(tx.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      'CALL_EXCEPTION'
    );
  });
});
