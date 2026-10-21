// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AddressContract {
    receive() external payable {}
    string message = "Hello World from AddressContract!";
    address nonExistingContract = address(999999999999);

    event emitMessage(string a);
    event emitMessageData(bool success);
    event res(bool answer, bytes data);

    function getAddressBalance(address addressToQuery) external view returns (uint256) {
        return addressToQuery.balance;
    }

    function getAddressCode(address addressToQuery) external view returns (bytes memory) {
        return addressToQuery.code;
    }

    function getAddressCodeHash(address addressToQuery) external view returns (bytes32) {
        return addressToQuery.codehash;
    }

    function transferTo(address payable addressToQuery, uint amount) external {
        return addressToQuery.transfer(amount);
    }

    function sendTo(address payable addressToQuery, uint amount) external returns (bool){
        bool answer = addressToQuery.send(amount);
        emit emitMessageData(answer);

        return answer;
    }

    function callAddr(address payable addressToQuery, uint amount) external returns (bool){
        (bool answer,) = addressToQuery.call{value: amount}("");
        emit emitMessageData(answer);

        return answer;
    }


    function callNonExistingAddress() external {
        (bool answer, bytes memory data) = nonExistingContract.call("");
        emit res(answer, data);
    }

    function callAddrWithSig(address payable addressToQuery, uint amount, string memory functionSig) external payable returns (bytes memory){
        (bool answer, bytes memory data) = addressToQuery.call{gas: 900000, value: amount}(abi.encodeWithSignature(functionSig));
        require(answer, "Error calling");
        emit res(answer, data);

        return data;
    }

    function delegate(address payable addressToQuery, string memory functionSig) external payable returns (bytes memory){
        (bool success, bytes memory data) = addressToQuery.delegatecall{gas: 90000000}(abi.encodeWithSignature(functionSig));
        require(success, "Error calling");
        emit res(success, data);

        return data;
    }

    function staticCall(address payable addressToQuery, string memory functionSig) external payable returns (bytes memory){
        (bool answer, bytes memory data) = addressToQuery.staticcall(abi.encodeWithSignature(functionSig));
        require(answer, "Error calling");
        emit res(answer, data);

        return data;
    }

    function staticCallSet(address payable addressToQuery, string memory functionSig, uint number) external payable returns (bytes memory){
        (bool answer, bytes memory data) = addressToQuery.staticcall(abi.encodeWithSignature(functionSig, number));
        require(answer, "Error calling");
        emit res(answer, data);

        return data;
    }
}
