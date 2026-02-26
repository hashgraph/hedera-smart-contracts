// SPDX-License-Identifier: Apache-2.0

const Constants = require('../constants');
const Utils = require('../utils/hedera-token-service/utils');
const {expect} = require('chai');
const {ethers} = require('hardhat');
const TestUtils = require("../utils");

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
  let erc721Contract;
  let mintedTokenSerialNumber;

  before(async () => {
    signers = await ethers.getSigners();
    sdkClient = await Utils.createSDKClient();

    const {gasPrice} = await ethers.provider.getFeeData();
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
    erc20Contract = await Utils.deployERC20Mock();
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
      value: initialBalance,
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
          gasLimit: 21_001,
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

    const internalCalleeContractWithNewSigner = internalCalleeContract.connect(
        newAccountWithInsufficientBalance
    );
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
      value: Utils.tinybarToWeibarCoef, // 1 tinybar
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

  it('should update nonce after successful ERC20 token call', async function () {
    const signers = await ethers.getSigners();
    const amount = 200;

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        erc20Contract.transfer(tokenAddress, signers[1].address, amount, Constants.GAS_LIMIT_1_000_000)
    );

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  })

  it('should update nonce after successful ERC721 token call', async function () {
    erc721Contract = await Utils.deployERC721Mock();
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

  it('should update nonce after successful call to Ethereum Precompiles', async function () {
    const contractFactory = await ethers.getContractFactory(Constants.Contract.EthNativePrecompileCaller);
    const contract = await contractFactory.deploy({
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

    const callData = `0x${TestUtils.to32ByteString(hashedData)}${TestUtils.to32ByteString(v)}${TestUtils.to32ByteString(r)}${TestUtils.to32ByteString(s)}`;

    const snBefore = await getServicesNonce(signers[0].address);
    const mnBefore = await getMirrorNodeNonce(signers[0].address);

    const result = await contract.call0x01(callData);
    const rec = await result.wait();
    expect(rec.logs[0].data).to.contain(signerAddr);

    const snAfter = await getServicesNonce(signers[0].address);
    const mnAfter = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBefore, mnBefore, snAfter, mnAfter);
  });

  it('should update nonce after unsuccessful contract deploy with CREATE2 ', async function () {
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

  it('should reset nonce when an account has been deleted and created again', async function () {
    // create a hollow account
    const wallet = await createNewAccountWithBalance(ethers.parseEther('3.1'));
    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);
    // verify that the hollow account nonce is 0
    expectNonIncrementedNonce(snAfterCreate, mnAfterCreate, 0, 0);

    // send hbars to signers[0] address
    const signerFundTx = await wallet.sendTransaction({
      to: signers[0].address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await signerFundTx.wait();

    // verify that the nonce has been incremented and is set to 1
    const snAfterSendTx = await getServicesNonce(wallet.address);
    const mnAfterSendTx = await getMirrorNodeNonce(wallet.address);
    expectIncrementedNonce(snAfterCreate, mnAfterCreate, snAfterSendTx, mnAfterSendTx);

    // delete the newly created account
    const info = await Utils.getAccountInfo(wallet.address, sdkClient);
    await Utils.deleteAccount(wallet, sdkClient, info.accountId);

    // send hbars to the same address
    const fundTx2 = await signers[0].sendTransaction({
      to: wallet.address,
      value: Utils.tinybarToWeibarCoef // 1 tinybar
    });
    await fundTx2.wait();

    // verify that the hollow account nonce is 0
    const snAfterNewCreate = await getServicesNonce(wallet.address);
    const mnAfterNewCreate = await getMirrorNodeNonce(wallet.address);

    expectNonIncrementedNonce(snAfterNewCreate, mnAfterNewCreate, 0, 0);
  });

  it('should not increment nonce upon static call', async function () {
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);
    const tx = await internalCallerContract.staticCallExternalFunction.staticCall(signers[1].address)

    const snAfterTransfer = await getServicesNonce(signers[0].address);
    const mnAfterTransfer = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterTransfer, mnAfterTransfer)
  });

  it('should not increment nonce upon unsuccessful sent with direct call - not enough balance', async function () {
    const initialWalletBalance = Utils.tinybarToWeibarCoef;

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

    const snWallet1After = await getServicesNonce(newWallet.address);
    const mnWallet1After = await getMirrorNodeNonce(newWallet.address);

    expectNonIncrementedNonce(snWallet1Before, mnWallet1Before, snWallet1After, mnWallet1After)
  });

  it('should update nonce upon transfer to non-existing account with enough gas limit > 600k (hollow account creation)', async function () {
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    const wallet1 = ethers.Wallet.createRandom();
    const newAccTx = await signers[0].sendTransaction({
      to: wallet1.address,
      value: ethers.parseEther('1'),
      gasLimit: 650_000,
    });
    await newAccTx.wait();

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  it('should not update nonce upon unsuccessful transaction due to wrong chain id', async function () {
    const wallet1 = ethers.Wallet.createRandom();
    const snBeforeTransfer = await getServicesNonce(signers[0].address);
    const mnBeforeTransfer = await getMirrorNodeNonce(signers[0].address);

    await Utils.expectToFail(
        signers[0].sendTransaction({
          to: wallet1.address,
          value: ethers.parseEther('1'),
          gasLimit: 650_000,
          chainId: 8n
        })
    );

    const snAfterCreate = await getServicesNonce(signers[0].address);
    const mnAfterCreate = await getMirrorNodeNonce(signers[0].address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate)
  });

  it('should update nonce upon transaction of type 0', async function () {
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: ethers.parseEther('1'),
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

  it('should update nonce upon transaction of type 1', async function () {
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: ethers.parseEther('1'),
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

  it('should update nonce upon transaction of type 2', async function () {
    const wallet1 = ethers.Wallet.createRandom();

    const defaultTransactionFields = {
      to: wallet1.address,
      value: ethers.parseEther('1'),
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

  it('should update nonce on hollow account finalization', async function () {
    const wallet = await createNewAccountWithBalance(ethers.parseEther('10'));
    const wallet2 = ethers.Wallet.createRandom().connect(ethers.provider);

    let infoBefore = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(infoBefore.key._key).to.equal(undefined);

    const snBeforeTransfer = await getServicesNonce(wallet.address);
    const mnBeforeTransfer = await getMirrorNodeNonce(wallet.address);

    const newAccTx1 = await wallet.sendTransaction({
      to: wallet2.address,
      value: Utils.tinybarToWeibarCoef,
      gasLimit: 650_000,
    });
    await newAccTx1.wait();

    let infoAfter = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(infoAfter.key._key).to.not.equal(undefined);

    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);

    expectIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);
  });

  it('should not update nonce on hollow account finalization due to reversion when offered gas price and allowance fail check', async function () {
    const wallet = await createNewAccountWithBalance(ethers.parseEther('10'));

    let infoBefore = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(infoBefore.key._key).to.equal(undefined);

    const snBeforeTransfer = await getServicesNonce(wallet.address);
    const mnBeforeTransfer = await getMirrorNodeNonce(wallet.address);

    await Utils.expectToFail(
        wallet.sendTransaction({
          to: signers[0].address,
          value: Utils.tinybarToWeibarCoef,
          gasPrice: tooLowGasPrice,
          maxGasAllowance: 0,
          gasLimit: 650_000,
        })
    );

    let infoAfter = await Utils.getAccountInfo(wallet.address, sdkClient);
    expect(infoAfter.key._key).to.not.equal(undefined);

    const snAfterCreate = await getServicesNonce(wallet.address);
    const mnAfterCreate = await getMirrorNodeNonce(wallet.address);

    expectNonIncrementedNonce(snBeforeTransfer, mnBeforeTransfer, snAfterCreate, mnAfterCreate);

  });
});
