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
const { ethers, upgrades } = require('hardhat')
const utils = require('../hts-precompile/utils')
const Constants = require('../constants')
const delay = require('../../utils/helpers').delay

describe('Proxy Upgrade Contracts Test Suite', function () {
  let signers

  before(async function () {
    signers = await ethers.getSigners()
  })

  describe('DEX Upgradable Contract Test Suite', function () {
    let tokenCreateContract
    let erc20Contract
    let tokenAddress
    let proxyContract
    let proxyAddress
    let exchangeTokenBalance

    before(async function () {
      tokenCreateContract = await utils.deployTokenCreateContract()
      await utils.updateAccountKeysViaHapi([tokenCreateContract.address])
      tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      )
      await utils.updateTokenKeysViaHapi(tokenAddress, [
        tokenCreateContract.address,
      ])

      erc20Contract = await utils.deployERC20Contract()
      proxyContract = await deployDEXProxyContract(tokenAddress)
      proxyAddress = proxyContract.address

      await proxyContract.associateToken(Constants.GAS_LIMIT_1_000_000)

      await tokenCreateContract.grantTokenKycPublic(
        tokenAddress,
        proxyAddress,
        Constants.GAS_LIMIT_1_000_000
      )

      exchangeTokenBalance = 500
      await proxyContract.depositTokens(`${exchangeTokenBalance}`)
    })

    async function deployDEXProxyContract(token) {
      const contract = await ethers.getContractFactory(
        Constants.Contract.Exchange
      )

      const proxy = await upgrades.deployProxy(contract, [token], {
        kind: 'uups',
        initializer: 'initialize',
      })

      await proxy.deployed()

      return proxy
    }

    async function updateDEXProxyContract() {
      const contract = await ethers.getContractFactory(
        Constants.Contract.ExchangeV2
      )

      const proxy = await upgrades.upgradeProxy(proxyAddress, contract, {
        kind: 'uups',
      })
      await proxy.deployed()

      return proxy
    }

    //Disabled due to a change that prevents a smart contract from using a delegate call to call a precompiled contracts.
    xit('should deposit, buy and sell tokens from ExchangeV1', async function () {
      //deposit funds
      {
        const balanceBefore = await proxyContract.getNativeBalance()
        await proxyContract.deposit({
          value: ethers.utils.parseEther('0.5'),
        })
        const balanceAfter = await proxyContract.getNativeBalance()

        expect(
          balanceAfter,
          'Asserting new balance is greater'
        ).to.be.greaterThan(balanceBefore)
      }

      //buy token
      {
        const tokenBalanceBefore = await proxyContract.getTokenBalance()
        const nativeBalanceBefore = await proxyContract.getNativeBalance()

        await proxyContract.buy({
          value: ethers.utils.parseEther('0.000001'),
        })

        const tokenBalanceAfter = await proxyContract.getTokenBalance()
        const nativeBalanceAfter = await proxyContract.getNativeBalance()

        expect(
          tokenBalanceAfter,
          'Asserting new token balance is lesser'
        ).to.be.lessThan(tokenBalanceBefore)

        expect(
          nativeBalanceAfter,
          'Asserting new balance is greater'
        ).to.be.greaterThan(nativeBalanceBefore)
      }

      //sell token
      {
        const amount = '10'

        const allowanceBefore = await erc20Contract.allowance(
          tokenAddress,
          signers[0].address,
          proxyAddress
        )
        const tokenBalanceBefore = await proxyContract.getTokenBalance()

        await erc20Contract.delegateApprove(
          tokenAddress,
          proxyAddress,
          amount,
          Constants.GAS_LIMIT_1_000_000
        )
        const allowanceAfter = await erc20Contract.allowance(
          tokenAddress,
          signers[0].address,
          proxyAddress
        )
        await proxyContract.sell(amount)
        const tokenBalanceAfter = await proxyContract.getTokenBalance()

        expect(
          allowanceAfter,
          'Asserting that certain amount was approved to be spend'
        ).to.be.greaterThan(allowanceBefore)

        expect(
          tokenBalanceBefore.add(amount),
          'Asserting that certain amount was sold'
        ).to.be.eq(tokenBalanceAfter)
      }
    })

    it('should not be able to get version', async function () {
      try {
        await proxyContract.version()
      } catch (e) {
        expect(e).to.exist
        expect(e.toString()).to.contain(
          'proxyContract.version is not a function'
        )
      }
    })

    it('should upgrade contract to V2', async function () {
      const addressV1 = await proxyContract.getImplementationAddress()

      proxyContract = await updateDEXProxyContract()
      const addressV2 = await proxyContract.getImplementationAddress()

      expect(
        addressV1,
        'Asserting implementation address is different'
      ).to.not.eq(addressV2)
    })

    //Disabled due to a change that prevents a smart contract from using a delegate call to call a precompiled contracts.
    xit('should deposit, buy and withdraw tokens from ExchangeV2', async function () {
      //checkVersion
      {
        const version = await proxyContract.version()
        expect(version, 'Asserting contract version is V2').to.eq('V2')
      }

      //deposit funds
      {
        const balanceBefore = await proxyContract.getNativeBalance()
        await proxyContract.deposit({
          value: ethers.utils.parseEther('0.5'),
        })
        const balanceAfter = await proxyContract.getNativeBalance()

        expect(
          balanceAfter,
          'Asserting new balance is greater'
        ).to.be.greaterThan(balanceBefore)
      }

      //buy token
      {
        const tokenBalanceBefore = await proxyContract.getTokenBalance()
        const nativeBalanceBefore = await proxyContract.getNativeBalance()

        await proxyContract.buy({
          value: ethers.utils.parseEther('0.000001'),
        })

        const tokenBalanceAfter = await proxyContract.getTokenBalance()
        const nativeBalanceAfter = await proxyContract.getNativeBalance()

        expect(
          tokenBalanceAfter,
          'Asserting new token balance is lesser'
        ).to.be.lessThan(tokenBalanceBefore)

        expect(
          nativeBalanceAfter,
          'Asserting new balance is greater'
        ).to.be.greaterThan(nativeBalanceBefore)
      }

      //sell token
      {
        const amount = '10'

        const allowanceBefore = await erc20Contract.allowance(
          tokenAddress,
          signers[0].address,
          proxyAddress
        )
        const tokenBalanceBefore = await proxyContract.getTokenBalance()

        await erc20Contract.delegateApprove(
          tokenAddress,
          proxyAddress,
          amount,
          Constants.GAS_LIMIT_1_000_000
        )
        const allowanceAfter = await erc20Contract.allowance(
          tokenAddress,
          signers[0].address,
          proxyAddress
        )
        await proxyContract.sell(amount)
        const tokenBalanceAfter = await proxyContract.getTokenBalance()

        expect(
          allowanceAfter,
          'Asserting that certain amount was approved to be spend'
        ).to.be.greaterThan(allowanceBefore)

        expect(
          tokenBalanceBefore.add(amount),
          'Asserting that certain amount was sold'
        ).to.be.eq(tokenBalanceAfter)
      }
    })
  })

  describe('Counter Upgradable Contract Test Suite', function () {
    const nameV1 = 'Counter'
    const nameV2 = 'CounterV2'
    let proxyContract
    let proxyAddress

    before(async function () {
      proxyContract = await deployCounterProxyContract()
      proxyAddress = proxyContract.address
    })

    async function deployCounterProxyContract() {
      const contract = await ethers.getContractFactory('Counter')

      const proxy = await upgrades.deployProxy(contract, [nameV1], {
        kind: 'uups',
        initializer: 'initialize',
      })

      await proxy.deployed()

      return proxy
    }

    async function updateCounterProxyContract() {
      const contract = await ethers.getContractFactory(
        Constants.Contract.CounterV2
      )

      const proxy = await upgrades.upgradeProxy(proxyAddress, contract, {
        kind: 'uups',
      })
      await proxy.deployed()

      return proxy
    }

    it('should be able to increase and decrease counter on V1', async function () {
      //increment counter
      {
        const counterBefore = await proxyContract.count()
        await proxyContract.increment()
        const counterAfter = await proxyContract.count()
        expect(counterAfter, 'Asserting counter increment').to.be.greaterThan(
          counterBefore
        )
      }

      //decrement counter
      {
        const counterBefore = await proxyContract.count()
        await proxyContract.decrement()
        const counterAfter = await proxyContract.count()
        expect(
          counterAfter,
          'Asserting counter decrement'
        ).to.be.lessThanOrEqual(counterBefore)
      }
    })

    it('should not be able to change name', async function () {
      try {
        await proxyContract.changeName(Constants.Contract.CounterV1)
      } catch (e) {
        expect(e).to.exist
        expect(e.toString()).to.contain(
          'proxyContract.changeName is not a function'
        )
      }
    })

    it('should be able to upgrade contract to V2', async function () {
      const addressV1 = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
      )

      proxyContract = await updateCounterProxyContract()

      const addressV2 = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
      )

      expect(
        addressV1,
        'Asserting implementation address is different'
      ).to.not.eq(addressV2)
    })

    it('should be able to increase and decrease counter on V2', async function () {
      //increment counter
      {
        const counterBefore = await proxyContract.count()
        await proxyContract.increment()
        
        const counterAfter = await pollForNewCounterValue(proxyContract, counterBefore);
        expect(counterAfter, 'Asserting counter increment').to.be.greaterThan(
          counterBefore
        )
      }

      //decrement counter
      {
        const counterBefore = await proxyContract.count()
        await proxyContract.decrement()
        const counterAfter = await proxyContract.count()
        expect(
          counterAfter,
          'Asserting counter decrement'
        ).to.be.lessThanOrEqual(counterBefore)
      }

      //change name
      {
        await proxyContract.changeName(nameV2)
        const name = await proxyContract.name()
        expect(name, 'Asserting counter name is different').to.eq(nameV2)
      }
    })
  })
})

// Transaction needs to be propagated to the mirror node
async function pollForNewCounterValue(proxyContract, counterBefore) {
  const timesToTry = 200;
  let counterAfter, numberOfTries = 0;

  while (numberOfTries < timesToTry) {
      counterAfter = await proxyContract.count();


    if (!counterAfter.eq(counterBefore)) {
      return counterAfter;
    }

    numberOfTries++;
    await delay(); // Delay before the next attempt
  }

  throw new Error(`proxyContract.count failed to get a different value after ${timesToTry} tries`);
}

