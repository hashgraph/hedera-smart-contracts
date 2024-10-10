# Precompile contract functions analyzer

Analyze all mainnet contracts, whether they are using some of the precompile contract functions and how many times each precompile function is used.

## Requirements
- node >= 18.13.0
- python >= 3.8

## How to run locally:
- `npm install`
- `node fetch.js` - fetches all contracts from mainnet (by the time of writing 11290 with latest id of 0.0.993240) and save them in a local sqlite db (by the time of writing the entire process takes approximately 20 minutes)
- `python3 detect_precompile_calls.py` - detects whether the precompile selectors are used in a contract by searching for instruction operands within a disassembled bytecode (by the time of writing the entire process takes approximately 10 minutes)

## Usage table for contracts till id 0.0.993240

- Total contracts on mainnet: 11290
- Unique contracts with at least 1 precompile call to 0x167: 4047

| Precompile function name               | Function selector | Total usage |
|----------------------------------------|-------------------|-------------|
| TRANSFER_TOKEN                         | eca36917          | 2640        |
| MINT_TOKEN                             | 278e0b88          | 2225        |
| ASSOCIATE_TOKENS                       | 2e63879b          | 2087        |
| TRANSFER_FROM_NFT                      | 9b23d3d9          | 1797        |
| BURN_TOKEN                             | acb9cff9          | 1758        |
| CREATE_FUNGIBLE_TOKEN                  | 7812a04b          | 1643        |
| TRANSFER_FROM                          | 15dacbea          | 1583        |
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

Note: all supported functions can be found [here](https://github.com/hashgraph/hedera-services/blob/develop/hedera-node/hedera-smart-contract-service-impl/src/main/java/com/hedera/node/app/service/contract/impl/exec/systemcontracts/hts/AbiConstants.java) in the services repository
