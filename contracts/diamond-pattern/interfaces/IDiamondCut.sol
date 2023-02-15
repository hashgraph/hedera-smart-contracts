// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IDiamondCut {
    enum FacetCutAction {Add, Replace, Remove} // Add=0, Replace=1, Remove=2

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    function diamondCut(FacetCut[] calldata _diamondCut, address _init, bytes calldata _calldata) external;

    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
}
