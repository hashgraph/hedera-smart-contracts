// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../../HederaTokenService.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract EcosystemWeekHTS is HederaTokenService {

    address owner;
    uint64 initialSupply;
    string tokenSymbol;
    address public htsAddress;
        
    string name = "EcosystemWeek";
    string memo = "EcosystemWeek this is awesome";
    int64 maxSupply = 1000;
    uint32 decimals = 8;
    bool freezeDefaultStatus = false;

    event ResponseCode(int responseCode);
    event CreatedToken(address tokenAddress);
    event TransferredToken(address token, address sender, address receiver, int64 amount);

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

        return true;
    }

    function symbol() public view returns (string memory) {
        return IERC20Metadata(htsAddress).symbol();
    }

    function balanceOf(address account) external view returns (uint256) {
        return IERC20(htsAddress).balanceOf(account);
    }
}
