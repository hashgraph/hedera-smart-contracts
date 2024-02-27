// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Sample {
    function selfdestruct() external {
        selfdestruct(payable(msg.sender));
    }
}

contract InternalCallee {
    uint calledTimes = 0;

    function factorySample() external returns (address) {
        return address(new Sample());
    }

    function externalFunction() external returns (uint) {
        return ++calledTimes;
    }

    function revertWithRevertReason() public returns (bool) {
        revert("RevertReason");
    }

    function revertWithoutRevertReason() public returns (bool) {
        revert();
    }

    function selfdestruct(address payable _addr) external {
        selfdestruct(_addr);
    }

      function selfdestructSample(address payable sampleAddress) external {
        Sample(sampleAddress).selfdestruct();
    }

    event DeployedContractAddress(address);

     function deployViaCreate2(uint256 _salt) external returns (address) {
        Sample temp = new Sample{salt: bytes32(_salt)}();
        emit DeployedContractAddress(address(temp));
        
        return address(temp);
    }


}
