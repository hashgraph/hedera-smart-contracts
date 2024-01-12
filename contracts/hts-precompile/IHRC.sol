// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

interface IERCCommonToken {
    function balanceOf(address account) external view returns (uint256);
}

interface IHRC {
    function associate() external returns (uint256 responseCode);
    function dissociate() external returns (uint256 responseCode);

    function isAssociated(address evmAddress) external view returns (bool); // TODO: pending completion of https://hips.hedera.com/hip/hip-719 ??
}

interface IHRCCommon is IHRC, IERCCommonToken {}