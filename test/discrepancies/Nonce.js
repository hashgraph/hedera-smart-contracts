/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

const Utils = require("../hts-precompile/utils");
const {expect} = require('chai');
const {ethers} = require('hardhat');

xdescribe('Nonce discrepancies Test Suite', async () => {
  let signers;
  let sdkClient;
  let internalCalleeContract;
  let internalCallerContract;

  before(async () => {
    signers = await ethers.getSigners();
    sdkClient = await Utils.createSDKClient();

    const internalCalleeContractFactory = await ethers.getContractFactory("InternalCallee");
    internalCalleeContract = await internalCalleeContractFactory.deploy();

    const internalCallerContractFactory = await ethers.getContractFactory("InternalCaller");
    internalCallerContract = await internalCallerContractFactory.deploy();
  });

  async function getServicesNonce(evmAddress) {
    try {
      const info = await Utils.getAccountInfo(evmAddress, sdkClient);
      return info?.ethereumNonce?.toNumber();
    } catch (e) {
      return null;
    }
  }

  async function getMirrorNodeNonce(evmAddress) {
    try {
      return await ethers.provider.getTransactionCount(evmAddress, 'latest');
    } catch (e) {
      return null;
    }
  }

  async function createNewAccountWithBalance(initialBalance = Utils.tinybarToWeibarCoef) {
    const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const newAccTx = await signers[0].sendTransaction({
      to: wallet.address,
      value: initialBalance
    });
    await newAccTx.wait();

    return wallet;
  }

  function expectNonIncrementedNonce(servicesNonceBefore, mirrorNodeNonceBefore, servicesNonceAfter, mirrorNodeNonceAfter) {
    expect(servicesNonceBefore).to.equal(mirrorNodeNonceBefore);
    expect(servicesNonceBefore).to.equal(servicesNonceAfter);
    expect(mirrorNodeNonceBefore).to.equal(mirrorNodeNonceAfter);
  }

  function expectIncrementedNonce(servicesNonceBefore, mirrorNodeNonceBefore, servicesNonceAfter, mirrorNodeNonceAfter) {
    expect(servicesNonceBefore).to.equal(mirrorNodeNonceBefore);
    expect(servicesNonceAfter).to.equal(servicesNonceBefore + 1);
    expect(mirrorNodeNonceAfter).to.equal(mirrorNodeNonceBefore + 1);
  }

  it('nonceNotUpdatedWhenIntrinsicGasHandlerCheckFailed', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.externalFunction({
          gasLimit: 21_001
        })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceNotUpdatedWhenUserOfferedGasPriceAndAllowanceAreZeroHandlerCheckFailed', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.externalFunction({
          maxFeePerGas: 0,
          maxGasAllowance: 0
        })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceNotUpdatedWhenOfferedGasPriceIsLessThanCurrentAndSenderDoesNotHaveEnoughBalanceHandlerCheckFailed', async function () {
    const newAccountWithInsufficientBalance = await createNewAccountWithBalance();

    const snBefore = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnBefore = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(newAccountWithInsufficientBalance);
    await Utils.expectToFail(
        internalCalleeContractWithNewSigner.externalFunction({
          maxFeePerGas: 1
        })
    );

    const snAfter = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnAfter = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceNotUpdatedWhenOfferedGasPriceIsLessThanCurrentAndGasAllowanceIsLessThanRemainingFeeHandlerCheckFailed', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.externalFunction({
          maxFeePerGas: 1,
          maxGasAllowance: 0
        })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });


  it('nonceNotUpdatedWhenOfferedGasPriceIsBiggerThanCurrentAndSenderDoesNotHaveEnoughBalanceHandlerCheckFailed', async function () {
    const newAccountWithInsufficientBalance = await createNewAccountWithBalance();

    const snBefore = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnBefore = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(newAccountWithInsufficientBalance);
    await Utils.expectToFail(
        internalCalleeContractWithNewSigner.externalFunction({
          maxFeePerGas: 75
        })
    );

    const snAfter = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnAfter = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceNotUpdatedWhenSenderDoesNotHaveEnoughBalanceHandlerCheckFailed', async function () {
    const newAccountWithInsufficientBalance = await createNewAccountWithBalance();

    const snBefore = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnBefore = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(newAccountWithInsufficientBalance);
    await Utils.expectToFail(
        internalCalleeContractWithNewSigner.externalFunction({
          value: 2 * Utils.tinybarToWeibarCoef // 2 tinybars
        })
    );

    const snAfter = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnAfter = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterEvmReversionDueContractLogic', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.revertWithRevertReason({gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterEvmReversionDueInsufficientGas', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.externalFunction({gasLimit: 21_064})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterEvmReversionDueInsufficientTransferAmount', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo(signers[1].address, {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterEvmReversionDueSendingValueToEthereumPrecompile0x2', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo('0x0000000000000000000000000000000000000002', {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterEvmReversionDueSendingValueToHederaPrecompile0x167', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo('0x0000000000000000000000000000000000000167', {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterSuccessfulInternalCall', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.externalFunction({gasLimit: 500_000});
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterSuccessfulInternalTransfer', async function () {
    const fundTx = await signers[0].sendTransaction({
      to: internalCallerContract.target,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx.wait();

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCallerContract.transferTo(signers[0].address, {gasLimit: 500_000});
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('nonceUpdatedAfterSuccessfulInternalContractDeployment', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.factorySample({gasLimit: 500_000});
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });
});
