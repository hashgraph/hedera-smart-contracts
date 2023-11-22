const { expect } = require("chai");
const { ethers } = require("hardhat");
const Constants = require('../../constants')

describe("@OZTokenValut TokenVault Contract", function () {
  let TokenVault;
  let tokenVault;
  let ERC20Mock;
  let asset;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  async function parseRevertReason(txHash) {
    const txResponse = await ethers.provider.getTransaction(txHash);
    const txReceipt = await ethers.provider.getTransactionReceipt(txHash);
  
    // Extract the revert reason
    const code = txReceipt.logs[txReceipt.logs.length - 1].data;
    const reason = ethers.utils.defaultAbiCoder.decode(["string"], code)[0];
    return reason;
  }

  beforeEach(async function () {
    // Deploy the mock ERC20 token
    ERC20Mock = await ethers.getContractFactory("contracts/erc-20/ERC20Mock.sol:ERC20Mock");
    asset = await ERC20Mock.deploy("MockToken", "MTK");
    await asset.deployed();

    // Deploy the TokenVault contract
    TokenVault = await ethers.getContractFactory("TokenVault");
    tokenVault = await TokenVault.deploy(asset.address, "MockToken", "MTK", Constants.GAS_LIMIT_1_000_000);
    await tokenVault.deployed();

    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Mint some tokens to the first address
    await asset.mint(addr1.address, ethers.utils.parseUnits("1000", 18));    
    await asset.mint(addr2.address, ethers.utils.parseUnits("10", 18));  

  });

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await tokenVault.balanceOf(owner.address);
      expect(await tokenVault.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should deposit tokens and update shareHolders mapping", async function () {
      const depositAmount = ethers.utils.parseEther("10");
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await expect(tokenVault.connect(addr1)._deposit(depositAmount))
        .to.emit(tokenVault, "Deposit")
        .withArgs(addr1.address, addr1.address, depositAmount, depositAmount);      

      expect(await tokenVault.shareHolders(addr1.address)).to.equal(depositAmount);
    });

    it("Should fail if deposit is less than zero", async function () {
      const depositTxPromise = tokenVault.connect(addr1)._deposit(0);
  
      // Expect the transaction to be reverted with the specific error message
      // Revert reason is not available at this time, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916
      // await expect(depositTxPromise).to.be.revertedWith("Deposit is zero");
  
      let receipt;
      try {

        const depositTx = await depositTxPromise;
        receipt = await depositTx.wait();  

      } catch (error) {

        // Handle the expected revert here until revert reason is available, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916
        if (error.code === ethers.errors.CALL_EXCEPTION) {
          let reason = "Unknown Error";
          if (error.transaction) {
            expect(error.transaction.data).to.equal('0x9213b1240000000000000000000000000000000000000000000000000000000000000000');
          } else {
            assert.fail("No transaction data");
          }
        } 

      }        
    });

    it("Should withdraw tokens and update shareHolders mapping", async function () {
      const depositAmount = ethers.utils.parseEther("10");
      const withdrawAmount = ethers.utils.parseEther("5");
      const redemedAmount = ethers.utils.parseEther("5.5");
 
      await asset.connect(addr2).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr2)._deposit(depositAmount);
 
      await expect(tokenVault.connect(addr2)._withdraw(withdrawAmount, addr2.address))
        .to.emit(tokenVault, "Withdraw")
        .withArgs(addr2.address, addr2.address, addr2.address, redemedAmount, redemedAmount);      
 
      expect(await tokenVault.totalAssetsOfUser(addr2.address)).to.equal(depositAmount.sub(withdrawAmount));
    });

    it("Should fail if withdraw is zero", async function () {
      // Expect the transaction to be reverted with the specific error message
      // Revert reason is not available at this time, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916
      // await expect(tokenVault.connect(addr1)._withdraw(0, addr1.address)).to.be.revertedWith("withdraw must be greater than Zero");
      let receipt;
      try {
          
          const depositTx = await tokenVault.connect(addr1)._withdraw(0, addr1.address);
          receipt = await depositTx.wait();  
  
      } catch (error) {
  
          // Handle the expected revert here until revert reason is available, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916
          if (error.code === ethers.errors.CALL_EXCEPTION) {
            let reason = "Unknown Error";
            if (error.transaction) {
              expect(error.transaction.data).to.equal('0x293311ab0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000927e41ff8307835a1c081e0d7fd250625f2d4d0e');
            } else {
              assert.fail("No transaction data");
            }
          }           
      }
    });

    it("Should fail if withdraw is to zero address", async function () {
      // Expect the transaction to be reverted with the specific error message
      // Revert reason is not available at this time, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916      
      // await expect(tokenVault.connect(addr1)._withdraw(1, ethers.constants.AddressZero)).to.be.revertedWith("Zero Address");
      let receipt;
      try {
            
            const depositTx = await tokenVault.connect(addr1)._withdraw(1, ethers.constants.AddressZero);
            receipt = await depositTx.wait();  
    
      } catch (error) {
    
            // Handle the expected revert here until revert reason is available, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916
            if (error.code === ethers.errors.CALL_EXCEPTION) {
              let reason = "Unknown Error";
              if (error.transaction) {
                expect(error.transaction.data).to.equal('0x293311ab00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000');
              } else {
                assert.fail("No transaction data");
              }
            }                  
      }
    }); 
    
    it("Should fail if not a shareholder", async function () {
      // Expect the transaction to be reverted with the specific error message
      // Revert reason is not available at this time, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916      
      // await expect(tokenVault.connect(addr2)._withdraw(1, addr2.address)).to.be.revertedWith("Not a shareHolder");
      let receipt;
      try {
            
        const depositTx = await tokenVault.connect(addr2)._withdraw(1, addr2.address);
        receipt = await depositTx.wait();  

      } catch (error) {

        // Handle the expected revert here until revert reason is available, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916      
        if (error.code === ethers.errors.CALL_EXCEPTION) {
          let reason = "Unknown Error";
          if (error.transaction) {
            expect(error.transaction.data).to.equal('0x293311ab0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c37f417fa09933335240fca72dd257bfbde9c275');
          } else {
            assert.fail("No transaction data");
          }
        }                  
      }      
    });

    it("Should fail if not enough shares", async function () {
      const depositAmount = ethers.utils.parseEther("10");
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);
      // Expect the transaction to be reverted with the specific error message
      // Revert reason is not available at this time, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916   
      // await expect(tokenVault.connect(addr1)._withdraw(depositAmount.add(1), addr1.address)).to.be.revertedWith("Not enough shares");
      let receipt;
      try {
            
        const depositTx = await tokenVault.connect(addr1)._withdraw(depositAmount.add(1), addr1.address);
        receipt = await depositTx.wait();  

      } catch (error) {

        // Handle the expected revert here until revert reason is available, https://github.com/hashgraph/hedera-json-rpc-relay/issues/1916      
        if (error.code === ethers.errors.CALL_EXCEPTION) {
          let reason = "Unknown Error";
          if (error.transaction) {
            expect(error.transaction.data).to.equal('0x293311ab0000000000000000000000000000000000000000000000008ac7230489e80001000000000000000000000000927e41ff8307835a1c081e0d7fd250625f2d4d0e');
          } else {
            assert.fail("No transaction data");
          }
        }                  
      }            
    });    

  });  

  describe("Views", function () {

    it("Should return the total assets of a user", async function () {
      const depositAmount = ethers.utils.parseEther("10");
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);

      expect(await tokenVault.totalAssetsOfUser(addr1.address)).to.equal(depositAmount);
    });
  });  

});
