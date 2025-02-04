// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../../system-contracts/hedera-token-service/IHederaTokenService.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../../system-contracts/HederaResponseCodes.sol";

contract Exchange is OwnableUpgradeable, UUPSUpgradeable {
    address public tokenAddress;
    address constant private precompile = address(0x167);

    function initialize(address token) public initializer {
        tokenAddress = token;
        __Ownable_init(msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function deposit() public payable {
        require(msg.value > 0, "You have to deposit more than 0.");
    }

    function depositTokens(int64 amount) public returns (int responseCode) {
        require(amount > 0, "You have to deposit more than 0.");
        (bool success, bytes memory result) = precompile.call(
            abi.encodeWithSelector(
                IHederaTokenService.transferToken.selector,
                tokenAddress,
                msg.sender,
                address(this),
                amount
            )
        );
        responseCode = success
            ? abi.decode(result, (int32))
            : HederaResponseCodes.UNKNOWN;

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function buy() public payable {
        uint256 amountTobuy = msg.value;
        uint256 dexBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(amountTobuy > 0, "You need to send some HBAR.");
        require(amountTobuy <= dexBalance, "Not enough tokens in the reserve.");
        IERC20(tokenAddress).transfer(msg.sender, amountTobuy);
    }

    function sell(uint256 amount) public {
        require(amount > 0, "You need to sell at least some tokens");
        uint256 approvedAmt = IERC20(tokenAddress).allowance(
            msg.sender,
            address(this)
        );
        require(approvedAmt >= amount, "Check the token allowance");
        IERC20(tokenAddress).transferFrom(
            msg.sender,
            payable(address(this)),
            amount
        );
        payable(msg.sender).transfer(amount);
    }

    function getNativeBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getTokenBalance() public view returns (uint) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function getImplementationAddress() public view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    function associateToken() public returns (int responseCode) {
        (bool success, bytes memory result) = precompile.call(
            abi.encodeWithSelector(
                IHederaTokenService.associateToken.selector,
                address(this),
                tokenAddress
            )
        );
        responseCode = success
            ? abi.decode(result, (int32))
            : HederaResponseCodes.UNKNOWN;

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
