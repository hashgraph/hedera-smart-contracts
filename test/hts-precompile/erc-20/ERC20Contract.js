const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("ERC20Contract tests", function () {
  let tokenCreateContract;
  let tokenAddress;
  let erc20Contract;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc20Contract = await deployERC20Contract();
    tokenAddress = await createFungibleToken();
  });

  async function deployERC20Contract() {
    const erc20ContractFactory = await ethers.getContractFactory("ERC20Contract");
    const erc20Contract = await erc20ContractFactory.deploy({gasLimit: 1_000_000});
    const erc20ContractReceipt = await erc20Contract.deployTransaction.wait();

    return await ethers.getContractAt('ERC20Contract', erc20ContractReceipt.contractAddress);
  }

  async function createFungibleToken() {
    const tokenAddressTx = await tokenCreateContract.createFungibleTokenPublic(tokenCreateContract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args;

    return tokenAddress;
  }

  it("should be able to get token name", async function () {
    const name = await erc20Contract.name(tokenAddress);
    expect(name).to.equal('tokenName');
  });

  it("should be able to get token symbol", async function () {
    const symbol = await erc20Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it("should be able to get token decimals", async function () {
    const decimals = await erc20Contract.decimals(tokenAddress);
    expect(decimals).to.equal(8);
  });

  it("should be able to get token totalSupply", async function () {
    const totalSupply = await erc20Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(1000);
  });
});
