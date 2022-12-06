# Ecosytem Week Contract Development Lifecycle Demo

## Obtain a testnet account
Go to https://portal.hedera.com/, register and follow instructions to obtain an ECDSA account

Blog post - https://hedera.com/blog/create-accounts-with-ed25519-and-ecdsa-keys-from-the-hedera-portal

## Clone Smart Contract Library 

1. Clone https://github.com/hashgraph/hedera-smart-contracts
2. Run `npm i`
3. Run `npx hardhat compile`

## Configure Hardhat RPC
1. Open `hardhat.config.js`
2. Add the Hedera TestNet Network
    ```json
        testnet: {
            url: 'https://testnet.hashio.io/api',
            accounts: [
                "0x...", // replace with private keys obtained from portal
                "0x..."
            ],
            chainId: 296,
        }
    ```
3. Set `defaultNetwork` to `testnet` name as noted above

## Create a custom Contract

Create a new solodity  contract at `contracts/hts-precompile/examples/ecosystem-week/EcosystemWeek.sol` and populate with the following contents
```sol
    // SPDX-License-Identifier: Apache-2.0
    pragma solidity >=0.5.0 <0.9.0;
    pragma experimental ABIEncoderV2;

    import "../../HederaTokenService.sol";
    import "../../KeyHelper.sol";

    import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
    import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

    contract EcosystemWeekHTS is HederaTokenService, KeyHelper {

        address owner;
        address htsAddress;
        uint64 initialSupply;
        string tokenSymbol;
            
        string name = "EcosystemWeek";
        string memo = "EcosystemWeek this is awesome";
        int64 maxSupply = 1000;
        uint32 decimals = 8;
        bool freezeDefaultStatus = false;

        event ResponseCode(int responseCode);
        event CreatedToken(address tokenAddress);
        event TransferredToken(address token, address sender, address receiver, int64 amount);

        // local balance
        mapping(address => int64) localBalance;

        constructor(uint64 initSupply, string memory tSymbol) payable {
            owner = address(this);
            initialSupply = initSupply;
            tokenSymbol = tSymbol;
            
            IHederaTokenService.HederaToken memory token;
            token.name = name;
            token.symbol = tokenSymbol;
            token.treasury = owner;
            token.expiry = IHederaTokenService.Expiry(
                0, owner, 8000000
            );

            (int responseCode, address tokenAddress) =
            HederaTokenService.createFungibleToken(token, initialSupply, decimals);
            emit ResponseCode(responseCode);

            if (responseCode != HederaResponseCodes.SUCCESS) {
                revert ();
            }

            htsAddress = tokenAddress;
            emit CreatedToken(tokenAddress);
        }

        function iAttended() external returns (bool) {
            (int associateResponseCode) = HederaTokenService.associateToken(msg.sender, htsAddress);
            emit ResponseCode(associateResponseCode);

            if (associateResponseCode != HederaResponseCodes.SUCCESS) {
                require(associateResponseCode != 194, "Attendant has already associated with token");
                revert ();
            }
                    
            (int responseCode) = HederaTokenService.transferToken(htsAddress, owner, msg.sender, 1);
            emit ResponseCode(responseCode);

            if (responseCode != HederaResponseCodes.SUCCESS) {
                revert ();
            }

            emit TransferredToken(htsAddress, owner, msg.sender, 1);
            localBalance[msg.sender] = 1;

            return true;
        }

        function symbol() public view returns (string memory) {
            return IERC20Metadata(htsAddress).symbol();
        }

        function balanceOf(address account) external view returns (uint256) {
            return IERC20(htsAddress).balanceOf(account);
        }
    }
```

## Create test deployment and execution code
Create an empty `js` file at `test/ecosystemweek/erc20.js` and populate with the following code
```js
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
```


## Execute test code
1. Compile by running `npx hardhat compile`
2. Run tests with `npx hardhat test test/ecosystemweek/erc20.js`
3. Observe urls in console outputs for contract and execution details