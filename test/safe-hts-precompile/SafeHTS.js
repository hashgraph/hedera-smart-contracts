const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("SafeHTS library tests", function () {
  let safeOperationsContract;
  let fungibleTokenAddress;
  let nonFungibleTokenAddress;

  before(async function () {
    safeOperationsContract = await deploySafeOperationsContract();
    fungibleTokenAddress = await createFungibleToken();
    nonFungibleTokenAddress = await createNonFungibleToken();
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
    const tokenAddress = tokenAddressReceipt.events.filter(e => e.event === 'TokenCreated')[0].args[0];
    return tokenAddress;
  }

  async function createNonFungibleToken() {
    const tokenAddressTx = await safeOperationsContract.safeCreateNonFungibleToken({
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
    const tokenInfo = tokenInfoReceipt.events.filter(e => e.event === 'TokenInfoEvent')[0].args[0];

    expect(tokenInfo.token.name).to.equal("tokenName");
    expect(tokenInfo.token.symbol).to.equal("tokenSymbol");
    expect(tokenInfo.totalSupply).to.equal(200);
  });

  it("should be able to get fungible token info", async function () {
    const fungibleTokenInfoTx = await safeOperationsContract.safeGetFungibleTokenInfo(fungibleTokenAddress);
    const fungibleTokenInfoReceipt = await fungibleTokenInfoTx.wait();
    const fungibleTokenInfo = fungibleTokenInfoReceipt.events.filter(e => e.event === 'FungibleTokenInfoEvent')[0].args[0];

    expect(fungibleTokenInfo.tokenInfo.token.name).to.equal("tokenName");
    expect(fungibleTokenInfo.tokenInfo.token.symbol).to.equal("tokenSymbol");
    expect(fungibleTokenInfo.tokenInfo.totalSupply).to.equal(200);
    expect(fungibleTokenInfo.decimals).to.equal(8);
  });

  xit("should be able to transfer tokens and hbars atomically", async function () {
    const senderAccountID = '0x67D8d32E9Bf1a9968a5ff53B87d777Aa8EBBEe69';
    const receiverAccountID = '0x05FbA803Be258049A27B820088bab1cAD2058871';

    const {newTotalSupply, serialNumbers} = await safeOperationsContract.safeMintToken(nonFungibleTokenAddress, 0, ['0x01'], { gasLimit: 1_000_000 });
    const NftSerialNumber = serialNumbers[0];

    await safeOperationsContract.safeAssociateToken(senderAccountID, fungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(senderAccountID, nonFungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(receiverAccountID, fungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(receiverAccountID, nonFungibleTokenAddress);

    const accountAmountSender = {
      accountID: `senderAccountID`,
      amount: -10,
      isApproval: false };
    const accountAmountReceiver = {
      accountID: `receiverAccountID`,
      amount: 10,
      isApproval: false };
    const transferList = [accountAmountSender, accountAmountReceiver];

    const tokenTransferList = [{
      token: `${NftHTSTokenContractAddress}`,
      transfers: [],
      nftTransfers: [{
        senderAccountID: `senderAccountID`,
        receiverAccountID: `receiverAccountID`,
        serialNumber: NftSerialNumber.toNumber(),
      }],
    },
    {
      token: `${HTSTokenContractAddress}`,
      transfers: [
        {
          accountID: `receiverAccountID`,
          amount: 10,
        },
        {
          accountID: `senderAccountID`,
          amount: -10,
        },
      ],
      nftTransfers: [],
    }];

    const cryptoTransferTx = await safeOperationsContract.safeCryptoTransfer(transferList, tokenTransferList);
    const cryptoTransferReceipt = await cryptoTransferTx.wait()
    expect(cryptoTransferReceipt.events.filter(e => e.event === 'success')[0].args).to.be.true;
  });
});
