// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IClimber.sol";

contract Test_ERC165 is ERC165, Climber {
    function hasHarness() external virtual returns (bool) {
        return true;
    }

    function hasChalk() external virtual returns (string memory) {
        return 'yes';
    }
    
    function hasClimbingShoes() external virtual returns (string memory) {
        return 'yes';
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(Climber).interfaceId || super.supportsInterface(interfaceId);
}
}