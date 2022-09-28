const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("SafeHTS library tests", function () {
  let safeOperationsContract;
  let fungibleTokenAddress;

  before(async function () {
    safeOperationsContract = await deploySafeOperationsContract();
    fungibleTokenAddress = await createFungibleToken();
  });

  async function deploySafeOperationsContract() {
    const safeHTSFactory = await ethers.getContractFactory("SafeHTS");
    const safeHTS = await safeHTSFactory.deploy({gasLimit: 1_000_000});
    const safeHTSReceipt = await safeHTS.deployTransaction.wait();

    const safeOperationsFactory = await ethers.getContractFactory("SafeOperations", {
      libraries: {
        SafeHTS: safeHTSReceipt.contractAddress,
      }
    });

    const safeOperations = await safeOperationsFactory.deploy({gasLimit: 1_000_000});
    const safeOperationsReceipt = await safeOperations.deployTransaction.wait();

    return await ethers.getContractAt('SafeOperations', safeOperationsReceipt.contractAddress);
  }

  async function createFungibleToken() {
    const tokenAddressTx = await safeOperationsContract.safeCreateFungibleToken({
      value: ethers.BigNumber.from('20000000000000000000'),
      gasLimit: 1_000_000
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'tokenCreatedEvent')[0].args;

    return tokenAddress;
  }

  it("should be able to get token info", async function () {
    const tokenInfoTx = await safeOperationsContract.safeGetTokenInfo(fungibleTokenAddress);
    const tokenInfoReceipt = await tokenInfoTx.wait();
    const {tokenInfo} = tokenInfoReceipt.events.filter(e => e.event === 'tokenInfoEvent')[0].args;

    expect(tokenInfo.hedera.name).to.equal("tokenName");
    expect(tokenInfo.hedera.symbol).to.equal("tokenSymbol");
    expect(tokenInfo.totalSupply).to.equal(200);
  });

  it("should be able to get fungible token info", async function () {
    const fungibleTokenInfoTx = await safeOperationsContract.safeGetFungibleTokenInfo(fungibleTokenAddress);
    const fungibleTokenInfoReceipt = await fungibleTokenInfoTx.wait();
    const {fungibleTokenInfo} = fungibleTokenInfoReceipt.events.filter(e => e.event === 'fungibleTokenInfoEvent')[0].args;

    expect(fungibleTokenInfo.tokenInfo.hedera.name).to.equal("tokenName");
    expect(fungibleTokenInfo.tokenInfo.hedera.symbol).to.equal("tokenSymbol");
    expect(fungibleTokenInfo.tokenInfo.totalSupply).to.equal(200);
    expect(fungibleTokenInfo.decimals).to.equal(8);
  });
});
