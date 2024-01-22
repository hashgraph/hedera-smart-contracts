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
const Utils = require('../../utils');
const Constants = require('../../constants');

describe('@OZBeaconProxy Test Suite', function () {
  let owner, signer;
  let contractLogicContractV1, factoryLogicContractV1, contractLogicContractV2;
  let beaconFactory, beaconProxyFactory, beacon, beaconProxy, beaconProxy2;

  before(async function () {
    [owner, signer] = await ethers.getSigners();
    factoryLogicContractV1 = await ethers.getContractFactory(
      Constants.Contract.LogicContractV1
    );
    const initialValue = 1;
    contractLogicContractV1 = await factoryLogicContractV1.deploy(initialValue);

    beaconFactory = await ethers.getContractFactory(
      Constants.Contract.BeaconContract
    );
    beacon = await beaconFactory.deploy(
      await contractLogicContractV1.getAddress(),
      owner.address
    );

    beaconProxyFactory = await ethers.getContractFactory(
      Constants.Contract.BeaconProxyContract
    );
    beaconProxy = await beaconProxyFactory.deploy(await beacon.getAddress());
  });

  it('verifies several proxies can be created and used', async function () {
    const beaconProxyFactory2 = await ethers.getContractFactory(
      Constants.Contract.BeaconProxyContract
    );
    beaconProxy2 = await beaconProxyFactory2.deploy(await beacon.getAddress());
    const eventValueHashed = ethers.keccak256(
      ethers.toUtf8Bytes('Value(uint256)')
    );
    const signedTx = await owner.sendTransaction({
      to: await beaconProxy.getAddress(),
      data: '0x2e64cec1',
      gasLimit: 5000000,
    });

    const receipt = await signedTx.wait();
    expect(receipt.logs[0].topics[0]).to.eq(eventValueHashed);

    const signedTx2 = await owner.sendTransaction({
      to: await beaconProxy2.getAddress(),
      data: '0x2e64cec1',
      gasLimit: 5000000,
    });

    const receipt2 = await signedTx2.wait();
    expect(receipt2.logs[0].topics[0]).to.eq(eventValueHashed);
  });

  it('verifies contract can be called via beacon proxy', async function () {
    const signedTx = await owner.sendTransaction({
      to: await beaconProxy.getAddress(),
      data: '0x2e64cec1',
      gasLimit: 5000000,
    });
    const eventValueHashed = ethers.keccak256(
      ethers.toUtf8Bytes('Value(uint256)')
    );
    const receipt = await signedTx.wait();

    expect(receipt.logs[0].topics[0]).to.eq(eventValueHashed);
  });

  it('verifies underlying contract can be changed', async function () {
    const contractFactoryV2 = await ethers.getContractFactory(
      Constants.Contract.LogicContractV2
    );
    const initialValue = 2;
    contractLogicContractV2 = await contractFactoryV2.deploy(initialValue);

    const getImplementationBeforeUpgrade = await beacon.implementation();
    const functionSelectorUpgradeTo =
      Utils.functionSelector('upgradeTo(address)');
    const abi = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abi.encode(
      ['address'],
      [await contractLogicContractV2.getAddress()]
    );

    const signedTx = await owner.sendTransaction({
      to: await beacon.getAddress(),
      data: functionSelectorUpgradeTo + encoded.replace('0x', ''),
      gasLimit: 5000000,
    });
    const receipt = await signedTx.wait();

    const topics = receipt.logs[0].topics;
    const eventUpgradedNameHashed = ethers.keccak256(
      ethers.toUtf8Bytes('Upgraded(address)')
    );
    const newContractAddressEncoded =
      '0x000000000000000000000000' +
      (await contractLogicContractV2.getAddress()).replace('0x', '');
    expect(eventUpgradedNameHashed).to.eq(topics[0]);
    expect(newContractAddressEncoded.toLowerCase()).to.eq(topics[1]);

    const getImplementationAfterUpgrade = await beacon.implementation();
    const functionSelectorSquare = Utils.functionSelector('square(uint256)');
    const encoded2 = abi.encode(['uint256'], [2]);

    const eventSquaredNameHashed = ethers.keccak256(
      ethers.toUtf8Bytes('Squared(uint256)')
    );
    const signedTxToNewContract = await owner.sendTransaction({
      to: await beaconProxy.getAddress(),
      data: functionSelectorSquare + encoded2.replace('0x', ''),
      gasLimit: 5000000,
    });
    const receipt2 = await signedTxToNewContract.wait();

    expect(eventSquaredNameHashed).to.eq(receipt2.logs[0].topics[0]);
    expect(getImplementationBeforeUpgrade).to.eq(
      await contractLogicContractV1.getAddress()
    );
    expect(getImplementationAfterUpgrade).to.eq(
      await contractLogicContractV2.getAddress()
    );
  });

  describe('logicContractV2', function () {
    before(async function () {
      const contractFactoryV2 = await ethers.getContractFactory(
        Constants.Contract.LogicContractV2
      );
      const initialValue = 2;
      contractLogicContractV2 = await contractFactoryV2.deploy(initialValue);
    });

    it('verifies underlying contract can be changed only by owner', async function () {
      const functionSelectorUpgradeTo =
        Utils.functionSelector('upgradeTo(address)');
      const abi = ethers.AbiCoder.defaultAbiCoder();
      const encoded = abi.encode(
        ['address'],
        [await contractLogicContractV2.getAddress()]
      );

      const signedTx = await signer.sendTransaction({
        to: await beacon.getAddress(),
        data: functionSelectorUpgradeTo + encoded.replace('0x', ''),
        gasLimit: 5000000,
      });

      await expect(signedTx.wait()).to.eventually.be.rejected.and.have.property(
        'code',
        'CALL_EXCEPTION'
      );
    });

    it('verifies underlying contract cannot be changed to EOA address', async function () {
      const functionSelectorUpgradeTo =
        Utils.functionSelector('upgradeTo(address)');
      const abi = ethers.AbiCoder.defaultAbiCoder();
      const encoded = abi.encode(['address'], [owner.address]);

      const signedTx = await signer.sendTransaction({
        to: await beacon.getAddress(),
        data: functionSelectorUpgradeTo + encoded.replace('0x', ''),
        gasLimit: 5000000,
      });

      await expect(signedTx.wait()).to.eventually.be.rejected.and.have.property(
        'code',
        'CALL_EXCEPTION'
      );
    });
  });
});
