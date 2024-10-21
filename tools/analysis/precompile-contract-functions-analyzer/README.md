# Precompile contract functions analyzer

Analyze all mainnet contracts, whether they are using some of the precompile contract functions, and how many times each precompile function is used.

## Requirements
- node >= 18.13.0
- python >= 3.8

## How to run locally:
- `npm install`
- `node fetch.js` - fetches all contracts from mainnet (by the time of writing 11290 with the latest id of 0.0.993240) and saves them in a local sqlite db (by the time of writing the entire process takes approximately 20 minutes)
- `python3 detect_precompile_calls.py` - detects whether the precompile selectors are used in a contract by searching for instruction operands within a disassembled bytecode (by the time of writing the entire process takes approximately 10 minutes)

## Usage table for contracts till id 0.0.993240

### Part #1

- Total contracts on mainnet: 11 290

- Unique contracts with at least 1 precompile call using `CALL`, `STATICCALL` or `DELEGATECALL` to 0x167: 4047

| Precompile function name               | Function selector | Total usage |
|----------------------------------------|-------------------|-------------|
| TRANSFER_TOKEN                         | eca36917          | 2 640       |
| MINT_TOKEN                             | 278e0b88          | 2 225       |
| ASSOCIATE_TOKENS                       | 2e63879b          | 2 087       |
| TRANSFER_FROM_NFT                      | 9b23d3d9          | 1 797       |
| BURN_TOKEN                             | acb9cff9          | 1 758       |
| CREATE_FUNGIBLE_TOKEN                  | 7812a04b          | 1 643       |
| TRANSFER_FROM                          | 15dacbea          | 1 583       |
| REDIRECT_FOR_TOKEN                     | 618dc65e          | 916         |
| ASSOCIATE_TOKEN                        | 49146bde          | 701         |
| UNPAUSE_TOKEN                          | 3b3bff0f          | 664         |
| UPDATE_TOKEN_EXPIRY_INFO               | 593d6e82          | 632         |
| GRANT_TOKEN_KYC                        | 8f8d7f99          | 600         |
| REVOKE_TOKEN_KYC                       | af99c633          | 583         |
| TRANSFER_NFT                           | 5cfc9011          | 525         |
| PAUSE_TOKEN                            | 7c41ad2c          | 488         |
| GET_TOKEN_EXPIRY_INFO                  | d614cdb8          | 408         |
| IS_KYC                                 | f2c31ff4          | 384         |
| UPDATE_TOKEN_INFO_V2                   | 18370d34          | 354         |
| ERC_ALLOWANCE                          | dd62ed3e          | 325         |
| TRANSFER_NFTS                          | 2c4ba191          | 305         |
| MINT_TOKEN_V2                          | e0f4059a          | 209         |
| GET_TOKEN_TYPE                         | 93272baf          | 206         |
| UPDATE_TOKEN_KEYS                      | 6fc3cbaf          | 205         |
| CREATE_NON_FUNGIBLE_TOKEN_V3           | ea83f293          | 180         |
| GET_TOKEN_KEY                          | 3c4dd32e          | 165         |
| APPROVE                                | e1f21c67          | 165         |
| CREATE_FUNGIBLE_TOKEN_V2               | c23baeb6          | 111         |
| BURN_TOKEN_V2                          | d6910d06          | 111         |
| CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V3 | abb54eb5          | 103         |
| CREATE_FUNGIBLE_TOKEN_V3               | 0fb65bf3          | 101         |
| CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V2 | 45733969          | 78          |
| GET_TOKEN_INFO                         | 1f69565f          | 64          |
| CRYPTO_TRANSFER                        | 189a554c          | 42          |
| WIPE_TOKEN_ACCOUNT_NFT                 | f7f38e26          | 40          |
| TRANSFER_TOKENS                        | 82bba493          | 33          |
| DISSOCIATE_TOKEN                       | 099794e8          | 32          |
| CRYPTO_TRANSFER_V2                     | 0e71804f          | 30          |
| CREATE_NON_FUNGIBLE_TOKEN              | 9dc711e0          | 29          |
| IS_TOKEN                               | 19f37361          | 28          |
| DISSOCIATE_TOKENS                      | 78b63918          | 27          |
| WIPE_TOKEN_ACCOUNT_FUNGIBLE_V2         | efef57f9          | 23          |
| CREATE_NON_FUNGIBLE_TOKEN_V2           | 9c89bb35          | 19          |
| CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES    | 5bc7c0e6          | 17          |
| IS_APPROVED_FOR_ALL                    | f49f40db          | 15          |
| UNFREEZE                               | 52f91387          | 11          |
| UPDATE_TOKEN_EXPIRY_INFO_V2            | d27be6cd          | 9           |
| GET_FUNGIBLE_TOKEN_INFO                | 3f28a19b          | 9           |
| GET_NON_FUNGIBLE_TOKEN_INFO            | 287e1da8          | 9           |
| CREATE_FUNGIBLE_TOKEN_WITH_FEES        | 4c381ae7          | 7           |
| CREATE_FUNGIBLE_TOKEN_WITH_FEES_V3     | 2af0c59a          | 6           |
| UPDATE_TOKEN_INFO_V3                   | 7d305cfa          | 5           |
| WIPE_TOKEN_ACCOUNT_FUNGIBLE            | 9790686d          | 5           |
| FREEZE                                 | 5b8f8584          | 3           |
| CREATE_FUNGIBLE_TOKEN_WITH_FEES_V2     | b937581a          | 3           |
| DELETE_TOKEN                           | f069f712          | 2           |
| GET_TOKEN_CUSTOM_FEES                  | ae7611a0          | 1           |
| GET_TOKEN_DEFAULT_KYC_STATUS           | 335e04c1          | 1           |
| GET_TOKEN_DEFAULT_FREEZE_STATUS        | a7daa18d          | 1           |
| IS_FROZEN                              | 46de0fb1          | 1           |

