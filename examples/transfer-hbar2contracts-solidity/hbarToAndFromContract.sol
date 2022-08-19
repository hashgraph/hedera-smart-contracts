// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// Compile with remix for remote imports to work - otherwise keep precompiles locally
import "https://github.com/hashgraph/hedera-smart-contracts/blob/main/hts-precompile/HederaTokenService.sol";
import "https://github.com/hashgraph/hedera-smart-contracts/blob/main/hts-precompile/HederaResponseCodes.sol";
 
contract hbarToAndFromContract is HederaTokenService{
    //============================================ 
    // GETTING HBAR TO THE CONTRACT
    //============================================ 
    receive() external payable {}

    fallback() external payable {}

    function tokenAssociate(address _account, address _htsToken) payable external {
        require(msg.value > 2000000000,"Send more HBAR");
        
        int response = HederaTokenService.associateToken(_account, _htsToken);
        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Token association failed");
        }
    }
        
    //============================================ 
    // GETTING HBAR FROM THE CONTRACT
    //============================================ 
    function transferHbar(address payable _receiverAddress, uint _amount) public {
        _receiverAddress.transfer(_amount);
    }

    function sendHbar(address payable _receiverAddress, uint _amount) public {
        require(_receiverAddress.send(_amount), "Failed to send Hbar");
    }

    function callHbar(address payable _receiverAddress, uint _amount) public {
        (bool sent, ) = _receiverAddress.call{value:_amount}("");
        require(sent, "Failed to send Hbar");
    }
    
    
    //============================================ 
    // CHECKING THE HBAR BALANCE OF THE CONTRACT
    //============================================ 
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}