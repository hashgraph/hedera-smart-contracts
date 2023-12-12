/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
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
const constants = require('../../constants')

describe('@OZVestingWallet Vesting Wallet tests', () => {
  let vestingWallet, erc20Mock, signers, beneficiaryAddress
  const DURATION = 3 // seconds
  const GAS_LIMIT = 1_000_000
  const INITIAL_FUND = 30_000_000_000
  const TINY_BAR_TO_WEI_COEF = 10_000_000_000
  const START = Math.round(Date.now() / 1000)
  const INITIAL_ERC20TOKEN_AMOUNT = 3_000_000

  beforeEach(async () => {
    signers = await ethers.getSigners()
    beneficiaryAddress = await signers[1].getAddress()

    const vestingWalletFactory = await ethers.getContractFactory(
      'VestingWallet'
    )
    vestingWallet = await vestingWalletFactory.deploy(
      beneficiaryAddress,
      START,
      DURATION,
      { value: INITIAL_FUND, gasLimit: GAS_LIMIT }
    )

    const erc20MockFactory = await ethers.getContractFactory(
      constants.Path.ERC20Mock
    )

    erc20Mock = await erc20MockFactory.deploy('Hedera', 'HBAR')

    await erc20Mock.mint(vestingWallet.address, INITIAL_ERC20TOKEN_AMOUNT)
  })

  it('Deployment', async () => {
    const vestingWalletEnd = await vestingWallet.end()
    const vestingWalletStart = await vestingWallet.start()
    const vestingWalletBeneficiary = await vestingWallet.owner()
    const vestingWalletDuration = await vestingWallet.duration()
    const vestingWalletBalance = await ethers.provider.getBalance(
      vestingWallet.address
    )
    const vestingWalletErc20Balance = await erc20Mock.balanceOf(
      vestingWallet.address
    )

    expect(vestingWalletStart).to.eq(START)
    expect(vestingWalletDuration).to.eq(DURATION)
    expect(vestingWalletBalance).to.eq(INITIAL_FUND)
    expect(vestingWalletEnd).to.eq(START + DURATION)
    expect(vestingWalletBeneficiary).to.eq(beneficiaryAddress)
    expect(vestingWalletErc20Balance).to.eq(INITIAL_ERC20TOKEN_AMOUNT)
  })

  it('Should get the amount of releasable hbar', async () => {
    const releasableHbar = await vestingWallet['releasable()']()
    expect(releasableHbar).to.eq(
      Math.round(INITIAL_FUND / TINY_BAR_TO_WEI_COEF)
    )
  })

  it('Should get the amount of releasable erc20 tokens', async () => {
    const releasableTokens = await vestingWallet['releasable(address)'](
      erc20Mock.address
    )
    expect(releasableTokens).to.eq(INITIAL_ERC20TOKEN_AMOUNT)
  })

  it('Should release the native token that have already vested', async () => {
    const tx = await vestingWallet['release()']()

    const receipt = await tx.wait()

    const [receiverAddress, releasedAmount] = receipt.events.map(
      (e) => e.event === 'HbarReleased' && e
    )[0].args

    expect(receiverAddress).to.eq(beneficiaryAddress)
    expect(releasedAmount).to.eq(
      Math.round(INITIAL_FUND / TINY_BAR_TO_WEI_COEF)
    )
  })

  it('Should release the erc20 tokens that have already vested', async () => {
    const tx = await vestingWallet['release(address)'](erc20Mock.address)

    const receipt = await tx.wait()

    const [receiverAddress, releasedTokenAddress, releasedTokenAmount] =
      receipt.events.map((e) => e.event === 'ERC20Released' && e)[0].args

    expect(receiverAddress).to.eq(beneficiaryAddress)
    expect(releasedTokenAddress).to.eq(erc20Mock.address)
    expect(releasedTokenAmount).to.eq(INITIAL_ERC20TOKEN_AMOUNT)
  })

  it('Should get the amount of hbar already released', async () => {
    await vestingWallet['release()']()

    const hbarReleased = await vestingWallet['released()']()

    expect(hbarReleased).to.eq(Math.round(INITIAL_FUND / TINY_BAR_TO_WEI_COEF))
  })

  it('Should get the amount of erc20 token already released', async () => {
    await vestingWallet['release(address)'](erc20Mock.address)

    const tokenReleased = await vestingWallet['released(address)'](
      erc20Mock.address
    )

    expect(tokenReleased).to.eq(INITIAL_ERC20TOKEN_AMOUNT)
  })
})
