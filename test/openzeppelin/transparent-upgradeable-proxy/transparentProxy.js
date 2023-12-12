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

describe('@OZTransparentUpgradeableProxy Transparent Upgradeable Proxy', function () {
  let contractProxy, contractBox;
  let owner, signer, proxyAdminAddress;
  before(async function () {
    [owner, signer] = await ethers.getSigners();
    const factoryBox = await ethers.getContractFactory(Constants.Contract.Box);
    contractBox = await factoryBox.deploy();
    await contractBox.deployed();

    const factory = await ethers.getContractFactory(
      Constants.Contract.MyCustomTransparentUpgradeableProxy
    );
    contractProxy = await factory.deploy(
      contractBox.address,
      owner.address,
      []
    );
    const receipt = await contractProxy.deployTransaction.wait();
    proxyAdminAddress = receipt.events[2].args.newAdmin;
  });

  it('should verify it calls the correct contract and method via proxy', async function () {
    const storeFunctionData =
      '0x6057361d0000000000000000000000000000000000000000000000000000000000000008';
    const signedTx = await owner.sendTransaction({
      to: contractProxy.address,
      data: storeFunctionData,
      gasLimit: 5000000,
    });
    const receipt = await signedTx.wait();
    const encodedInt =
      '0x0000000000000000000000000000000000000000000000000000000000000008';
    expect(receipt.to).to.eq(contractProxy.address);
    expect(receipt.from).to.eq(owner.address);
    expect(receipt.logs[0].data).to.eq(encodedInt);
  });

  it('should verify it can change the underlying contract', async function () {
    const factoryBoxV2 = await ethers.getContractFactory(
      Constants.Contract.BoxV2
    );
    contractBoxV2 = await factoryBoxV2.deploy();
    await contractBoxV2.deployed();

    const functionSelectorUpgradeAndCall = Utils.functionSelector(
      'upgradeAndCall(address,address,bytes)'
    );
    const abi = ethers.utils.defaultAbiCoder;
    const encoded = abi.encode(
      ['address', 'address', 'bytes'],
      [contractProxy.address, contractBoxV2.address, []]
    );

    const signedTx = await owner.sendTransaction({
      to: proxyAdminAddress,
      data: functionSelectorUpgradeAndCall + encoded.replace('0x', ''),
      gasLimit: 5000000,
    });

    const receipt = await signedTx.wait();

    const topics = receipt.logs[0].topics;
    const eventUpgradedNameHashed = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('Upgraded(address)')
    );
    const newContractAddressEncoded =
      '0x000000000000000000000000' + contractBoxV2.address.replace('0x', '');
    expect(eventUpgradedNameHashed).to.eq(topics[0]);
    expect(newContractAddressEncoded.toLowerCase()).to.eq(topics[1]);

    const functionSelectorIncrement = Utils.functionSelector('increment()');
    const eventValueChangedNameHashed = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('ValueChanged(uint256)')
    );
    const signedTxToNewContract = await owner.sendTransaction({
      to: contractProxy.address,
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
    await contractBoxV2.deployed();
    const functionSelectorUpgradeAndCall = ethers.utils
      .keccak256(
        ethers.utils.toUtf8Bytes('upgradeAndCall(address,address,bytes)')
      )
      .substring(0, 10);
    const abi = ethers.utils.defaultAbiCoder;
    const encoded = abi.encode(
      ['address', 'address', 'bytes'],
      [contractProxy.address, contractBoxV2.address, []]
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
