// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

contract EcrecoverCaller {
    event EcrecoverResult(bytes result);

    function function1(bytes32 messageHash, uint8 v, bytes32 r, bytes32 s) external view returns (address) {
        address result = ecrecover(messageHash, v, r, s);
        return result;
    }

    function function2(bytes calldata callData) external payable returns (bool) {
        address target = address(0x0000000000000000000000000000000000000001);
        (bool success, bytes memory result) = target.call{value: msg.value}(callData);
        if (!success) {
            revert();
        }
        emit EcrecoverResult(result);
        return success;
    }

    function function3() external payable {
        address payable target = payable(address(0x0000000000000000000000000000000000000001));
        target.send(msg.value);
    }

    function function4() external payable {
        address payable target = payable(address(0x0000000000000000000000000000000000000001));
        target.transfer(msg.value);
    }
}
