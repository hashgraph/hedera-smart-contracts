const Constants = require('../../constants');
const {expect} = require('chai');
const hre = require('hardhat');
const fs = require('fs');
const {ethers} = hre;

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

      const erc20Factory = await ethers.getContractFactory(Constants.Path.HIP583_ERC20Mock);
      erc20 = await erc20Factory.deploy();
      await erc20.waitForDeployment();
      await (await erc20.mint(signers[0].address, 10_000_000_000)).wait();

      const erc721Factory = await ethers.getContractFactory(Constants.Path.HIP583_ERC721Mock);
      erc721 = await erc721Factory.deploy();
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
      const res = await (await opcodeLogger.updateOwner({gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('updateOwner', res.hash);
      compareOutputs('updateOwner', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute resetCounter()', async function () {
      const res = await (await opcodeLogger.resetCounter({gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('resetCounter', res.hash);
      compareOutputs('resetCounter', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute call()', async function () {
      const res = await (await opcodeLogger.call(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('call', res.hash);
      compareOutputs('call', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute staticCall()', async function () {
      const res = await (await opcodeLogger.staticCall(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('staticCall', res.hash);
      compareOutputs('staticCall', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute callCode()', async function () {
      const res = await (await opcodeLogger.callCode(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('callCode', res.hash);
      compareOutputs('callCode', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute delegateCall()', async function () {
      const res = await (await opcodeLogger.delegateCall(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('delegateCall', res.hash);
      compareOutputs('delegateCall', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.approve()', async function () {
      const res = await (await erc20.approve(randomAddress, 5644, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc20.approve', res.hash);
      compareOutputs('erc20.approve', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.transfer()', async function () {
      const res = await (await erc20.transfer(randomAddress, 5644, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc20.transfer', res.hash);
      compareOutputs('erc20.transfer', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc20.transferFrom()', async function () {
      await (await erc20.approve(signers[1].address, 5644, {gasLimit: 1_000_000})).wait();
      const erc20SecondSigner = erc20.connect(signers[1]);

      const res = await (await erc20SecondSigner.transferFrom(signers[0].address, randomAddress, 56, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc20.transferFrom', res.hash);
      compareOutputs('erc20.transferFrom', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.approve()', async function () {
      const res = await (await erc721.approve(randomAddress, NFT_ID, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc721.approve', res.hash);
      compareOutputs('erc721.approve', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.setApprovalForAll()', async function () {
      const res = await (await erc721.setApprovalForAll(randomAddress, true, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc721.setApprovalForAll', res.hash);
      compareOutputs('erc721.setApprovalForAll', await executeDebugTraceTransaction(res.hash));
    });

    it('should be able to execute erc721.transferFrom()', async function () {
      await (await erc721.approve(signers[1].address, NFT_ID, {gasLimit: 1_000_000})).wait();
      const erc721SecondSigner = erc721.connect(signers[1]);

      const res = await (await erc721SecondSigner.transferFrom(signers[0].address, signers[1].address, NFT_ID, {gasLimit: 1_000_000})).wait();
      await updateBesuResponsesIfNeeded('erc721.transferFrom', res.hash);
      compareOutputs('erc721.transferFrom', await executeDebugTraceTransaction(res.hash));
    });
  });

  const txTypeSpecificSuitesConfig = {
    'type 0 tx suite': {gasLimit: 5_000_000, gasPrice: 710_000_000_000},
    'type 1 tx suite': {gasLimit: 5_000_000, gasPrice: 710_000_000_000, accessList: []},
    'type 2 tx suite': {gasLimit: 5_000_000},
  };
  for (let suiteName in txTypeSpecificSuitesConfig) {
    const txTypeSpecificOverrides = txTypeSpecificSuitesConfig[suiteName];
    describe(suiteName, async function () {
      it('successful CREATE transaction with disabledMemory, disabledStack, disabledStorage set to false', async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.Base);
        const contract = await factory.deploy(txTypeSpecificOverrides);
        await contract.waitForDeployment();

        const {hash} = await contract.deploymentTransaction();
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
        const contract = await factory.deploy({...txTypeSpecificOverrides, gasLimit: 25484});
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const {hash} = await contract.deploymentTransaction();
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

        const {hash} = await contract.deploymentTransaction();
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
        const contract = await factory.deploy({...txTypeSpecificOverrides, gasLimit: 25484});
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const {hash} = await contract.deploymentTransaction();
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

        const {hash} = await contract.deploymentTransaction();
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
        const contract = await factory.deploy({...txTypeSpecificOverrides, gasLimit: 25484});
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const {hash} = await contract.deploymentTransaction();
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

        const {hash} = await contract.deploymentTransaction();
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
        const contract = await factory.deploy({...txTypeSpecificOverrides, gasLimit: 25484});
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const {hash} = await contract.deploymentTransaction();
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

        const {hash} = await contract.deploymentTransaction();
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
        const contract = await factory.deploy({...txTypeSpecificOverrides, gasLimit: 25484});
        await expect(contract.waitForDeployment()).to.be.rejectedWith(Error);

        const {hash} = await contract.deploymentTransaction();
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
        const tx = await opcodeLogger.resetCounter({...txTypeSpecificOverrides, gasLimit: 21_064});
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
        const tx = await opcodeLogger.resetCounter({...txTypeSpecificOverrides, gasLimit: 21_064});
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
        const tx = await opcodeLogger.resetCounter({...txTypeSpecificOverrides, gasLimit: 21_064});
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
        const tx = await opcodeLogger.resetCounter({...txTypeSpecificOverrides, gasLimit: 21_064});
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
        const tx = await opcodeLogger.resetCounter({...txTypeSpecificOverrides, gasLimit: 21_064});
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
  });

  describe('precompiles', async function () {
    let precompiles;

    before(async () => {
      const factoryPrecompiles = await ethers.getContractFactory(Constants.Contract.Precompiles);
      precompiles = await factoryPrecompiles.deploy();
      await precompiles.waitForDeployment();
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
      const tx = await precompiles.modExp(5644, 3, 2, {gasLimit: 21_496});
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
      const tx = await precompiles.modExp(5644, 3, 2, {gasLimit: 21_496});
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
  });
});
