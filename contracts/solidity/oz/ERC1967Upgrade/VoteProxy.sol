// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";


/**
 * @dev This contract acts as a Proxy contract for the vote contracts
 */
contract VoteProxy is ERC1967Proxy, Context {
    /**
     * @dev caller is not authorized
     */
    error Unauthorized_Caller();

    /**
     * @dev Initializes the upgradeable ERC1967Proxy with an initial implementation specified by `implementation` and an empty call data.
     */
    constructor(address implementationContract) ERC1967Proxy(implementationContract, "") {
        ERC1967Utils.changeAdmin(_msgSender());
    }

    /**
     * @dev modifier which only allows proxy admin
     */
    modifier onlyProxyAdmin(address caller) {
        if (caller != ERC1967Utils.getAdmin()) {
            revert Unauthorized_Caller();
        }
        _;
    }

    /**
     * @notice required by Solidity
     */
    receive() external payable {}

    /**
     * @dev Returns the predefined IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
     *
     * @notice The IMPLEMENTATION_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
     */
    function getImplementationSlot() external pure returns (bytes32) {
        return ERC1967Utils.IMPLEMENTATION_SLOT;
    }

    /**
     * @dev Returns the current implementation address.
     *
     * @notice The internal _implementation() utilizes ERC1967Utils.getImplementation();
     */
    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /**
     * @dev Performs implementation upgrade with additional setup call if data is nonempty.
     * This function is payable only if the setup call is performed, otherwise `msg.value` is rejected
     * to avoid stuck value in the contract.
     *
     * Emits an {IERC1967-Upgraded} event.
     */
    function upgradeToAndCall(address newImplementation, bytes memory data) external onlyProxyAdmin(_msgSender()){
        ERC1967Utils.upgradeToAndCall(newImplementation, data);
    }

    /**
     * @dev Returns the predefined ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
     *
     * @notice The ADMIN_SLOT is obtained as bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
     */
    function getAdminSlot() external pure returns (bytes32) {
        return ERC1967Utils.ADMIN_SLOT;
    }

    /**
     * @dev returns the current proxy admin
     *
     * TIP: To get this value clients can read directly from the storage slot shown below (specified by ERC-1967) using
     * the https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.
     * `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`
     */
    function getCurrentAdmin() external view returns (address) {
        return ERC1967Utils.getAdmin();
    }

     /**
     * @dev Changes the admin of the proxy.
     *
     * Emits an {IERC1967-AdminChanged} event.
     */
    function changeAdmin(address newAdmin) external onlyProxyAdmin(_msgSender()) {
        ERC1967Utils.changeAdmin(newAdmin);
    }
}
