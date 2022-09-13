const { expect } = require("chai");
const { hethers } = require("hardhat");

describe("SafeHTS library tests", function () {
  let safeOperationsContract;
  let fungibleTokenAddress;

  before(async function () {
    safeOperationsContract = await deploySafeOperationsContract();
    fungibleTokenAddress = await createFungibleToken();
  });

  async function deploySafeOperationsContract() {
    const safeHTSFactory = await hethers.getContractFactory("SafeHTS");
    const safeHTS = await safeHTSFactory.deploy();
    await safeHTS.deployed();

    const safeOperationsFactory = await hethers.getContractFactory("SafeOperations", {
      libraries: {
        SafeHTS: safeHTS.address,
      },
    });

    const safeOperations = await safeOperationsFactory.deploy();
    await safeOperations.deployed();

    return safeOperations;
  }

  async function createFungibleToken() {
    const tokenAddressTx = await safeOperationsContract.safeCreateFungibleToken({
      value: hethers.utils.parseHbar("0.00001")
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const [ tokenCreatedEvent ] = tokenAddressReceipt.events;
    const [ tokenAddress ] = tokenCreatedEvent.args;

    return tokenAddress;
  }

  it("should be able to get token info", async function () {
    const tokenInfoTx = await safeOperationsContract.safeGetTokenInfo(fungibleTokenAddress);
    const tokenInfoReceipt = await tokenInfoTx.wait();
    const [ tokenInfoEvent ] = tokenInfoReceipt.events;
    const { tokenInfo } = tokenInfoEvent.args;

    expect(tokenInfo.hedera.name).to.equal("tokenName");
    expect(tokenInfo.hedera.symbol).to.equal("tokenSymbol");
    expect(tokenInfo.totalSupply).to.equal(200);
  });

  it("should be able to get fungible token info", async function () {
    const fungibleTokenInfoTx = await safeOperationsContract.safeGetFungibleTokenInfo(fungibleTokenAddress);
    const fungibleTokenInfoReceipt = await fungibleTokenInfoTx.wait();
    const [ fungibleTokenInfoEvent ] = fungibleTokenInfoReceipt.events;
    const { fungibleTokenInfo } = fungibleTokenInfoEvent.args;

    expect(fungibleTokenInfo.tokenInfo.hedera.name).to.equal("tokenName");
    expect(fungibleTokenInfo.tokenInfo.hedera.symbol).to.equal("tokenSymbol");
    expect(fungibleTokenInfo.tokenInfo.totalSupply).to.equal(200);
    expect(fungibleTokenInfo.decimals).to.equal(8);
  });
});
