const { expect } = require("chai");
const { hethers } = require("hardhat");

describe("SafeHTS library", function () {
  it("Create fungible token", async function () {
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

    const tokenAddressTx = await safeOperations.safeCreateFungibleToken({
      value: hethers.utils.parseHbar("0.00001")
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const [ tokenCreatedEvent ] = tokenAddressReceipt.events;
    const [ tokenAddress ] = tokenCreatedEvent.args;

    const tokenInfoTx = await safeOperations.safeGetTokenInfo(tokenAddress);
    const tokenInfoReceipt = await tokenInfoTx.wait();
    const [ tokenInfoEvent ] = tokenInfoReceipt.events;
    const { tokenInfo } = tokenInfoEvent.args;

    expect(tokenInfo.hedera.name).to.equal("tokenName");
    expect(tokenInfo.hedera.symbol).to.equal("tokenSymbol");
    expect(tokenInfo.totalSupply).to.equal(200);
  });
});
