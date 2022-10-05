require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      },
    },
  },
  defaultNetwork: 'relay',
  networks: {
    relay: {
      url: 'http://localhost:7546',
      accounts: [
        "0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7"
      ],
      chainId: 298,
    }
  }
};