### Part #2

- Total transactions against contracts: 18 904 836

| Precompile function name               | Function selector | Total usage |
|----------------------------------------|-------------------|-------------|
| REDIRECT_FOR_TOKEN                     | 618dc65e          | 13 281 673  |
| TRANSFER_TOKEN                         | eca36917          | 10 878 681  |
| MINT_TOKEN                             | 278e0b88          | 2 196 057   |
| BURN_TOKEN                             | acb9cff9          | 1 366 742   |
| APPROVE                                | e1f21c67          | 494 270     |
| TRANSFER_NFT                           | 5cfc9011          | 47 390      |
| MINT_TOKEN_V2                          | e0f4059a          | 37 141      |
| BURN_TOKEN_V2                          | d6910d06          | 31 489      |
| ASSOCIATE_TOKEN                        | 49146bde          | 30 571      |
| TRANSFER_NFTS                          | 2c4ba191          | 19 122      |
| DISSOCIATE_TOKEN                       | 099794e8          | 18 051      |
| TRANSFER_FROM                          | 15dacbea          | 9 066       |
| GET_NON_FUNGIBLE_TOKEN_INFO            | 287e1da8          | 3 208       |
| WIPE_TOKEN_ACCOUNT_FUNGIBLE            | 9790686d          | 2 141       |
| WIPE_TOKEN_ACCOUNT_NFT                 | f7f38e26          | 1 415       |
| ASSOCIATE_TOKENS                       | 2e63879b          | 1 401       |
| CREATE_FUNGIBLE_TOKEN                  | 7812a04b          | 1 115       |
| GET_TOKEN_TYPE                         | 93272baf          | 789         |
| GET_TOKEN_INFO                         | 1f69565f          | 479         |
| CRYPTO_TRANSFER                        | 189a554c          | 456         |
| CRYPTO_TRANSFER_V2                     | 0e71804f          | 371         |
| TRANSFER_TOKENS                        | 82bba493          | 357         |
| GET_TOKEN_CUSTOM_FEES                  | ae7611a0          | 290         |
| CREATE_NON_FUNGIBLE_TOKEN_V3           | ea83f293          | 109         |
| CREATE_FUNGIBLE_TOKEN_V3               | 0fb65bf3          | 52          |
| TRANSFER_FROM_NFT                      | 9b23d3d9          | 38          |
| UPDATE_TOKEN_INFO_V2                   | 18370d34          | 36          |
| CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V3 | abb54eb5          | 35          |
| CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V2 | 45733969          | 27          |
| CREATE_FUNGIBLE_TOKEN_V2               | c23baeb6          | 16          |
| GET_TOKEN_KEY                          | 3c4dd32e          | 15          |
| WIPE_TOKEN_ACCOUNT_FUNGIBLE_V2         | efef57f9          | 14          |
| CREATE_NON_FUNGIBLE_TOKEN_V2           | 9c89bb35          | 5           |
| GET_FUNGIBLE_TOKEN_INFO                | 3f28a19b          | 4           |
| CREATE_NON_FUNGIBLE_TOKEN              | 9dc711e0          | 3           |
| CREATE_NON_FUNGIBLE_TOKEN              | 9dc711e0          | 2           |
| UPDATE_TOKEN_INFO_V3                   | 7d305cfa          | 1           |
| GRANT_TOKEN_KYC                        | 8f8d7f99          | 1           |

