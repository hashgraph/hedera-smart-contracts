// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AddressContract {
    receive() external payable {}
    string message = "Hello World from AddressContract!";
    event emitMessage(string a);
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

    function sendTo(address payable addressToQuery, uint amount) external {
        bool answer = addressToQuery.send(amount);
        require(answer, "Error sending");
    }

    function callAddr(address payable addressToQuery, uint amount) external {
        (bool answer,) = addressToQuery.call{value: amount}("");
        require(answer, "Error calling");
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
