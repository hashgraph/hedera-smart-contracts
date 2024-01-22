// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "../../../../contracts/hts-precompile/IHRC.sol";

interface IERCCommonToken {
    function balanceOf(address account) external view returns (uint256);
}

interface IHRCCommon is IHRC, IERCCommonToken {}
