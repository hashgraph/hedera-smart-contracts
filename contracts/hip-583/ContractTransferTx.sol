// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract ContractTransferTx {

    event Transferred(address _from, address _to, uint256 _amount);

    function transferTo(address payable _to, uint256 _amount) public {
        require(address(this).balance > _amount, "Insufficient contract balance");

        (bool success, ) = _to.call{value : _amount}("");
        require(success, "Transfer call failed");

        emit Transferred(msg.sender, _to, _amount);
    }

    function transferFungibleTokenTo(address tokenContract, address _to, uint256 _amount) public {
        (bool success,) = tokenContract.call(abi.encodeWithSignature("transfer(address,uint256)", _to, _amount));
        require(success, "Function call failed");
    }

    event Success(bool _success, bytes _data);

    function transferFromNonFungibleTokenTo(address tokenContract, address _from, address _to, uint256 _tokenId) public {
        (bool success, bytes memory data) = tokenContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", _from, _to, _tokenId));
        emit Success(success, data);
    }

    receive() external payable {}

    fallback() external payable {}
}
