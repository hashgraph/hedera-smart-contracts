const Constants = require('../../constants');
const { expect, assert } = require('chai');
const hre = require('hardhat');
const fs = require('fs');
const { ethers } = hre;
const { hexToASCII } = require('../../utils')

const BESU_RESULTS_JSON_PATH = __dirname + '/opcodeLoggerBesuResults.json';
const IS_BESU_NETWORK = hre.network.name === 'besu_local';

describe('@OpcodeLogger Test Suite', async function () {
  let signers;
  let randomAddress;
  let opcodeLogger;

  before(async () => {
    signers = await ethers.getSigners();
    randomAddress = (ethers.Wallet.createRandom()).address;

    const factoryOpcodeLogger = await ethers.getContractFactory(Constants.Contract.OpcodeLogger);
    opcodeLogger = await factoryOpcodeLogger.deploy();
    await opcodeLogger.waitForDeployment();
  });

  async function executeDebugTraceTransaction(txHash, options = {
    tracer: 'opcodeLogger',
    disableStorage: true,
    disableMemory: true,
    disableStack: true
  }) {
    return await signers[0].provider.send(
      'debug_traceTransaction', [txHash, options]
    );
  }

  describe('besu comparison', async function () {
    let erc20;
    let erc721;
    let besuResults;
    let updatedBesuResults = {};
    const NFT_ID = 5644;

    function compareOutputs(methodName, result) {
      if (hre.network.name !== 'besu_local') {
        expect(result).to.haveOwnProperty('gas');
        expect(result).to.haveOwnProperty('failed');
        expect(result).to.haveOwnProperty('returnValue');
        expect(result).to.haveOwnProperty('structLogs');

        const besuResp = besuResults[methodName];
        expect(besuResp).to.exist;
        expect(besuResp.failed).to.equal(result.failed);
        expect(besuResp.structLogs.length).to.equal(result.structLogs.length);
        expect(besuResp.structLogs.map(e => e.op)).to.deep.equal(result.structLogs.map(e => e.op));
      }
    }

    async function updateBesuResponsesIfNeeded(key, txHash) {
      if (IS_BESU_NETWORK) {
        updatedBesuResults[key] = await executeDebugTraceTransaction(txHash);
      }
    }

    before(async () => {
      besuResults = JSON.parse(fs.readFileSync(BESU_RESULTS_JSON_PATH));

      const erc20Factory = await ethers.getContractFactory(Constants.Path.ERC20Mock);
      erc20 = await erc20Factory.deploy(Constants.TOKEN_NAME, Constants.TOKEN_SYMBOL);
      await erc20.waitForDeployment();
      await (await erc20.mint(signers[0].address, 10_000_000_000)).wait();

      const erc721Factory = await ethers.getContractFactory(Constants.Path.ERC721Mock);
      erc721 = await erc721Factory.deploy(Constants.TOKEN_NAME, Constants.TOKEN_SYMBOL);
      await erc721.waitForDeployment();
      await (await erc721.mint(signers[0].address, NFT_ID)).wait();
    });

    after(async () => {
      if (IS_BESU_NETWORK) {
        fs.writeFileSync(BESU_RESULTS_JSON_PATH, JSON.stringify(updatedBesuResults, null, 2));
      }
    });

    it('should be able to call nonExisting contract', async function () {
      const res = await (await signers[0].sendTransaction({
        to: randomAddress,
        data: '0x00564400'
      })).wait();

      await updateBesuResponsesIfNeeded('nonExistingContract', res.hash);
      compareOutputs('nonExistingContract', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to call existing contract with nonExisting function', async function () {
      const res = await (await signers[0].sendTransaction({
        to: randomAddress,
        data: '0x00564400'
      })).wait();

      await updateBesuResponsesIfNeeded('existingContractNonExistingFunction', res.hash);
      compareOutputs('existingContractNonExistingFunction', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute updateOwner()', async function () {
      const res = await (await opcodeLogger.updateOwner({ gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('updateOwner', res.hash);
      compareOutputs('updateOwner', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute resetCounter()', async function () {
      const res = await (await opcodeLogger.resetCounter({ gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('resetCounter', res.hash);
      compareOutputs('resetCounter', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute call()', async function () {
      const res = await (await opcodeLogger.call(randomAddress, '0x056440', { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('call', res.hash);
      compareOutputs('call', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute staticCall()', async function () {
      const res = await (await opcodeLogger.staticCall(randomAddress, '0x056440', { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('staticCall', res.hash);
      compareOutputs('staticCall', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute callCode()', async function () {
      const res = await (await opcodeLogger.callCode(randomAddress, '0x056440', { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('callCode', res.hash);
      compareOutputs('callCode', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute delegateCall()', async function () {
      const res = await (await opcodeLogger.delegateCall(randomAddress, '0x056440', { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('delegateCall', res.hash);
      compareOutputs('delegateCall', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.approve()', async function () {
      const res = await (await erc20.approve(randomAddress, 5644, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc20.approve', res.hash);
      compareOutputs('erc20.approve', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.transfer()', async function () {
      const res = await (await erc20.transfer(randomAddress, 5644, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc20.transfer', res.hash);
      compareOutputs('erc20.transfer', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.transferFrom()', async function () {
      await (await erc20.approve(signers[1].address, 5644, { gasLimit: 1_000_000 })).wait();
      const erc20SecondSigner = erc20.connect(signers[1]);

      const res = await (await erc20SecondSigner.transferFrom(signers[0].address, randomAddress, 56, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc20.transferFrom', res.hash);
      compareOutputs('erc20.transferFrom', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.approve()', async function () {
      const res = await (await erc721.approve(randomAddress, NFT_ID, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc721.approve', res.hash);
      compareOutputs('erc721.approve', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.setApprovalForAll()', async function () {
      const res = await (await erc721.setApprovalForAll(randomAddress, true, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc721.setApprovalForAll', res.hash);
      compareOutputs('erc721.setApprovalForAll', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.transferFrom()', async function () {
      await (await erc721.approve(signers[1].address, NFT_ID, { gasLimit: 1_000_000 })).wait();
      const erc721SecondSigner = erc721.connect(signers[1]);

      const res = await (await erc721SecondSigner.transferFrom(signers[0].address, signers[1].address, NFT_ID, { gasLimit: 1_000_000 })).wait();
      await updateBesuResponsesIfNeeded('erc721.transferFrom', res.hash);
      compareOutputs('erc721.transferFrom', await executeDebugTraceTransaction(res.hash));
    });
  });

  const txTypeSpecificSuitesConfig = {
    'type 0 tx suite': { gasLimit: 5_000_000, gasPrice: 710_000_000_000 },
    'type 1 tx suite': { gasLimit: 5_000_000, gasPrice: 710_000_000_000, accessList: [] },
    'type 2 tx suite': { gasLimit: 5_000_000 },
  };
  for (let suiteName in txTypeSpecificSuitesConfig) {
    const txTypeSpecificOverrides = txTypeSpecificSuitesConfig[suiteName];
    describe(suiteName, async function () {
      it('successful CREATE transaction with disabledMemory, disabledStack, disabledStorage set to false', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: false,
          disableStack: false
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('failing CREATE transaction with disabledMemory, disabledStack, disabledStorage set to false', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy({ ...txTypeSpecificOverrides, gasLimit: 25484 });
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: false,
          disableStack: false
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('successful CREATE transaction with disabledMemory, disabledStack, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CREATE transaction with disabledMemory, disabledStack, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy({ ...txTypeSpecificOverrides, gasLimit: 25484 });
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('successful CREATE transaction with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: false,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CREATE transaction with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy({ ...txTypeSpecificOverrides, gasLimit: 25484 });
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: false,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('successful CREATE transaction with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: false
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('failing CREATE transaction with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy({ ...txTypeSpecificOverrides, gasLimit: 25484 });
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: false
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('successful CREATE transaction with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CREATE transaction with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy({ ...txTypeSpecificOverrides, gasLimit: 25484 });
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const { hash } = await contract.deploymentTransaction();
        const res = await executeDebugTraceTransaction(hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('successful CALL transaction with disabledMemory, disabledStack, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter(txTypeSpecificOverrides);
        await tx.wait();
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CALL transaction with disabledMemory, disabledStack, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter({ ...txTypeSpecificOverrides, gasLimit: 21_064 });
        await expect(tx.wait()).to.be.rejectedWith(Error);
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('successful CALL transaction with disabledMemory, disabledStack, disabledStorage set to false', async function () {
        const tx = await opcodeLogger.resetCounter(txTypeSpecificOverrides);
        await tx.wait();
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: false,
          disableStack: false
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('failing CALL transaction with disabledMemory, disabledStack, disabledStorage set to false', async function () {
        const tx = await opcodeLogger.resetCounter({ ...txTypeSpecificOverrides, gasLimit: 21_064 });
        await expect(tx.wait()).to.be.rejectedWith(Error);
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: false,
          disableStack: false
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });
      it('successful CALL transaction with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter(txTypeSpecificOverrides);
        await tx.wait();
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: false,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CALL transaction with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter({ ...txTypeSpecificOverrides, gasLimit: 21_064 });
        await expect(tx.wait()).to.be.rejectedWith(Error);
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: false,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.not.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('successful CALL transaction with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter(txTypeSpecificOverrides);
        await tx.wait();
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: false
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('failing CALL transaction with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
        const tx = await opcodeLogger.resetCounter({ ...txTypeSpecificOverrides, gasLimit: 21_064 });
        await expect(tx.wait()).to.be.rejectedWith(Error);
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: true,
          disableMemory: true,
          disableStack: false
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.not.equal(null);
        });
      });

      it('successful CALL transaction with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
        const tx = await opcodeLogger.resetCounter(txTypeSpecificOverrides);
        await tx.wait();
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.false;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });

      it('failing CALL transaction with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
        const tx = await opcodeLogger.resetCounter({ ...txTypeSpecificOverrides, gasLimit: 21_064 });
        await expect(tx.wait()).to.be.rejectedWith(Error);
        const res = await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: false,
          disableMemory: true,
          disableStack: true
        });

        expect(res.failed).to.be.true;
        expect(res.structLogs.length).to.be.greaterThan(0);
        res.structLogs.map(function (sl) {
          expect(sl.storage).to.not.equal(null);
          expect(sl.memory).to.equal(null);
          expect(sl.stack).to.equal(null);
        });
      });
    });
  }

  describe('nested calls', async function () {
    let errorsExternal;

    before(async () => {
      const factoryErrorsExternal = await ethers.getContractFactory(Constants.Contract.ErrorsExternal);
      errorsExternal = await factoryErrorsExternal.deploy();
      await errorsExternal.waitForDeployment();
    });

    it('successful NESTED CALL to existing contract with disabledMemory, disabledStack, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing NESTED CALL to existing contract with disabledMemory, disabledStack, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(errorsExternal.target, '0xe3fdf09c'); // calling revertSimple()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful NESTED CALL to existing contract with disabledMemory, disabledStack, disabledStorage set to false', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('failing NESTED CALL to existing contract with disabledMemory, disabledStack, disabledStorage set to false', async function () {
      const tx = await opcodeLogger.call(errorsExternal.target, '0xe3fdf09c'); // calling revertSimple()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      expect(res.failed).to.be.false
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('successful NESTED CALL to existing contract with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: false,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing NESTED CALL to existing contract with disabledMemory set to false, disabledStack, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(errorsExternal.target, '0xe3fdf09c'); // calling revertSimple()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: false,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful NESTED CALL to existing contract with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('failing NESTED CALL to existing contract with disabledStack set to false, disabledMemory, disabledStorage set to true', async function () {
      const tx = await opcodeLogger.call(errorsExternal.target, '0xe3fdf09c'); // calling revertSimple()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('successful NESTED CALL to existing contract with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing NESTED CALL to existing contract with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
      const tx = await opcodeLogger.call(errorsExternal.target, '0xe3fdf09c'); // calling revertSimple()
      await tx.wait();
      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it.skip('NESTED Create CALL Deploy a contract which successfully deploys another contract - with opcodeLogger and  disableMemory, DisableStack and disableStorage set to true', async function () {
      const contractCreatorFactory = await ethers.getContractFactory(
        Constants.Contract.ContractCreator
      );
      const contractCreator = await contractCreatorFactory.deploy();
      await contractCreator.waitForDeployment();

      const contractByteCode = '0x608060405234801561001057600080fd5b5060405161001d9061005f565b604051809103906000f080158015610039573d6000803e3d6000fd5b50600080546001600160a01b0319166001600160a01b039290921691909117905561006c565b6101a68061058783390190565b61050c8061007b6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80637c833d3a1161005b5780637c833d3a146100de578063b45694dc146100f1578063c6efc9be14610104578063fdf3a4091461011757600080fd5b80634a8fbaa7146100825780635a7fc2fb146100a857806364f0ac05146100cb575b600080fd5b61009561009036600461032e565b61012a565b6040519081526020015b60405180910390f35b6100bb6100b6366004610350565b61017a565b604051901515815260200161009f565b6100bb6100d9366004610372565b610192565b6100956100ec366004610372565b61021f565b6100956100ff366004610372565b61025f565b610095610112366004610372565b61029c565b61009561012536600461032e565b6102db565b6000606483106101555760405162461bcd60e51b815260040161014c9061038b565b60405180910390fd5b60005b8381610163816103cf565b9250101561017357808303610158575b9392505050565b6000811561018a57506001919050565b506000919050565b6000805460405163a9bf563360e01b81526004810184905273ffffffffffffffffffffffffffffffffffffffff9091169063a9bf563390602401600060405180830381865afa92505050801561020a57506040513d6000823e601f3d908101601f19168201604052610207919081019061040c565b60015b61021657506000919050565b50600192915050565b6000606482106102415760405162461bcd60e51b815260040161014c9061038b565b6000805b8381101561025857905060018101610245565b5092915050565b6000606482106102815760405162461bcd60e51b815260040161014c9061038b565b60005b8261028e826103cf565b915081106102845792915050565b6000606482106102be5760405162461bcd60e51b815260040161014c9061038b565b60005b806102cb816103cf565b9150508281106102c15792915050565b6000606483106102fd5760405162461bcd60e51b815260040161014c9061038b565b6000805b848110156103265780841061031e578161031a816103cf565b9250505b600101610301565b509392505050565b6000806040838503121561034157600080fd5b50508035926020909101359150565b60006020828403121561036257600080fd5b8135801515811461017357600080fd5b60006020828403121561038457600080fd5b5035919050565b60208082526024908201527f43616e6e6f742068617665206d6f7265207468616e2031303020697465726174604082015263696f6e7360e01b606082015260800190565b6000600182016103ef57634e487b7160e01b600052601160045260246000fd5b5060010190565b634e487b7160e01b600052604160045260246000fd5b6000602080838503121561041f57600080fd5b825167ffffffffffffffff8082111561043757600080fd5b818501915085601f83011261044b57600080fd5b81518181111561045d5761045d6103f6565b604051601f8201601f19908116603f01168101908382118183101715610485576104856103f6565b81604052828152888684870101111561049d57600080fd5b600093505b828410156104bf57848401860151818501870152928501926104a2565b60008684830101528096505050505050509291505056fea26469706673582212207617a513fa5800c056cf704f435835c83521a8d0a4158550f89e441d9238b93364736f6c63430008170033608060405234801561001057600080fd5b50610186806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063a9bf563314610030575b600080fd5b61004361003e3660046100e8565b610059565b6040516100509190610101565b60405180910390f35b6060816000036100af5760405162461bcd60e51b815260206004820152600e60248201527f72657175697265206661696c6564000000000000000000000000000000000000604482015260640160405180910390fd5b505060408051808201909152601281527f6d792066756e63207761732063616c6c65640000000000000000000000000000602082015290565b6000602082840312156100fa57600080fd5b5035919050565b60006020808352835180602085015260005b8181101561012f57858101830151858201604001528201610113565b506000604082860101526040601f19601f830116850101925050509291505056fea2646970667358221220cbab406ae7ac849914cffae16782be71f8529b82b40a5e08b8df57424ad392ec64736f6c63430008170033';
      const contractCreateTx = await contractCreator.createNewContract(contractByteCode);
      const receipt = await contractCreateTx.wait();

      // extract newContractAddress from event logs
      const [newContractAddress] = receipt.logs.map(
        (e) => e.fragment.name === 'NewContractCreated' && e
      )[0].args;

      // assert newContractAddress is valid
      expect(ethers.isAddress(newContractAddress)).to.be.true;

      const res = await executeDebugTraceTransaction(contractCreateTx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      console.log(`CCreateHash: ${contractCreateTx.hash}`);

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it.skip('NESTED Create CALL Deploy a contract which successfully deploys another contract - with opcodeLogger and  disableMemory, DisableStack and disableStorage set to false', async function () {
      const factory = await ethers.getContractFactory(Constants.Contract.ControlStructures);
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      const { hash } = await contract.deploymentTransaction();

      const res = await executeDebugTraceTransaction(hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      console.log(`CCreateHash2: ${hash}`);

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });
  });

  describe('precompiles', async function () {
    let precompiles;
    let tokenCreateContract;
    let tokenCreateTx;
    let tokenCreateContractAddress;
    let tokenAddress;

    before(async () => {
      const factoryPrecompiles = await ethers.getContractFactory(Constants.Contract.Precompiles);
      precompiles = await factoryPrecompiles.deploy();
      await precompiles.waitForDeployment();

      const tokenCreateFactory = await ethers.getContractFactory(Constants.Contract.TokenCreateTest);
      tokenCreateContract = await tokenCreateFactory.deploy(Constants.GAS_LIMIT_1_000_000);
      await tokenCreateContract.waitForDeployment();
      tokenCreateTx = await tokenCreateContract.createFungibleTokenPublic(
        await tokenCreateContract.getAddress(),
        {
          value: BigInt('10000000000000000000'),
          gasLimit: 1_000_000,
        }
      );
      const tokenAddressReceipt = await tokenCreateTx.wait();
      tokenAddress = { tokenAddress } = tokenAddressReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.CreatedToken
        )[0].args.tokenAddress;
      tokenCreateContractAddress = await tokenCreateContract.getAddress();
    });

    it.only('should return INVALID_TOKEN_ID as debugTrace revert reason when minting a token with incorrect address', async function () {
      const tx = await opcodeLogger.executeHtsMintTokenRevertingCalls(
          tokenCreateContractAddress,
          tokenAddress,
          [-1],
          [],
          Constants.GAS_LIMIT_10_000_000
        );

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      const revertOperations = res.structLogs.filter(function (opLog) {
        return opLog.op === "REVERT"
      });

      expect(revertOperations.length).to.be.greaterThan(0, 'No "revert" operations were found in debugTrace transaction response');
      expect(revertOperations[0].reason).to.not.be.null
      expect(hexToASCII(revertOperations[0].reason)).to.contain("Minting reveted with INVALID_TOKEN_ID");
    });

    it.only('should return TOKEN_MAX_SUPPLY_REACHED as debugTrace revert reason when minting a token with max supply reached', async function () {
      const mintTokenAmounts = [3, 300,];
      const tx = await opcodeLogger.executeHtsMintTokenRevertingCalls(
          tokenCreateContractAddress,
          tokenAddress,
          mintTokenAmounts,
          [],
          Constants.GAS_LIMIT_10_000_000
        );

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      const revertOperations = res.structLogs.filter(function (opLog) {
        return opLog.op === "REVERT"
      });

      expect(revertOperations.length).to.be.greaterThan(0, 'No "revert" operations were found in debugTrace transaction response');

      for (let i = 0; i < mintTokenAmounts.length; i++) {
        expect(revertOperations[i].reason).to.not.be.null
        expect(hexToASCII(revertOperations[i].reason)).to.contain(`Minting ${mintTokenAmounts[i]} tokens reveted with TOKEN_MAX_SUPPLY_REACHED`);
      };
    });

    it.only('should return correct debugTrace revert reason for HTS calls with the same call depth', async function () {
      /* 
      * DO NOT use '0' as the function will not revert.
      * Using values less than '0' e.g. '-1' to cause the function to revert with message: 'INVALID_TOKEN_ID'
      * Values greater than '0' will cause the function to revert with message: 'Minting {value} tokens reveted with TOKEN_MAX_SUPPLY_REACHED'
      */
      const mintTokenAmounts = [1, 10, 100, -1];

      const tx = await opcodeLogger.executeHtsMintTokenRevertingCalls(
          tokenCreateContractAddress,
          tokenAddress,
          mintTokenAmounts,
          [],
          Constants.GAS_LIMIT_10_000_000
        );

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      // fs.writeFileSync(__dirname + '/debugTransaction.json', JSON.stringify(res, null, 2));

      const revertOperations = res.structLogs.filter(function (opLog) {
        return opLog.op === "REVERT"
      });

      expect(revertOperations.length).to.be.greaterThan(0);

      for (let i = 0; i < mintTokenAmounts.length; i++) {
        expect(revertOperations[i].reason).to.not.be.null

        let expectedMessage = mintTokenAmounts[i] < 0
          ? 'Minting reveted with INVALID_TOKEN_ID'
          : `Minting ${mintTokenAmounts[i]} tokens reveted with TOKEN_MAX_SUPPLY_REACHED`;

        expect(hexToASCII(revertOperations[i].reason)).to.contain(expectedMessage);
        expect(revertOperations[i].depth).to.equal(1);
      };
    });

    it.only('should return correct debugTrace revert reason for HTS calls with different call depth', async function () {
      const mintTokenAmounts = [5, 2, 7,];
      const tx = await opcodeLogger.nestEverySecondHtsMintTokenCall(
        tokenCreateContractAddress,
        tokenAddress,
        mintTokenAmounts,
        [],
        Constants.GAS_LIMIT_10_000_000
      );

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });

      const revertOperations = res.structLogs.filter(function (opLog) {
        return opLog.op === "REVERT"
      });

      expect(revertOperations.length).to.be.greaterThan(0);

      for (let i = 0; i < mintTokenAmounts.length; i++) {
        let expectedMessage = `Minting ${mintTokenAmounts[i]} tokens reveted with TOKEN_MAX_SUPPLY_REACHED`;
        expect(hexToASCII(revertOperations[i].reason)).to.contain(expectedMessage);
        expect(revertOperations[i].depth).to.equal(i % 2 === 0 ? 1 : 2);
      };
    });

    it.only('should not mix revert reasons between different HTS calls', async function () {
      const mintTokenAmounts = [2, 11, 17];
      const tx = await opcodeLogger.executeHtsMintTokenRevertingCallsAndFailToAssociate(
          tokenCreateContractAddress,
          tokenAddress,
          mintTokenAmounts,
          [],
          Constants.GAS_LIMIT_10_000_000
        );

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      fs.writeFileSync(__dirname + '/debugTransaction.json', JSON.stringify(res, null, 2));

      const revertOperations = res.structLogs.filter(function (opLog) {
        return opLog.op === "REVERT"
      });
      console.log(revertOperations);
      console.log(tx.hash);

      expect(revertOperations.length).to.be.greaterThan(0);

      for (let i = 0; i < mintTokenAmounts.length; i++) {
        expect(revertOperations[i].reason).to.not.be.null

        let expectedMessage = mintTokenAmounts[i] < 0
          ? 'Minting reveted with INVALID_TOKEN_ID'
          : `Minting ${mintTokenAmounts[i]} tokens reveted with TOKEN_MAX_SUPPLY_REACHED`;

        expect(hexToASCII(revertOperations[i].reason)).to.contain(expectedMessage);
        expect(revertOperations[i].depth).to.equal(1);
      };
      console.log("LASTOP: " + revertOperations[revertOperations.length - 1].reason);
      console.log("LASTOPDECODED: " + hexToASCII(revertOperations[revertOperations.length - 1].reason));
      expect(hexToASCII(revertOperations[revertOperations.length - 1].reason)).to.contain('Association reveted with TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT');
    });

    it('successful ETH precompile call to 0x2 with disabledMemory, disabledStack, disabledStorage set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2);
      await tx.wait();

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing ETH precompile call to 0x2 with disabledMemory, disabledStack, disabledStorage set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2, { gasLimit: 21_496 });
      await expect(tx.wait()).to.be.rejectedWith(Error);

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful ETH precompile call to 0x2 with disabledMemory, disabledStack, disabledStorage set to false', async function () {
      const tx = await precompiles.modExp(5644, 3, 2);
      await tx.wait();

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('failing ETH precompile call to 0x2 with disabledMemory, disabledStack, disabledStorage set to false', async function () {
      const tx = await precompiles.modExp(5644, 3, 2, { gasLimit: 21_496 });
      await expect(tx.wait()).to.be.rejectedWith(Error);

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('successful ETH precompile call to 0x2 with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2);
      await tx.wait();

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing ETH precompile call to 0x2 with disabledStorage set to false, disabledMemory, disabledStack set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2, { gasLimit: 21_496 });
      await expect(tx.wait()).to.be.rejectedWith(Error);

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful ETH precompile call to 0x2 with disabledMemory set to false, disabledStorage, disabledStack set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2);
      await tx.wait();

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: false,
        disableStack: true
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('failing ETH precompile call to 0x2 with disabledMemory set to false, disabledStorage, disabledStack set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2, { gasLimit: 21_496 });
      await expect(tx.wait()).to.be.rejectedWith(Error);

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: false,
        disableStack: true
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful ETH precompile call to 0x2 with disabledStack set to false, disabledStorage, disabledMemory set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2);
      await tx.wait();

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('failing ETH precompile call to 0x2 with disabledStack set to false, disabledStorage, disabledMemory set to true', async function () {
      const tx = await precompiles.modExp(5644, 3, 2, { gasLimit: 21_496 });
      await expect(tx.wait()).to.be.rejectedWith(Error);

      const res = await executeDebugTraceTransaction(tx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: false
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });

    it('successful tokenCreate call with disabledStorage, disabledMemory, disabledStack  set to true', async function () {
      const res = await executeDebugTraceTransaction(tokenCreateTx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      console.log(tokenCreateTx.hash);

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.equal(null);
        expect(sl.memory).to.equal(null);
        expect(sl.stack).to.equal(null);
      });
    });

    it('successful tokenCreate call with disabledStorage, disabledMemory, disabledStack  set to false', async function () {
      const res = await executeDebugTraceTransaction(tokenCreateTx.hash, {
        tracer: 'opcodeLogger',
        disableStorage: false,
        disableMemory: false,
        disableStack: false
      });

      expect(res.failed).to.be.false;
      expect(res.structLogs.length).to.be.greaterThan(0);
      res.structLogs.map(function (sl) {
        expect(sl.storage).to.not.equal(null);
        expect(sl.memory).to.not.equal(null);
        expect(sl.stack).to.not.equal(null);
      });
    });
  });

  describe('negative', async function () {
    it('should fail to debug a transaction with invalid hash', async function () {
      const res = await executeDebugTraceTransaction('0x0fdfb3da2d40cd9ac8776ca02c17cb4aae634d2726f5aad049ab4ce5056b1a5c', {
        tracer: 'opcodeLogger',
        disableStorage: true,
        disableMemory: true,
        disableStack: true
      });

      expect(res.failed).to.be.true;
      expect(res.structLogs).to.be.empty;
    });

    it('should fail with invalid parameter value type for disableMemory, disableStack or disableStorage', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      try {
        await executeDebugTraceTransaction(tx.hash, {
          tracer: 'opcodeLogger',
          disableStorage: 'true',
          disableMemory: 1,
          disableStack: 0
        });

      } catch (error) {
        expect(error.name).to.equal('ProviderError');
        expect(error._isProviderError).to.be.true;
        expect(error._stack).to.contain('Invalid parameter 2: Invalid tracerConfig');

        return;
      }

      assert.fail('Executing debug trace transaction with invalid parameter value types did not result in error')
    });

    it('should fail when executing debug trace transaction with incorrect tracer parameter', async function () {
      const tx = await opcodeLogger.call(opcodeLogger.target, '0xdbdf7fce'); // calling resetCounter()
      await tx.wait();
      const incorrectTracer = 'opcodeLogger1';

      try {
        await executeDebugTraceTransaction(tx.hash, {
          tracer: incorrectTracer,
          disableStorage: true,
          disableMemory: true,
          disableStack: true
        });
      } catch (error) {
        expect(error.name).to.equal('ProviderError');
        expect(error._isProviderError).to.be.true;
        expect(error._stack).to.contain(`Invalid parameter 1: Invalid tracer type, value: ${incorrectTracer}`);

        return;
      }

      assert.fail('Executing debug trace transaction with incorrect tracer parameter did not result in error')
    });

    // Todo: Ask Niki Atanasov
    // it('Run the transaction when the opcode logger is disabled with the flag and specify it to use the opcodeLogger', async function(){
    // });
  });
});
