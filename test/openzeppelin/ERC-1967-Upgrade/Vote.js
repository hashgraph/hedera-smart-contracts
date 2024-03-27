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
const fs = require('fs');
const path = require('path');
const Constants = require('../../constants');
const { GAS_LIMIT_1_000_000, CALL_EXCEPTION } = require('../../constants');
const HederaSmartContractsRootPath = path.resolve(__dirname, '..', '..', '..');

const VoteV1Artifact = JSON.parse(
  fs.readFileSync(
    `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-1967-Upgrade/VoteV1.sol/VoteV1.json`
  )
);

const VoteV2Artifact = JSON.parse(
  fs.readFileSync(
    `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-1967-Upgrade/VoteV2.sol/VoteV2.json`
  )
);

describe('@OZERC1967Upgrade Upgradable Vote Test Suite', () => {
  let admin, voter1, voter2;
  let voteV1, voteV2, proxiedVoteV1, proxiedVoteV2, voteProxy;
  const EMPTY_DATA = '0x';

  before(async () => {
    [admin, voter1, voter2] = await ethers.getSigners();

    const VoteV1Fac = await ethers.getContractFactory(
      Constants.Contract.VoteV1
    );
    voteV1 = await VoteV1Fac.deploy();
    await voteV1.waitForDeployment();

    const VoteV2Fac = await ethers.getContractFactory(
      Constants.Contract.VoteV2
    );
    voteV2 = await VoteV2Fac.deploy();
    await voteV2.waitForDeployment();

    const VoteProxyFac = await ethers.getContractFactory(
      Constants.Contract.VoteProxy
    );
    voteProxy = await VoteProxyFac.deploy(await voteV1.getAddress());
    await voteProxy.waitForDeployment();
  });

  describe('Proxy Contract tests', () => {
    it('Should deploy vote proxy contract with the with voteV1 being the current logic contract', async () => {
      expect(await voteProxy.implementation()).to.eq(await voteV1.getAddress());
    });

    it('Should upgrade proxy vote to point to voteV2', async () => {
      const tx = await voteProxy.upgradeToAndCall(
        await voteV2.getAddress(),
        EMPTY_DATA
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((e) => e.fragment.name === 'Upgraded');

      expect(event.args.implementation).to.eq(await voteV2.getAddress());
      expect(await voteProxy.implementation()).to.eq(await voteV2.getAddress());
    });

    it('Should be able to get the predefined ERC1967 IMPLEMENTATION_SLOT', async () => {
      // @logic ERC1967.IMPLEMENTATION_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)

      // keccak256('eip1967.proxy.implementation')
      const eip1967ImplByte32 = ethers.keccak256(
        ethers.toUtf8Bytes('eip1967.proxy.implementation')
      );

      // uint256(keccak256('eip1967.proxy.implementation')) - 1
      const eip1967ImplUint256 = BigInt(eip1967ImplByte32) - 1n;

      // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
      const expectedImplementationSlot = ethers.zeroPadValue(
        '0x' + eip1967ImplUint256.toString(16),
        32
      );

      expect(await voteProxy.getImplementationSlot()).to.eq(
        expectedImplementationSlot
      );
    });

    it('Should deploy vote proxy contract with a new proxy admin', async () => {
      expect(await voteProxy.getCurrentAdmin()).to.eq(await admin.getAddress());
    });

    it('Should be able to get the predefined ERC1967 ADMIN_SLOT', async () => {
      // @logic ERC1967.ADMIN_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)

      // keccak256('eip1967.proxy.admin')
      const eip1967ImplByte32 = ethers.keccak256(
        ethers.toUtf8Bytes('eip1967.proxy.admin')
      );

      // uint256(keccak256('eip1967.proxy.admin')) - 1
      const eip1967AdminUint256 = BigInt(eip1967ImplByte32) - 1n;

      // bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
      const expectedAdminSlot = ethers.zeroPadValue(
        '0x' + eip1967AdminUint256.toString(16),
        32
      );

      expect(await voteProxy.getAdminSlot()).to.eq(expectedAdminSlot);
    });

    it('Should be able to change the current proxy admin to a new address', async () => {
      const tx = await voteProxy.changeAdmin(await voter1.getAddress());
      const receipt = await tx.wait();

      const [previousAdmin, newAdmin] = receipt.logs.map(
        (e) => e.fragment.name === 'AdminChanged' && e
      )[0].args;

      expect(previousAdmin).to.eq(await admin.getAddress());
      expect(newAdmin).to.eq(await voter1.getAddress());
    });

    it('Should NOT be able to change the current proxy admin if the caller is not an admin', async () => {
      expect(await voteProxy.getCurrentAdmin()).to.eq(await voter1.getAddress());

      const txPromise = voteProxy
        .connect(voter2)
        .changeAdmin(await voter1.getAddress());

      expect(txPromise).to.eventually.be.rejected.and.have.property(
        'code',
        CALL_EXCEPTION
      );
    });
  });

  describe('Implementation contract', () => {
    before(async () => {
      const tx = await voteProxy
        .connect(voter1)
        .changeAdmin(await admin.getAddress());
      await tx.wait();

      expect(await voteProxy.getCurrentAdmin()).to.eq(await admin.getAddress());
    });

    it('V1: Should load VoteV1 into proxy address', async () => {
      proxiedVoteV1 = new ethers.Contract(
        await voteProxy.getAddress(),
        VoteV1Artifact.abi,
        admin
      );
      await proxiedVoteV1.initialize();

      expect(await proxiedVoteV1.version()).to.eq(1);
      expect(await proxiedVoteV1.getAddress()).to.eq(
        await voteProxy.getAddress()
      );
    });

    it('V1: Should cast votes to the system', async () => {
      const vote1Tx = await proxiedVoteV1.connect(voter1).vote();
      await vote1Tx.wait();

      const vote2Tx = await proxiedVoteV1.connect(voter2).vote();
      await vote2Tx.wait();

      const voters = await proxiedVoteV1.voters();

      expect(voters[0]).to.eq(voter1.address);
      expect(voters[1]).to.eq(voter2.address);
    });

    it('V1: Should check if an account has already voted', async () => {
      const votedStatus = await proxiedVoteV1.voted(voter1.address);
      expect(votedStatus).to.be.true;
    });

    it('V1: Should NOT let an already voted account to cast another vote', async () => {
      const invalidVoteTx = await proxiedVoteV1
        .connect(voter1)
        .vote(GAS_LIMIT_1_000_000);

      expect(invalidVoteTx.wait()).to.eventually.be.rejected.and.have.property(
        'code',
        CALL_EXCEPTION
      );
    });

    it('V2: Should load VoteV2 into proxy address', async () => {
      const tx = await voteProxy.upgradeToAndCall(
        await voteV2.getAddress(),
        EMPTY_DATA,
        GAS_LIMIT_1_000_000
      );
      await tx.wait();

      proxiedVoteV2 = new ethers.Contract(
        await voteProxy.getAddress(),
        VoteV2Artifact.abi,
        admin
      );
      const initTx = await proxiedVoteV2.initializeV2();
      await initTx.wait();

      expect(await proxiedVoteV2.version()).to.eq(2);
      expect(await proxiedVoteV2.getAddress()).to.eq(
        await voteProxy.getAddress()
      );
    });

    it('V2: Should correctly inherit the storage states from version 1', async () => {
      const voters = await proxiedVoteV2.voters();

      expect(voters[0]).to.eq(voter1.address);
      expect(voters[1]).to.eq(voter2.address);
    });

    it('V2: Should let voters withdraw their votes which is only available in VoteV2', async () => {
      await proxiedVoteV2.connect(voter1).withdrawVote(GAS_LIMIT_1_000_000);
      expect(await proxiedVoteV2.voted(voter1.address)).to.be.false;
    });
  });
});
