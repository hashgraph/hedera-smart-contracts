// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract TestTryCatchContract {
    function myFunc(uint x) public pure returns (string memory) {
        require(x != 0, "require failed");
        return "my func was called";
    }
}


contract ControlStructures {
    TestTryCatchContract private testContract;

    constructor() {
        testContract = new TestTryCatchContract();
    }

    function evaluateIfElse(bool condition) external pure returns(bool) {
        if(condition) {
            return true;
        } else {
            return false;
        }
    }

    function evaluateWhile(uint256 total) external pure returns(uint256) {
        require(total < 100, "Cannot have more than 100 iterations");
        uint256 it = 0;
        while(++it < total) {}

        return it;
    }

    function evaluateDoWhile(uint256 total) external pure returns(uint256) {
        require(total < 100, "Cannot have more than 100 iterations");
        uint256 it = 0;
        do {
            it++;
        } while(it < total);

        return it;
    }

    function evaluateBreak(uint256 total, uint256 interception) external pure returns(uint256) {
        require(total < 100, "Cannot have more than 100 iterations");
        uint256 it = 0;
        while(it++ < total) {
            if(it == interception) break;
        }

        return it;
    }

    function evaluateContinue(uint256 total, uint256 interception) external pure returns(uint256) {
        require(total < 100, "Cannot have more than 100 iterations");
        uint256 iterableSteps = 0;
        
        for(uint i=0; i < total; i++) {
            if(interception < i) continue;
            iterableSteps++;
        }

        return iterableSteps;
    }

    function evaluateFor(uint256 total) external pure returns(uint256) {
        require(total < 100, "Cannot have more than 100 iterations");
        uint256 it = 0;
        for(uint i=0; i < total; i++) {
            it = i;
        }

        return it;
    }

    function myFunc(uint x) internal pure returns (string memory) {
        require(x != 0, "require failed");
        return "my func was called";
    }

    function evaluateTryCatch(uint256 condition) external view returns(bool) {
        try testContract.myFunc(condition) {
            return true;
        } catch {
            return false;
        }
    }
}
