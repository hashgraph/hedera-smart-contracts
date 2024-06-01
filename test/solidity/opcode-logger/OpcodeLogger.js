const {expect} = require('chai');
const {ethers} = require('hardhat');
const fs = require('fs');

// compiled with solidity 0.8.23
const opcodeLoggerBytecode = '0x608060405234801561001057600080fd5b50600080546001600160a01b031916339081178255815260016020526040812080549161003c83610046565b919050555061006d565b60006001820161006657634e487b7160e01b600052601160045260246000fd5b5060010190565b6104678061007c6000396000f3fe60806040526004361061007b5760003560e01c80638da5cb5b1161004e5780638da5cb5b1461013a578063bc5920ba14610172578063d74c1f0414610187578063dbdf7fce1461019a57600080fd5b80631b8b921d1461008057806356e7b7aa146100af5780636a221657146100df5780636d8deaf9146100ff575b600080fd5b61009361008e366004610322565b6101be565b6040805192151583526020830191909152015b60405180910390f35b3480156100bb57600080fd5b506100cf6100ca366004610322565b610206565b60405190151581526020016100a6565b3480156100eb57600080fd5b506100936100fa366004610322565b610240565b34801561010b57600080fd5b5061012c61011a3660046103e6565b60016020526000908152604090205481565b6040519081526020016100a6565b34801561014657600080fd5b5060005461015a906001600160a01b031681565b6040516001600160a01b0390911681526020016100a6565b34801561017e57600080fd5b5061015a610277565b6100cf610195366004610322565b6102c6565b3480156101a657600080fd5b506101bc33600090815260016020526040812055565b005b600080600080604051602081875160208901348b5af1905133600090815260016020526040812080549395509193506101f68361040a565b9091555091969095509350505050565b600080600080845160208601875af43360009081526001602052604081208054929350906102338361040a565b9091555090949350505050565b6000806000806040516020818751602089018a5afa905133600090815260016020526040812080549395509193506101f68361040a565b6000805473ffffffffffffffffffffffffffffffffffffffff19163390811782558152600160205260408120805490826102b08361040a565b90915550506000546001600160a01b0316919050565b60008060008084516020860134885af23360009081526001602052604081208054929350906102338361040a565b6001600160a01b038116811461030957600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561033557600080fd5b8235610340816102f4565b9150602083013567ffffffffffffffff8082111561035d57600080fd5b818501915085601f83011261037157600080fd5b8135818111156103835761038361030c565b604051601f8201601f19908116603f011681019083821181831017156103ab576103ab61030c565b816040528281528860208487010111156103c457600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b6000602082840312156103f857600080fd5b8135610403816102f4565b9392505050565b60006001820161042a57634e487b7160e01b600052601160045260246000fd5b506001019056fea2646970667358221220cda883c044377b7298a02681377a1f1333c279ff50dbf0cda00457af21f6b1af64736f6c63430008170033';
const opcodeLoggerAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_calldata",
        "type": "bytes"
      }
    ],
    "name": "call",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_calldata",
        "type": "bytes"
      }
    ],
    "name": "callCode",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "callsCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_calldata",
        "type": "bytes"
      }
    ],
    "name": "delegateCall",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resetCounter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_calldata",
        "type": "bytes"
      }
    ],
    "name": "staticCall",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updateOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

describe.only('Opcode Logger', async function () {
  let signers;
  let randomAddress;
  let opcodesBesuJson;
  let opcodeLogger;

  before(async () => {
    signers = await ethers.getSigners();
    randomAddress = (ethers.Wallet.createRandom()).address;
    opcodesBesuJson = JSON.parse(fs.readFileSync(__dirname + '/opcodeLoggerBesuResults.json'));

    const factory = new ethers.ContractFactory(opcodeLoggerAbi, opcodeLoggerBytecode, signers[0]);
    opcodeLogger = await factory.deploy();
    await opcodeLogger.waitForDeployment();
  });

  async function executeDebugTraceTransaction(txHash, options = {tracer: 'opcodeLogger'}) {
    return await signers[0].provider.send(
        'debug_traceTransaction', [txHash, options]
    );
  }

  function compareOutputs(methodName, hederaResp) {
    const besuResp = opcodesBesuJson[methodName];

    expect(besuResp.failed).to.equal(hederaResp.failed);
    expect(besuResp.structLogs.length).to.equal(hederaResp.structLogs.length);
    expect(besuResp.structLogs.map(e => e.op)).to.deep.equal(hederaResp.structLogs.map(e => e.op));
  }

  it('should be able to execute updateOwner()', async function () {
    const res = await (await opcodeLogger.updateOwner({gasLimit: 1_000_000})).wait();
    compareOutputs('updateOwner', await executeDebugTraceTransaction(res.hash));
  });


  it('should be able to execute resetCounter()', async function () {
    const res = await (await opcodeLogger.resetCounter({gasLimit: 1_000_000})).wait();
    compareOutputs('resetCounter', await executeDebugTraceTransaction(res.hash));
  });

  it('should be able to execute call()', async function () {
    const res = await (await opcodeLogger.call(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
    compareOutputs('call', await executeDebugTraceTransaction(res.hash));
  });

  it('should be able to execute staticCall()', async function () {
    const res = await (await opcodeLogger.staticCall(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
    compareOutputs('staticCall', await executeDebugTraceTransaction(res.hash));
  });

  it('should be able to execute callCode()', async function () {
    const res = await (await opcodeLogger.callCode(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
    compareOutputs('callCode', await executeDebugTraceTransaction(res.hash));
  });

  it('should be able to execute delegateCall()', async function () {
    const res = await (await opcodeLogger.delegateCall(randomAddress, '0x056440', {gasLimit: 1_000_000})).wait();
    compareOutputs('delegateCall', await executeDebugTraceTransaction(res.hash));
  });
});
