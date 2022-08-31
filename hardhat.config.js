require("@hashgraph/hardhat-hethers");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "localHederaNetwork",
  hedera: {
    gasLimit: 300000,
    networks: {
      localHederaNetwork: {
        consensusNodes: [
          {
            url: '127.0.0.1:50211',
            nodeId: '0.0.3'
          }
        ],
        mirrorNodeUrl: 'http://127.0.0.1:5551',
        chainId: 0,
        accounts: [
          {
            "account": '0.0.1002',
            "privateKey": '0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6'
          }
        ]
      }
    }
  }
};
