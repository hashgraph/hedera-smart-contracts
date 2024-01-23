// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "../../../../contracts/hts-precompile/IHRC.sol";

interface IERCCommonToken {
    function balanceOf(address account) external view returns (uint256);
}

interface IHRCCommon is IHRC, IERCCommonToken {
    // NOTE: can be moved into IHRC once implemented https://hips.hedera.com/hip/hip-719
    function isAssociated(address evmAddress) external view returns (bool);
}
