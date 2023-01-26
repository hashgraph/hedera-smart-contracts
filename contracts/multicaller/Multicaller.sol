//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

contract Multicaller {

    uint public counter = 0;
    event Result(bytes[] results);

    function multiCall(
        address[] calldata targets,
        bytes[] calldata data
    ) external view returns (bytes[] memory) {
        require(targets.length == data.length, "target length != data length");

        bytes[] memory results = new bytes[](data.length);

        for (uint i; i < targets.length; i++) {
            (bool success, bytes memory result) = targets[i].staticcall(data[i]);
            require(success, "call failed");
            results[i] = result;
        }

        return results;
    }

    function multiDelegateCall(
        address[] calldata targets,
        bytes[] memory data
    ) external payable returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint i; i < targets.length; i++) {
            (bool success, bytes memory result) = targets[i].delegatecall(data[i]);
            require(success, "call failed");
            results[i] = result;
        }

        emit Result(results);
    }

    receive() external payable {}
    fallback() external payable {}
}