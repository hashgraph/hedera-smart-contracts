//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AssignmentReferenceTypes {
    uint[5] private someArray = [1, 2, 3, 4, 5];

    function testAssignmentOfReferenceTypes() external {
        testChangeCopy(someArray);
        testChangeReference(someArray);
    }

    function testChangeCopy(uint[5] memory y) internal pure {
        y[2] = 8;
    }

    function testChangeReference(uint[5] storage y) internal {
        y[3] = 10;
    }

    function getSomeArray() external view returns(uint[5] memory) {
        return someArray;
    }
}
