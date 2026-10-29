// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

/// @dev HTS Token Proxy contract defined in HIP-719, Specification section.
///
/// For more information,
/// see https://github.com/hashgraph/hedera-smart-contracts/issues/885.
contract HRC719TokenProxy {
    fallback() external payable {
        address precompileAddress = address(0x167);
        assembly {
            mstore(0, 0xFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFEFE)
            calldatacopy(32, 0, calldatasize())

            let result := call(gas(), precompileAddress, 0, 8, add(24, calldatasize()), 0, 0)
            let size := returndatasize()
            returndatacopy(0, 0, size)
            switch result
                case 0 { revert(0, size) }
                default { return(0, size) }
        }
    }
}
