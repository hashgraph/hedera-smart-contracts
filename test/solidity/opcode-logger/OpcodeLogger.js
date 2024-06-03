const Constants = require('../../constants');
const {expect} = require('chai');
const hre = require('hardhat');
const fs = require('fs');
const {ethers} = hre;

const BESU_RESULTS_JSON_PATH = __dirname + '/opcodeLoggerBesuResults.json';
const IS_BESU_NETWORK = hre.network.name === 'besu_local';

describe('Opcode Logger', async function () {
  let signers;
  let randomAddress;
  let opcodeLogger;
  let besuResults;
  let updatedBesuResults = {};

  before(async () => {
    signers = await ethers.getSigners();
    randomAddress = (ethers.Wallet.createRandom()).address;
    besuResults = JSON.parse(fs.readFileSync(BESU_RESULTS_JSON_PATH));

    const factory = await ethers.getContractFactory(Constants.Contract.OpcodeLogger);
    opcodeLogger = await factory.deploy();
    await opcodeLogger.waitForDeployment();
  });

  after(async () => {
    if (IS_BESU_NETWORK) {
      fs.writeFileSync(BESU_RESULTS_JSON_PATH, JSON.stringify(updatedBesuResults, null, 2));
    }
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
});
