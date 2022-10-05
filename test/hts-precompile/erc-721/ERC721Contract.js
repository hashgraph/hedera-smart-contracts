const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("ERC721Contract tests", function () {
  let tokenCreateContract;
  let tokenAddress;
  let erc721Contract;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc721Contract = await deployERC721Contract();
    tokenAddress = await createNonFungibleToken();
  });

  async function deployERC721Contract() {
    const erc721ContractFactory = await ethers.getContractFactory("ERC721Contract");
    const erc721Contract = await erc721ContractFactory.deploy({gasLimit: 1_000_000});
    const erc721ContractReceipt = await erc721Contract.deployTransaction.wait();

    return await ethers.getContractAt('ERC721Contract', erc721ContractReceipt.contractAddress);
  }

  async function createNonFungibleToken() {
    const tokenAddressTx = await tokenCreateContract.createNonFungibleTokenPublic(tokenCreateContract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args;

    return tokenAddress;
  }

  it("should be able to get token name", async function () {
    const name = await erc721Contract.name(tokenAddress);
    expect(name).to.equal('tokenName');
  });

  it("should be able to get token symbol", async function () {
    const symbol = await erc721Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it("should be able to get token totalSupply", async function () {
    const totalSupply = await erc721Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(0);
  });
});
