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
const {expect} = require('chai');
const {ethers} = require('hardhat');

describe('@discrepancies - Nonce Test Suite', async () => {
  let signers;
  let sdkClient;
  let internalCalleeContract;
  let internalCallerContract;
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

    const {gasPrice} = (await ethers.provider.getFeeData());
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
    // await Utils.associateToken(
    //   tokenCreateContract,
    //   tokenAddress,
    //   Constants.Contract.TokenCreateContract
    // );
    // await Utils.grantTokenKyc(tokenCreateContract, tokenAddress);


  });

  async function getServicesContractNonce(evmAddress){
    try{
      const info = await Utils.getContractInfo(evmAddress, sdkClient);
      return info?.ethereumNonce?.toNumber();
    }catch (e){
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
        internalCalleeContract.revertWithRevertReason({gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due insufficient gas', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCalleeContract.externalFunction({gasLimit: 21_064})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due insufficient transfer amount', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo(signers[1].address, {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due sending value to ethereum precompile 0x2', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo('0x0000000000000000000000000000000000000002', {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after evm reversion due sending value to hedera precompile0 x167', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        internalCallerContract.transferTo('0x0000000000000000000000000000000000000167', {gasLimit: 500_000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful internal call', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.externalFunction({gasLimit: 500_000});
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

    const tx = await internalCallerContract.transferTo(signers[0].address, {gasLimit: 500_000});
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful internal contract deployment', async function () {
    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const tx = await internalCalleeContract.factorySample({gasLimit: 500_000});
    await tx.wait();

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after successful ERC20 token call', async function() {

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

  it('should update nonce after successful ERC721 token call', async function() {
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

  it('should update nonce after successful call to Ethereum Precompiles', async function() {
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

  it('should update nonce after unsuccessful contract deploy with CREATE2 ', async function() {
  
    const firstTx = await internalCalleeContract.deployViaCreate2(1); 
    await firstTx.wait();

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
      internalCalleeContract.deployViaCreate2(1, {gasLimit: 500000})
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);

  });

  //fails - cannot get correct nonce
  it('should update all nonces after a successful contract deploy with CREATE2 ', async function() {

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
    const contractFactoryMnAfter = await getServicesContractNonce(internalCalleeContract.target);

    //After successful deploy verify that the nonces of the factory contract and the tx signer are updated
    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
    expectIncrementedNonce(0, 0, contractFactorySnAfter, contractFactoryMnAfter);

    const selfdestructTx = await internalCalleeContract.selfdestructSample(deployedTempContractAddress);
    await selfdestructTx.wait();

    //signer nonce should increment after selfdestruct is executed
    expectIncrementedNonce(snAfter, mnAfter, snAfter + 1, mnAfter + 1);

    //redeploy the contract with the same salt and verify nonces are updated
    const redeployTx = await internalCalleeContract.deployViaCreate2(1); 
    const redeployTxReceipt = await firstTx.wait();

    const redeployedTempContractAddress = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.DeployedContractAddress
    )[0].args[0];

    //get all addresses and verify nonces are updated

  });

  //WIP
  it.only('should not update nonces when deploying on an address with an already existing account', async function() {
    //create a hollow account and send HBAR
    const wallet = await createNewAccountWithBalance(ethers.parseEther('3.1'));
    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);
    // verify nonce of hollow account is 0
    expectNonIncrementedNonce(snAfterCreate, mnAfterCreate, 0, 0);

    //send ethers to the hollow account
    const fundTx = await signers[0].sendTransaction({
      to: wallet.address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx.wait();

    expectNonIncrementedNonce(snAfterCreate, mnAfterCreate, 0, 0);

    //send ethers from the hollow account to the GENESIS account - fails
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
    const deleteTx = await Utils.deleteAccount(wallet);
    await deleteTx.wait();

    //send HBAR to the same address and verify nonce is 0
    fundTx = await signers[0].sendTransaction({
      to: wallet.address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx.wait();

    //verify nonce is 0
    const snAfterNewCreate = await getServicesNonce(wallet.address);
    const mnAfterNewCreate = await getMirrorNodeNonce(wallet.address);

    expectNonIncrementedNonce(snAfterNewCreate, mnAfterNewCreate, 0, 0);
  });

  it('should update all nonces when chained deploys of contracts', async function() {
    
  });
});
