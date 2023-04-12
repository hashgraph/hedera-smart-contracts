const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("ERC20ExtensionsMock tests", function () {
  let owner, addr1;
  let ERC20Burnable;
  let ERC20Capped;
  let ERC20Pausable;
  let ERC20Snapshot;
  const amount = 1000;
  const cap = 10000;
  const tokenName = "tokenName";
  const tokenSymbol = "TOKENSYMBOL";
  const burnAmount = 100;
  const transferAmount = 500;

  before(async function () {
    // Set up signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy ERC20BurnableMock contract
    const burnableFactory = await ethers.getContractFactory("ERC20BurnableMock");
    ERC20Burnable = await burnableFactory.deploy(tokenName, tokenSymbol);
    await ERC20Burnable.mint(owner.address, amount);

    // Deploy ERC20CappedMock contract
    const cappedFactory = await ethers.getContractFactory("ERC20CappedMock");
    ERC20Capped = await cappedFactory.deploy(tokenName, tokenSymbol, cap);
    await ERC20Capped.mint(owner.address, amount);

    // Deploy ERC20PausableMock contract
    const pausableFactory = await ethers.getContractFactory("ERC20PausableMock");
    ERC20Pausable = await pausableFactory.deploy(tokenName, tokenSymbol);
    await ERC20Pausable.mint(owner.address, amount);

    // Deploy ERC20Snapshot contract 
    const snapshotFactory = await ethers.getContractFactory("ERC20SnapshotMock");
    ERC20Snapshot = await snapshotFactory.deploy(tokenName, tokenSymbol);
    await ERC20Snapshot.mint(owner.address, amount);
  });

  describe("ERC20Burnable tests", function () {
    it("should be able to execute burn(amount)", async function () {
      const initialSupply = await ERC20Burnable.totalSupply();
      const initialBalance = await ERC20Burnable.balanceOf(owner.address);

      // Execute burn and get the transaction receipt
      const burnTx = await ERC20Burnable.burn(burnAmount);
      const burnReceipt = await burnTx.wait();

      // Get updated values
      const newSupply = await ERC20Burnable.totalSupply();
      const newBalance = await ERC20Burnable.balanceOf(owner.address);

      // Check if the Transfer event was emitted to AddressZero
      expect(burnReceipt.events[0].event).to.equal("Transfer");
      expect(burnReceipt.events[0].args.to).to.equal(ethers.constants.AddressZero);

      // Verify the new supply and new balance of the user
      expect(newSupply).to.equal(initialSupply.sub(burnAmount));
      expect(newBalance).to.equal(initialBalance.sub(burnAmount));
    });

    it("should be able to execute burnFrom(address, amount)", async function () {
      const initialBalance = await ERC20Burnable.balanceOf(owner.address);

      // Approve allowance and burn tokens from owner's address
      await ERC20Burnable.approve(addr1.address, burnAmount);
      const erc20Signer2 = await ERC20Burnable.connect(addr1);
      await erc20Signer2.burnFrom(owner.address, burnAmount);
      const newBalance = await ERC20Burnable.balanceOf(owner.address);

      //check updated balance
      expect(newBalance).to.equal(initialBalance.sub(burnAmount));
    });

    it("should fail to burn tokens if the user doesn't have enough balance", async function () {
      const balance = await ERC20Burnable.balanceOf(owner.address);

      //Expect burn to be reverted due to insufficient balance
      await expect(ERC20Burnable.burn(balance + 1)).to.be.reverted;
    });

    it("should revert when trying to burn tokens from another account more than accepted allowance", async function () {
      // Approve the allowance for addr1 to burn tokens on behalf of owner
      await ERC20Burnable.approve(addr1.address, burnAmount);
      const erc20Signer2 = ERC20Burnable.connect(addr1);

      await expect(await erc20Signer2.burnFrom(owner.address, burnAmount + 1)).to.be.reverted;
    });

    it("should revert when trying to burn tokens from another account without allowance", async function () {
      await expect(await ERC20Burnable.connect(addr1).burnFrom(owner.address, amount)).to.be.reverted;
    });
  });

  describe("ERC20Cap tests", function () {
    it("should be able to execute cap()", async function () {
      const contractCap = await ERC20Capped.cap();
      expect(contractCap).to.equal(cap);
    });

    it("should fail to mint when trying to mint tokens exceeding the cap", async function () {
      // Get the initial total supply and balance of the owner
      const initialSupply = await ERC20Capped.totalSupply();
      const initialBalance = await ERC20Capped.balanceOf(owner.address);

      // Expect the mint function to be reverted due to exceeding the cap
      await expect(ERC20Capped.mint(owner.address, cap + 1)).to.be.reverted;

      // Check that the total supply and owner's balance haven't changed
      expect(await ERC20Capped.totalSupply()).to.equal(initialSupply);
      expect(await ERC20Capped.balanceOf(owner.address)).to.equal(initialBalance);
    });
  });

  describe("ERC20Pause tests", function () {
    it("should pause and unpause the token", async function () {
      // Check if the token is not paused initially
      expect(await ERC20Pausable.paused()).to.be.false;

      // Pause the token and verify it is paused
      await ERC20Pausable.pause();
      expect(await ERC20Pausable.paused()).to.be.true;

      // Unpause the token and verify it is not paused anymore
      await ERC20Pausable.unpause();
      expect(await ERC20Pausable.paused()).to.be.false;
    });

    it("should not allow transfers when paused", async function () {
      await ERC20Pausable.pause();

      await expect(ERC20Pausable.transfer(addr1.address, amount)).to.be.reverted;
    });

    it("should revert when trying to pause the contract when it's already paused", async function () {
      await ERC20Pausable.pause();
      await expect(ERC20Pausable.pause()).to.be.reverted;
    });

    it("should revert when trying to mint tokens while paused", async function () {
      await ERC20Pausable.pause();
      await expect(ERC20Pausable.mint(addr1.address, amount)).to.be.reverted;
    });

    it("should revert when a non-owner tries to pause or unpause the contract", async function () {
      // Expect pause to be reverted when called by a non-owner
      await expect(ERC20Pausable.connect(addr1).pause()).to.be.reverted;

      // Pause the contract
      await ERC20Pausable.pause();

      // Expect unpause to be reverted when called by a non-owner
      await expect(ERC20Pausable.connect(addr1).unpause()).to.be.reverted;
    });
  });

  describe("ERC20Snapshot tests", function () {
    it("should create a new snapshot and emit a Snapshot event", async function () {
      // Create a new snapshot and wait for the transaction receipt
      const tx = await ERC20Snapshot.snapshot();
      const receipt = await tx.wait();

      // Verify that "Snapshot" event is emited 
      expect(receipt.events[0].event).to.equal("Snapshot");
    });

    it("should return the correct totalSupplyAt(snapshotId)", async function () {
      // Create a new snapshot and wait for the transaction receipt
      const snapshot = await ERC20Snapshot.snapshot();
      const tx = await snapshot.wait();

      // Get the snapshotID
      const snapshotId = tx.events[0].args[0];

      // Mint extra tokens, increase the total supply and get the current total supply
      await ERC20Snapshot.mint(owner.address, amount);
      const newTotalSupply = await ERC20Snapshot.totalSupply();

      //Verify that the total supply at the time of the snapshot is equal to the initial mint amount.
      expect(await ERC20Snapshot.totalSupplyAt(snapshotId)).to.equal(newTotalSupply - amount);
    });

    it("should return the correct balanceOfAt(address, snapshotId)", async function () {
      await ERC20Snapshot.transfer(addr1.address, transferAmount);

      // Create a new snapshot and wait for the transaction receipt
      const snapshot = await ERC20Snapshot.snapshot();
      const tx = await snapshot.wait();

      // Get the snapshotID
      const snapshotId = tx.events[0].args[0];

      // Transfer extra tokens to addr1 to verify that the snapshot is valid and get new ballance
      await ERC20Snapshot.transfer(addr1.address, transferAmount);
      const newBalance = await ERC20Snapshot.balanceOf(addr1.address)

      //Verify that the balance of addr1 at the time of the snapshot is equal to the initial transfer amount.
      expect(await ERC20Snapshot.balanceOfAt(addr1.address, snapshotId)).to.equal(newBalance - transferAmount);
    });
  });
});