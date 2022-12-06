const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("EcosystemWeek HTS tests", function () {
  let ecosystemWeekHTSContract;
  let signers;
  const TOTAL_SUPPLY = 1000;
  const SYMBOL = 'ESWT';
  const createTokenCost = "20000000000000000000";
  let contractAddress;

  before(async function () {
    signers = await ethers.getSigners();

    // Get factory
    const ecosystemWeekFactory = await ethers.getContractFactory(
      "EcosystemWeekHTS"
    );

    // Factory deploy
    const ecosystemWeekERC20 = await ecosystemWeekFactory.deploy(TOTAL_SUPPLY, SYMBOL, {
        value: ethers.BigNumber.from(createTokenCost),
        gasLimit: 1_000_000,
    });

    // Get deploy receipt
    const tokenCreateReceipt = await ecosystemWeekERC20.deployTransaction.wait();

    console.log(`*** Deployed EcosystemWeekHTS at https://hashscan.io/testnet/account/${tokenCreateReceipt.contractAddress}`);
    ecosystemWeekHTSContract = await ethers.getContractAt(
      "EcosystemWeekHTS",
      tokenCreateReceipt.contractAddress
    );
    contractAddress = tokenCreateReceipt.contractAddress;
  });

  it("should be able to retrieve token address", async function () {
    const address = await ecosystemWeekHTSContract.htsAddress();
    expect(address).to.exist;
    console.log(`*** HTS Token at address successful retrieved: https://hashscan.io/testnet/token/${address}`);
  });

  it("should be able to confirm balances using ERC20 interface", async function () {
    const treasuryBalance = await ecosystemWeekHTSContract.balanceOf(contractAddress);
    expect(treasuryBalance.toNumber()).to.eq(TOTAL_SUPPLY);

    const wallet1BalanceBefore = await ecosystemWeekHTSContract.balanceOf(signers[0].address);
    const wallet2BalanceBefore = await ecosystemWeekHTSContract.balanceOf(signers[1].address);

    expect(wallet1BalanceBefore.toNumber()).to.eq(0);
    expect(wallet2BalanceBefore.toNumber()).to.eq(0);
  });

  it("should be able to get token symbol using ERC20 interface", async function () {
    const name = await ecosystemWeekHTSContract.symbol();
    expect(name).to.equal(SYMBOL);
  });

  it("should be able to attend and confirm receipt of token", async function () {
    const tx = await ecosystemWeekHTSContract.connect(signers[0]).iAttended({gasLimit: 1_000_000});
    const txInfo = await tx.wait();
    console.log(`*** Successful iAttended tx details: https://hashscan.io/testnet/tx/${txInfo.transactionHash}`);

    const treasuryBalance = await ecosystemWeekHTSContract.balanceOf(contractAddress);
    const wallet1BalanceAfter = await ecosystemWeekHTSContract.balanceOf(signers[0].address);
    const wallet2BalanceAfter = await ecosystemWeekHTSContract.balanceOf(signers[1].address);

    expect(treasuryBalance.toNumber()).to.eq(TOTAL_SUPPLY - 1);
    expect(wallet1BalanceAfter.toNumber()).to.eq(1);
    expect(wallet2BalanceAfter.toNumber()).to.eq(0);
  });

  it("should not be able to receive a second token", async function () {
    try {
        const tx = await ecosystemWeekHTSContract.connect(signers[0]).iAttended({gasLimit: 1_000_000});
        await tx.wait();
        expect(true).to.eq(false, 'Expected failure on test');
    }
    catch(e) {
        expect(e).to.exist;
        console.log(`*** Failed iAttended tx details: https://hashscan.io/testnet/tx/${e.transactionHash}`);
        expect(e.reason).to.eq('transaction failed');
    }
  });
});