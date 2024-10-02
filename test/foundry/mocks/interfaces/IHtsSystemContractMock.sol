// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import '../../../../contracts/system-contracts/hedera-token-service/IHederaTokenService.sol';

interface IHtsSystemContractMock is IHederaTokenService {

    struct TokenConfig {
        bool explicit; // true if it was explicitly set to value
        bool value;
    }

    // this struct avoids duplicating common NFT data, in particular IHederaTokenService.NonFungibleTokenInfo.tokenInfo
    struct PartialNonFungibleTokenInfo {
        address ownerId;
        int64 creationTime;
        bytes metadata;
        address spenderId;
    }
}
