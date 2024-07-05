// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract CancunOpcodes {
    event ContractAddress(address);

    // @dev writes `value` to transient storage at `transientSlot` using tstore,
    //      then read `value` from transient storage, using tload, into memory variable, val,
    //      and finally write `val` to regular storage at `regularSlot`
    function transientStorage(uint256 value, uint256 transientSlot, uint256 regularSlot) external {
        // store `value` to `slot` using tstore
        assembly {
            tstore(transientSlot, value)
        }

        // The `value` at `transientSlot` is stored transiently and will be wiped off after the transaction is done processing.
        // Therefore, in order to retain the value for the sake of testing, value will be retrieved from the same transientSlot using TLOAD 
        // and then stored in another slot, REGULAR_SLOT, using regular SSTORE opcode
        uint256 val;
        assembly {
            // read val from transientSlot using tload
            val := tload(transientSlot)

            // write val to regularSlot using sstore to retain value `val`
            sstore(regularSlot, val)
        }
    }

    function getStorageAt(uint256 slot) external view returns (uint256 value) {
        assembly {
            value := sload(slot)
        }
    }

    // @dev stores the address of this contract at the offset 0x20, then copy the address from that pointer offset to offset 0x0.
    //      Eventually, return the value at offset 0x0.
    function memoryCopy() external {
        address contractAddress;
        assembly {
            // // store address of this contract at the next available pointer in memory
            mstore(0x20, address())

            // copy 32 bytes from offset 0x20 to offset 0x0.
            mcopy(0x0, 0x20, 32)

            // assign `contractAddress` with the value at offset 0x0 in memory
            contractAddress := mload(0x0)
        }
        emit ContractAddress(contractAddress);
    }
}
