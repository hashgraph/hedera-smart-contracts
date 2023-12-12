// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC2771ForwardTest is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {

    }

    uint test;
    event TestEvent(bool, bool, bool, address);

    function validateTest(ERC2771Forwarder.ForwardRequestData calldata request)
        public
        returns (bool, bool, bool, address)
    {
        test = 5;
        (bool t1, bool t2, bool t3, address t4) = _validate(request);
        emit TestEvent(t1, t2, t3, t4);

        return (t1, t2, t3, t4);
    }

    function fund() external payable{}

    function getChainID() external view returns (uint256){
        return block.chainid;
    }
}
