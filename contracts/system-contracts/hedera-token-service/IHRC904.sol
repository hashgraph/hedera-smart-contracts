// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

interface IHRC904 {
    function cancelAirdropFT(address receiverAddress) external returns (int64 responseCode);
    function cancelAirdropNFT(address receiverAddress, int64 serialNumber) external returns (int64 responseCode);
    function claimAirdropFT(address senderAddress) external returns (int64 responseCode);
    function claimAirdropNFT(address senderAddress, int64 serialNumber) external returns (int64 responseCode);
    function rejectTokenFT() external returns (int64 responseCode);
    function rejectTokenNFTs(int64[] memory serialNumbers) external returns (int64 responseCode);
    function setUnlimitedAutomaticAssociations(bool enableAutoAssociations) external returns (int64 responseCode);
}
