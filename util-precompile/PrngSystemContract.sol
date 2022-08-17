// SPDX-License-Identifier: Apache-2.0

import "./IPrngSystemContract.sol";

contract PrngSystemContract {
    // Prng system contract address
    address constant PRECOMPILE_ADDRESS = address(0x169);

    function getPseudorandomSeed() external returns (bytes32 seedBytes) {
        (bool success, bytes memory result) = PRECOMPILE_ADDRESS.call(
            abi.encodeWithSelector(IPrngSystemContract.getPseudorandomSeed.selector));
        require(success, "PRNG system call failed");
        seedBytes = abi.decode(result, (bytes32));
    }
}