Top 50 contracts with the most transactions against them with at least 1 precompile call within a transaction:

- Total transactions against contracts with at least 1 precompile function call: 3 441 338

| Contract ID | Transactions count |
|-------------|--------------------|
| 0.0.3045981 | 930 270            |
| 0.0.3473679 | 347 557            |
| 0.0.3158574 | 336 741            |
| 0.0.3949434 | 304 125            |
| 0.0.5144196 | 220 247            |
| 0.0.1077627 | 143 106            |
| 0.0.4053945 | 118 064            |
| 0.0.1461860 | 104 855            |
| 0.0.2283226 | 87 326             |
| 0.0.4708120 | 86 364             |
| 0.0.4093491 | 72 581             |
| 0.0.4029437 | 67 959             |
| 0.0.1460199 | 64 714             |
| 0.0.2935218 | 61 874             |
| 0.0.3160217 | 53 458             |
| 0.0.6601793 | 48 100             |
| 0.0.4091053 | 36 059             |
| 0.0.3158172 | 18 070             |
| 0.0.4568290 | 17 932             |
| 0.0.3160328 | 17 803             |
| 0.0.4499459 | 14 035             |
| 0.0.2935502 | 10 870             |
| 0.0.3067873 | 10 756             |
| 0.0.1738953 | 9 611              |
| 0.0.6755814 | 9 360              |
| 0.0.3064799 | 9 082              |
| 0.0.1262126 | 8 343              |
| 0.0.6275509 | 7 843              |
| 0.0.4544591 | 6 252              |
| 0.0.1739095 | 6 202              |
| 0.0.1456985 | 6 147              |
| 0.0.4348341 | 5 766              |
| 0.0.4570286 | 5 634              |
| 0.0.6070108 | 5 629              |
| 0.0.1412503 | 5 592              |
| 0.0.1738971 | 5 204              |
| 0.0.2939223 | 5 121              |
| 0.0.4325057 | 5 112              |
| 0.0.2181449 | 4 833              |
| 0.0.2054876 | 4 568              |
| 0.0.2944959 | 3 913              |
| 0.0.2971373 | 3 911              |
| 0.0.3949448 | 3 857              |
| 0.0.6070064 | 3 695              |
| 0.0.2936092 | 3 651              |
| 0.0.1238566 | 3 164              |
| 0.0.4610937 | 3 060              |
| 0.0.3696885 | 2 987              |
| 0.0.2971311 | 2 969              |
| 0.0.1738806 | 2 950              |


### Part #3

- Deconstruction of REDIRECT_FOR_TOKEN usage

| Selector | Function name                             | Total calls |
|----------|-------------------------------------------|-------------|
| 70a08231 | balanceOf(address)                        | 11 788 124  |
| a9059cbb | transfer(address,uint256)                 | 654 426     |
| 23b872dd | transferFrom(address,address,uint256)     | 230 457     |
| 18160ddd | totalSupply()                             | 216 867     |
| 6352211e | ownerOf(uint256)                          | 191 720     |
| e985e9c5 | isApprovedForAll(address,address)         | 173 713     |
| dd62ed3e | allowance(address,address)                | 12 081      |
| 095ea7b3 | approve(address,uint256)                  | 8 340       |
| 95d89b41 | symbol()                                  | 2 403       |
| 06fdde03 | name()                                    | 2 403       |
| 313ce567 | decimals()                                | 632         |
| 0a754de6 | associate()                               | 208         |
| 081812fc | getApproved(uint256)                      | 55          |
| 42842e0e | safeTransferFrom(address,address,uint256) | 31          |
| c87b56dd | tokenURI(uint256)                         | 64          |
| a22cb465 | setApprovalForAll(address,bool)           | 6           |
| 6c0360eb | baseURI()                                 | 2           |

Note: all supported functions can be found [here](https://github.com/hashgraph/hedera-services/blob/develop/hedera-node/hedera-smart-contract-service-impl/src/main/java/com/hedera/node/app/service/contract/impl/exec/systemcontracts/hts/AbiConstants.java) in the services repository
