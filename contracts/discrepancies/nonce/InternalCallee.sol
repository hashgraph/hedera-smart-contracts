// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Sample {
    function selfDestructSample() external {
        selfdestruct(payable(msg.sender));
    }
}

contract InternalCallee {
    uint public calledTimes = 0;

    function factorySample() external returns (address) {
        return address(new Sample());
    }

    function externalFunction() external returns (uint) {
        return ++calledTimes;
    }

    function revertWithRevertReason() public returns (bool) {
        ++calledTimes;
        revert("RevertReason");
    }

    function revertWithoutRevertReason() public pure returns (bool) {
        revert();
    }

    function selfDestruct(address payable _addr) external {
        selfdestruct(_addr);
    }

    function selfdestructSample(address payable sampleAddress) external {
        Sample(sampleAddress).selfDestructSample();
    }

    function internalTransfer(address payable _contract, address payable _receiver) payable external {
        (bool success,) = _contract.call(abi.encodeWithSignature("transferTo(address)", _receiver));
        require(success, "Function call failed");
    }

    event DeployedContractAddress(address);

    function deployViaCreate2(uint256 _salt) external returns (address) {
        Sample temp = new Sample{salt : bytes32(_salt)}();
        emit DeployedContractAddress(address(temp));

        return address(temp);
    }
}
