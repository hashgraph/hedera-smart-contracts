// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Scoping {
    function minimalScoping() pure public {
        {
            uint same;
            same = 1;
        }

        {
            uint same;
            same = 3;
        }
    }

    function reassign() pure public returns (uint) {
        uint x = 1;
        {
            x = 2; // this will assign to the outer variable
        }
        return x; // x has value 2
    }
}
