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

const { expect } = require('chai')
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')
const HederaSmartContractsRootPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..'
)

const VoteV1Artifact = JSON.parse(
  fs.readFileSync(
    `${HederaSmartContractsRootPath}/artifacts/contracts/solidity/oz/ERC1967Upgrade/VoteV1.sol/VoteV1.json`
  )
)

const VoteV2Artifact = JSON.parse(
  fs.readFileSync(
    `${HederaSmartContractsRootPath}/artifacts/contracts/solidity/oz/ERC1967Upgrade/VoteV2.sol/VoteV2.json`
  )
)

describe('@ERC1967Upgrade Upgradable Vote Tests', () => {
  let voteV1, voteV2, proxiedVoteV1, proxiedVoteV2, voteProxy
  let admin, voter
  const CALL_EXCEPTION = 'CALL_EXCEPTION'

  beforeEach(async () => {
    ;[admin, voter] = await ethers.getSigners()

    const VoteV1Fac = await ethers.getContractFactory('VoteV1')
    voteV1 = await VoteV1Fac.deploy()

    const VoteV2Fac = await ethers.getContractFactory('VoteV2')
    voteV2 = await VoteV2Fac.deploy()

    const VoteProxyFac = await ethers.getContractFactory('VoteProxy')
    voteProxy = await VoteProxyFac.deploy(voteV1.address)
  })

  describe('Proxy Contract tests', () => {
    it('Should deploy vote proxy contract with the with voteV1 being the current logic contract', async () => {
      expect(await voteProxy.implementation()).to.eq(voteV1.address)
    })

    it('Should upgrade proxy vote to point to voteV2', async () => {
      await voteProxy.upgradeToAndCall(voteV2.address)

      expect(await voteProxy.implementation()).to.eq(voteV2.address)
    })

    it('Should be able to get the predefined ERC1967 IMPLEMENTATION_SLOT', async () => {
      // @logic ERC1967.IMPLEMENTATION_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)

      // keccak256('eip1967.proxy.implementation')
      const eip1967ImplByte32 = ethers.utils.solidityKeccak256(
        ['string'],
        ['eip1967.proxy.implementation']
      )

      // uint256(keccak256('eip1967.proxy.implementation')) - 1
      const eip1967ImplUint256 = ethers.BigNumber.from(eip1967ImplByte32).sub(1)

      // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
      const expectedImplementationSlot = ethers.utils.hexZeroPad(
        eip1967ImplUint256.toHexString(),
        32
      )

      expect(await voteProxy.getImplementationSlot()).to.eq(
        expectedImplementationSlot
      )
    })

    it('Should deploy vote proxy contract with a new proxy admin', async () => {
      expect(await voteProxy.getCurrentAdmin()).to.eq(await admin.getAddress())
    })

    it('Should be able to get the predefined ERC1967 ADMIN_SLOT', async () => {
      // @logic ERC1967.ADMIN_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)

      // keccak256('eip1967.proxy.admin')
      const eip1967ImplByte32 = ethers.utils.solidityKeccak256(
        ['string'],
        ['eip1967.proxy.admin']
      )

      // uint256(keccak256('eip1967.proxy.admin')) - 1
      const eip1967AdminUint256 =
        ethers.BigNumber.from(eip1967ImplByte32).sub(1)

      // bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
      const expectedAdminSlot = ethers.utils.hexZeroPad(
        eip1967AdminUint256.toHexString(),
        32
      )

      expect(await voteProxy.getAdminSlot()).to.eq(expectedAdminSlot)
    })

    it('Should be able to change the current proxy admin to a new address', async () => {
      const tx = await voteProxy.changeAdmin(await voter.getAddress())
      const receipt = await tx.wait()

      const [previousAdmin, newAdmin] = receipt.events.map(
        (e) => e.event === 'AdminChanged' && e
      )[0].args

      expect(previousAdmin).to.eq(await admin.getAddress())
      expect(newAdmin).to.eq(await voter.getAddress())
    })

    it('Should NOT be able to change the current proxy admin if the caller is not an admin', async () => {
      let error

      const tx = await voteProxy
        .connect(voter)
        .changeAdmin(await voter.getAddress())

      expect(tx.wait()).to.eventually.be.rejected.and.have.property(
        'code',
        CALL_EXCEPTION
      )
    })
  })

  describe('Implementation contract', () => {
    beforeEach(async () => {
      proxiedVoteV1 = new ethers.Contract(
        voteProxy.address,
        VoteV1Artifact.abi,
        admin
      )

      await voteProxy.upgradeToAndCall(voteV2.address)

      proxiedVoteV2 = new ethers.Contract(
        voteProxy.address,
        VoteV2Artifact.abi,
        admin
      )
    })

    it('Should load VoteV1 into proxy address', () => {
      expect(proxiedVoteV1.address).to.eq(voteProxy.address)
    })

    it('Should cast votes to the system', async () => {
      await proxiedVoteV1.connect(voter).vote()

      const voters = await proxiedVoteV1.voters()

      expect(voters.includes(await voter.getAddress()))
    })

    it('Should let voters withdraw their votes only available in VoteV2', async () => {
      await proxiedVoteV2.connect(voter).vote()

      expect(await proxiedVoteV2.voted(await voter.getAddress())).to.be.true

      await proxiedVoteV2.connect(voter).withdrawVote({ gasLimit: 3000000 })

      expect(await proxiedVoteV2.voted(await voter.getAddress())).to.be.false
    })
  })
})
