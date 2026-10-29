// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


// @notice: As the state variables are shared and store in a proxy contract's storage, working with low-level assembly code
//          to access directly to the storage is recommended. 
// @notice: Avoid working with state variables among implementation contracts

contract VaultV1 is OwnableUpgradeable, UUPSUpgradeable{
    uint256 private _version;   // slot 0
    uint256 private _totalBalance; // slot 1

    error InsufficientFund();
    event Deposited(address depositor, uint256 amount);
    event Withdrawn(address withdrawer, uint256 amount);

    function initialize() external initializer {
        __Ownable_init(_msgSender());
        assembly {
            sstore(0, 1) // slot 0: _version
        }
    }

    function deposit() external payable {
        assembly {
            sstore(1, add(sload(1), callvalue()))
        }
        emit Deposited(_msgSender(), msg.value);
    }

    function withdraw(uint256 _amount) external virtual onlyOwner {
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

    function totalBalance() public view returns (uint256 total) {
        assembly {
            total := sload(1)
        }
    }

    function version() external view virtual returns (uint256 currentVersion) {
        assembly {
            currentVersion := sload(0)
        }
    }

    // must have for UUPSUpgradable Proxy
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
