// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./VaultV1.sol";


// @notice: As the state variables are shared and store in a proxy contract's storage, working with low-level assembly code
//          to access directly to the storage is recommended. 
// @notice: Avoid working with state variables among implementation contracts

contract VaultV2 is VaultV1 {
    uint256 private _version; // slot 0
    uint256 private _totalBalance; // slot 1
    address private _beneficiary; // slot 2

    modifier onlyRightfulBeneficiary() {
        assembly {
            if iszero(eq(caller(), sload(2))) {
                revert(0, 0)
            }
        }
        _;
    }

    function initializeV2(address beneficiary) reinitializer(2) external {
        __Ownable_init(_msgSender());

        assembly{
            sstore(0, 2) // slot 0: _version
            sstore(2, beneficiary) // slot 2: _beneficiary
        }
    }


    function withdraw(uint256 _amount) external override onlyRightfulBeneficiary{
        if (_amount > totalBalance()) {
            revert InsufficientFund();
        }

        assembly {
            sstore(1, sub(sload(1), _amount))
            let success := call(gas(), caller(), _amount, 0, 0, 0, 0)
            if iszero(success) {
                revert(0,0)
            }
        }

        emit Withdrawn(_msgSender(), _amount);
    }

    function getCurrentBeneficiary() public view returns (address beneficiary) {
        assembly {
            beneficiary := sload(2)
        }
    }

    function version() external view override virtual returns (uint256 currentVersion) {
        assembly {
            currentVersion := sload(0)
        }
    }
}
