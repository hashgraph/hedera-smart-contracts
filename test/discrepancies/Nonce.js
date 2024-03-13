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

const { utils } = require('elliptic');
const Constants = require('../constants');
const Utils = require("../hts-precompile/utils");
const TestUtils = require("../utils");
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { ContractId } = require('@hashgraph/sdk');

describe.only('@discrepancies - Nonce Test Suite', async () => {
  let signers;
  let sdkClient;
  let internalCalleeContract;
  let internalCallerContract;
  let chainedContracts
  let tooLowGasPrice;
  let enoughGasPrice;
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenAddress;
  let erc20Contract;
  const TOTAL_SUPPLY = 1000;

  before(async () => {
    signers = await ethers.getSigners();
    sdkClient = await Utils.createSDKClient();

    const { gasPrice } = (await ethers.provider.getFeeData());
    tooLowGasPrice = gasPrice - BigInt(1);
    enoughGasPrice = gasPrice + BigInt(1);

    const internalCalleeContractFactory = await ethers.getContractFactory(Constants.Contract.InternalCallee);
    internalCalleeContract = await internalCalleeContractFactory.deploy();

    const internalCallerContractFactory = await ethers.getContractFactory(Constants.Contract.InternalCaller);
    internalCallerContract = await internalCallerContractFactory.deploy();

    tokenCreateContract = await Utils.deployTokenCreateContract();
    tokenTransferContract = await Utils.deployTokenTransferContract();
    await Utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    erc20Contract = await Utils.deployERC20Contract();
    tokenAddress = await Utils.createFungibleToken(
      tokenCreateContract,
      signers[0].address
    );

    await Utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    await Utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await Utils.grantTokenKyc(tokenCreateContract, tokenAddress);


  });

  async function getServicesContractNonce(evmAddress) {
    try {
      const info = await Utils.getContractInfo(evmAddress, sdkClient);
      return info;
    } catch (e) {
      return null;
    }
  }

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

  it('should not update nonce when intrinsic gas handler check failed', async function () {
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

  it('should not update nonce when offered gas price and allowance are zero handler check failed', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.externalFunction({
        gasPrice: tooLowGasPrice,
        maxGasAllowance: 0
      })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should not update nonce when offered gas price is less than current and sender does not have enough balance handler check failed', async function () {
    const newAccountWithInsufficientBalance = await createNewAccountWithBalance();

    const snBefore = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnBefore = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(newAccountWithInsufficientBalance);
    await Utils.expectToFail(
      internalCalleeContractWithNewSigner.externalFunction({
        gasPrice: tooLowGasPrice
      })
    );

    const snAfter = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnAfter = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should not update nonce when offered gas price is less than current and gas allowance is less than remaining fee handler check failed', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.externalFunction({
        gasPrice: tooLowGasPrice,
        maxGasAllowance: 0
      })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should not update nonce when offered gas price is bigger than current and sender does not have enough balance handler check failed', async function () {
    const newAccountWithInsufficientBalance = await createNewAccountWithBalance();

    const snBefore = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnBefore = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(newAccountWithInsufficientBalance);
    await Utils.expectToFail(
      internalCalleeContractWithNewSigner.externalFunction({
        gasPrice: enoughGasPrice
      })
    );

    const snAfter = await getServicesNonce(newAccountWithInsufficientBalance.address);
    const mnAfter = await getMirrorNodeNonce(newAccountWithInsufficientBalance.address);

    expectNonIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should not update nonce  when sender does not have enough balance handler check failed', async function () {
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

  it('should update nonce after evm reversion due contract logic', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.revertWithRevertReason({ gasLimit: 500_000 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due insufficient gas', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.externalFunction({ gasLimit: 21_064 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due insufficient transfer amount', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCallerContract.transferTo(signers[1].address, { gasLimit: 500_000 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due sending value to ethereum precompile 0x2', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCallerContract.transferTo('0x0000000000000000000000000000000000000002', { gasLimit: 500_000 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due sending value to hedera precompile0 x167', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCallerContract.transferTo('0x0000000000000000000000000000000000000167', { gasLimit: 500_000 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful internal call', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.externalFunction({ gasLimit: 500_000 });
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful internal transfer', async function () {
    const fundTx = await signers[0].sendTransaction({
      to: internalCallerContract.target,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx.wait();

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCallerContract.transferTo(signers[0].address, { gasLimit: 500_000 });
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful internal contract deployment', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.factorySample({ gasLimit: 500_000 });
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  //NONCE-017
  it('should update nonce after successful ERC20 token call', async function () {

    const signers = await ethers.getSigners();
    const amount = 200;

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    try {
      const tx = await erc20Contract
        .connect(signers[0])
        .transfer(
          tokenAddress,
          signers[1].address,
          amount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  })

  //NONCE-017
  it('should update nonce after successful ERC721 token call', async function () {
    erc721Contract = await Utils.deployERC721Contract();
    tokenAddress = await Utils.createNonFungibleToken(
      tokenCreateContract,
      signers[0].address
    );
    await Utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    mintedTokenSerialNumber = await Utils.mintNFT(
      tokenCreateContract,
      tokenAddress
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  //NONCE-018
  it('should update nonce after successful call to Ethereum Precompiles', async function () {
    const Contract = await ethers.getContractFactory(
      Constants.Contract.EthNativePrecompileCaller
    );
    contract = await Contract.deploy({
      gasLimit: 15_000_000,
    });

    const UNSIGNED_DATA = 'Hello Eth Native Precompiles!';
    let signer = (await ethers.getSigners())[0];
    let hashedData = ethers.hashMessage(UNSIGNED_DATA);
    let signedData = await signer.signMessage(UNSIGNED_DATA);
    let signerAddr = signer.address.toLowerCase().replace('0x', '');

    const splitSignature = ethers.Signature.from(signedData);

    let v = splitSignature.v;
    let r = splitSignature.r;
    let s = splitSignature.s;

    const callData = `0x${TestUtils.to32ByteString(hashedData)}${TestUtils.to32ByteString(
      v
    )}${TestUtils.to32ByteString(r)}${TestUtils.to32ByteString(s)}`;

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const result = await contract.call0x01(callData);
    const rec = await result.wait();
    expect(rec.logs[0].data).to.contain(signerAddr);

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  //NONCE-019
  it('should update nonce after unsuccessful contract deploy with CREATE2 ', async function () {

    const firstTx = await internalCalleeContract.deployViaCreate2(1);
    await firstTx.wait();

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.deployViaCreate2(1, { gasLimit: 500000 })
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);

  });

  //NONCE-020 - WAITING FOR SDK TEAM FOR CHECKING THE CONTRACT NONCE
  xit('should update all nonces after a successful contract deploy with CREATE2 ', async function () {

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    //deploy a contract with CREATE2
    const firstTx = await internalCalleeContract.deployViaCreate2(1);
    const txReceipt = await firstTx.wait();

    const deployedTempContractAddress = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.DeployedContractAddress
    )[0].args[0];

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    //get the nonce of the intermediary contract
    const contractFactorySnAfter = await getServicesContractNonce(internalCalleeContract.target);
    const contractFactoryMnAfter = await getMirrorNodeNonce(internalCalleeContract.target);

    //After successful deploy verify that the nonces of the factory contract and the tx signer are updated
    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
    expectIncrementedNonce(0, 0, contractFactorySnAfter, contractFactoryMnAfter);

    const selfdestructTx = await internalCalleeContract.selfdestructSample(deployedTempContractAddress);
    await selfdestructTx.wait();

    //signer nonce should increment after selfdestruct is executed
    expectIncrementedNonce(snAfter, mnAfter, snAfter + 1, mnAfter + 1);

    //redeploy the contract with the same salt and verify nonces are updated
    const redeployTx = await internalCalleeContract.deployViaCreate2(1);
    const redeployTxReceipt = await redeployTx.wait();

    const redeployedTempContractAddress = redeployTxReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.DeployedContractAddress
    )[0].args[0];

    //get all addresses and verify nonces are updated

  });

  //NONCE-021
  it('should not update nonces when deploying on an address with an already existing account', async function () {
    //create a hollow account and send tokens
    const wallet = await createNewAccountWithBalance(ethers.parseEther('3.1'));
    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);
    // verify nonce of hollow account after token received is 0
    expectNonIncrementedNonce(snAfterCreate, mnAfterCreate, 0, 0);

    //send ethers from the hollow account to the GENESIS account 
    const signerFundTx = await wallet.sendTransaction({
      to: signers[0].address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await signerFundTx.wait();

    //verify new account nonce is 1
    const snAfterSendTx = await getServicesNonce(wallet.address);
    const mnAfterSendTx = await getMirrorNodeNonce(wallet.address);

    expectIncrementedNonce(snAfterCreate, mnAfterCreate, snAfterSendTx, mnAfterSendTx);

    //delete the account
    const info = await Utils.getAccountInfo(wallet.address, sdkClient);
    const deleteTx = await Utils.deleteAccount(wallet, sdkClient, info.accountId);

    //send tokens to the same address and verify nonce is 0
    const fundTx2 = await signers[0].sendTransaction({
      to: wallet.address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx2.wait();

    //verify nonce is 0
    const snAfterNewCreate = await getServicesNonce(wallet.address);
    const mnAfterNewCreate = await getMirrorNodeNonce(wallet.address);

    expectNonIncrementedNonce(snAfterNewCreate, mnAfterNewCreate, 0, 0);
  });

  //NONCE-022
  //should fix the get contract nonce function - waiting for SDKs
  xit('should update all nonces when chained deploys of contracts', async function () {
    //deploys contract A which deploys contract B which deploys contract C
    //nonces of signer, contract A and contract B should increment
    //nonce of contract C should be 0
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    //deploy contract A which will deploy Contract B which will deploy Contract C
    const chainedContractsFactory = await ethers.getContractFactory(Constants.Contract.ChainedContracts);
    const chainedContracts = await chainedContractsFactory.deploy({ gasLimit: 5_000_000 });
    const receipt = await chainedContracts.deploymentTransaction().wait();

    console.log(receipt.logs);

    //get the 3 contracts addresses
    const innerContract = receipt.logs[0].address;
    const intermediaryContract = receipt.logs[1].address;
    const outerContract = receipt.logs[2].address;

    //get the 3 contracts nonces
    const servicesInnerContractNonce = await Utils.getContractInfo(innerContract, sdkClient);
    const mirrorNodeInnerContractNonce = await getMirrorNodeNonce(innerContract);

    const servicesIntermediaryContractContractNonce = await getServicesContractNonce(intermediaryContract.target);
    const mirrorNodeIntermediaryContractNonce = await getMirrorNodeNonce(intermediaryContract.target);

    const servicesOuterContractNonce = await getServicesContractNonce(outerContract.target);
    const mirrorNodeOuterContractNonce = await getMirrorNodeNonce(outerContract.target);

    //verify signer nonces have updated correctly
    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);
    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);

    //verify contract nonces have updated 
    expectIncrementedNonce(0, 0, servicesIntermediaryContractContractNonce, mirrorNodeIntermediaryContractNonce);
    expectIncrementedNonce(0, 0, servicesOuterContractNonce, mirrorNodeOuterContractNonce);

    //verify nonce of the inner most contract is 0
    expectNonIncrementedNonce(0, 0, servicesInnerContractNonce, mirrorNodeInnerContractNonce);
  });

  //NONCE-023
  //need to update the get contract nonce - waiting for SDK
  xit('should update contract nonce for each deployed contract', async function () {
    //deploys contract A which deploys contracts B and C
    //nonce of signer should be 1
    //nonce of contract A should be 2
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    //deploy contract A which will deploy Contract B and C
    const Deploys2ContractsFactory = await ethers.getContractFactory(Constants.Contract.Deploys2Contracts);
    const deploys2Contracts = await Deploys2ContractsFactory.deploy({ gasLimit: 5_000_000 });
    const receipt = await deploys2Contracts.deploymentTransaction().wait();

    const deploys2ContractsAddress = receipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.Deploys2ContractsAddress
    )[0].args[0];

    //get contract nonce after deployment
    const sContractNonce = await getServicesContractNonce(deploys2ContractsAddress);
    const mContractNonce = await getMirrorNodeNonce(deploys2ContractsAddress);

    //verify signer nonces have updated correctly
    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);
    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);

    //verify contract nonce have updated 2 times
    expect(sContractNonce).to.equal(2);
    expect(mContractNonce).to.equal(2);
  });

  //NONCE-024 
  it('Nonce should NOT be incremented upon static call', async function () {
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);
    const tx = await internalCallerContract.staticCallExternalFunction.staticCall(signers[1].address)

    const snAfterTransfer = await getServicesNonce(signers[0].address);
    const mnAfterTransfer = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterTransfer, mnAfterTransfer)
  });

  //NONCE-026
  it('Nonce should NOT be incremented upon unsuccessfull sent with Direct call - not enough balance', async function () {
    initialValue = 100000 * Utils.tinybarToWeibarCoef
    initialWalletBalance = Utils.tinybarToWeibarCoef;

    const newWallet = await createNewAccountWithBalance(initialWalletBalance);
    const newWallet2 = await createNewAccountWithBalance(initialWalletBalance);

    const snWallet1Before = await getServicesNonce(newWallet.address);
    const mnWallet1Before = await getMirrorNodeNonce(newWallet.address);

    await Utils.expectToFail(
      newWallet.sendTransaction({
        to: newWallet2.address,
        value: 20000000000,
      })
    );

    const snWAllet1After = await getServicesNonce(newWallet.address);
    const mnWallet1After = await getMirrorNodeNonce(newWallet.address);

    expectNonIncrementedNonce(snWallet1Before, mnWallet1Before, snWAllet1After, mnWallet1After)
  });

  //NONCE-027 - WAITING FOR SDK TEAM FOR CHECKING THE CONTRACT NONCE
  xit('should update nonce after unsuccessful transfer with internal call - insufficent gas', async function () {
    const amount = ethers.parseEther('1');
    const fundTx = await signers[0].sendTransaction({
      to: internalCallerContract.target,
      value: amount 
    });
    await fundTx.wait();

    const snBeforeSigner = await getServicesNonce(signers[0].address);
    const mnBeforeSigner = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.internalTransfer(internalCallerContract.target, signers[1].address, {gasLimit: 25_900})
    );

    // const tx = await internalCalleeContract.internalTransfer(internalCallerContract.target, signers[1].address, {gasLimit: 22_900});
    // const txResult = await tx.wait();

    const snAfterSigner = await getServicesNonce(signers[0].address);
    const mnAfterSigner = await getMirrorNodeNonce(signers[0].address);
    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

    //NONCE-027 - WAITING FOR SDK TEAM FOR CHECKING THE CONTRACT NONCE
    xit('should update nonce after unsuccessful transfer with internal call - insufficent amount', async function () {
      //  const amount = Utils.tinybarToWeibarCoef;  // 1 tinybar
      //   const fundTx = await signers[0].sendTransaction({
      //   to: internalCallerContract.target,
      //   value: amount 
      // });
      // await fundTx.wait();
  
      const snBeforeSigner = await getServicesNonce(signers[0].address);
      const mnBeforeSigner = await getMirrorNodeNonce(signers[0].address);
  
      await Utils.expectToFail(
        internalCalleeContract.internalTransfer(internalCallerContract.target, signers[1].address)
      );
      // const tx = await internalCalleeContract.internalTransfer(internalCallerContract.target, signers[1].address);
      // const txResult = await tx.wait();
  
      const snAfterSigner = await getServicesNonce(signers[0].address);
      const mnAfterSigner = await getMirrorNodeNonce(signers[0].address);
     // expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
    });

  //NONCE-028
  it('should update signer nonce upon transfer to non-existing account with enough gas limit >600K', async function () {
    const amount = ethers.parseEther('1');
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const wallet1 = ethers.Wallet.createRandom();
    const newAccTx = await signers[0].sendTransaction({
      to: wallet1.address,
      value: amount,
      gasLimit: 650_000,
    });
    await newAccTx.wait();

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  //NONCE-029 - Skipped due to an issue that a hollow account can be created with a gas limit of 21001
  xit('should update signer nonce upon transfer to non-existing account with not enough gas limit <600K', async function () {
    const amount = ethers.parseEther('1');
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const wallet1 = ethers.Wallet.createRandom();
    const newAccTx = await signers[0].sendTransaction({
      to: wallet1.address,
      value: amount,
      gasLimit: 22_000
    });
    //await newAccTx.wait();
    console.log(await newAccTx.wait());

    // internalCallerContract.transferTo(wallet1.address, {gasLimit: 700_000})

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);


    // const tx = await internalCallerContract.transferTo(signers[0].address, {gasLimit: 500_000});
    // await tx.wait();
  });

  //NONCE-030
  it('should not update nonce upon unsuccessfull transaction due to wrong chain id', async function () {
    const amount = ethers.parseEther('1');
    const wallet1 = ethers.Wallet.createRandom();
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      signers[0].sendTransaction({
        to: wallet1.address,
        value: amount,
        gasLimit: 650_000,
        chainId: 8n
      })
    );

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate)
  });

  //NONCE-031 - Type 0
  it('should update nonce upon transaction of type 0', async function () {
    const amount = ethers.parseEther('1');
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: amount,
      gasLimit: 650_000
    };


    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const newAccTx1 = await signers[0].sendTransaction({
      ...defaultTransactionFields,
      type: 0,
      nonce: snBeforeTransfer,
      gasPrice: enoughGasPrice,
    });
    await newAccTx1.wait();

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  //NONCE-031 - Type 1
  it('should update nonce upon transaction of type 1', async function () {
    const amount = ethers.parseEther('1');
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: amount,
      gasLimit: 650_000
    };


    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const newAccTx1 = await signers[0].sendTransaction({
      ...defaultTransactionFields,
      type: 1,
      nonce: snBeforeTransfer,
      gasPrice: enoughGasPrice,
      accessList: [],
    });
    await newAccTx1.wait();

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  //NONCE-031 - Type 2
  it('should update nonce upon transaction of type 2', async function () {
    const amount = ethers.parseEther('1');
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: amount,
      gasLimit: 650_000
    };

    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const newAccTx1 = await signers[0].sendTransaction({
      ...defaultTransactionFields,
      type: 2,
      nonce: snBeforeTransfer,
      maxFeePerGas: enoughGasPrice,
      maxPriorityFeePerGas: enoughGasPrice,
    });
    await newAccTx1.wait();

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  //NONCE-032
  it('Hollow account that is finilized with the same transaction that should upgrade its nonce', async function () {
    const amount = Utils.tinybarToWeibarCoef;

    const wallet = await createNewAccountWithBalance(ethers.parseEther('10'));
    const wallet2 = ethers.Wallet.createRandom().connect(ethers.provider);

    let jsonRequest2 = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(jsonRequest2.key._key).to.equal(undefined);

    const snBeforeTransfer = await getServicesNonce(wallet.address);
    const mnBeforeTransfer = await getMirrorNodeNonce(wallet.address);

    const newAccTx1 = await wallet.sendTransaction({
      to: wallet2.address,
      value: amount,
      gasLimit: 650_000,
    });
    await newAccTx1.wait();

    let jsonRequest3 = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(jsonRequest3.key._key).to.not.equal(undefined);

    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);

  });


  //NONCE-033
  it('Hollow account that is finilized with the same transaction that should not upgrade its nonce when offered gas price and and allowance fail check ', async function () {
    const amount = Utils.tinybarToWeibarCoef;

    const wallet = await createNewAccountWithBalance(ethers.parseEther('10'));

    let jsonRequest2 = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(jsonRequest2.key._key).to.equal(undefined);

    const snBeforeTransfer = await getServicesNonce(wallet.address);
    const mnBeforeTransfer = await getMirrorNodeNonce(wallet.address);

    await Utils.expectToFail(
      wallet.sendTransaction({
        to: signers[0].address,
        value: amount,
        gasPrice: tooLowGasPrice,
        maxGasAllowance: 0,
        gasLimit: 650_000,
      })
    );

    let jsonRequest3 = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(jsonRequest3.key._key).to.not.equal(undefined);

    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);

  });
});
