# EVM Analytic tools study
### General Information:
Purpose of the research: Analysing suitability of selected  tools in a Hedera project.

This report aims to analyze potential tools that will aid in the development, porting, and security assessment
of Smart Contracts deployed on the Hedera network. Key aspects evaluated during this research include:
- Ease of use and compatibility with Hedera.
- Ability to identify optimizations and potential errors or bugs specific to Smart Contracts on the Hedera.
- Compatibility issues with contracts ported from Ethereum, or other EVM networks, to the Hedera network.

(suitability of these tools in a Hedera project).
### Prerequisites
Tools were tested in MacOS and Ubuntu Linux environments as well as on Docker containers. Test setup involves
launching the analytical tools discussed in this report: `docker-compose up -d`, using
  [docker-compose](slither/docker-compose.yaml) file placed in the tool analysis directory ([Dockerfile](slither/Dockerfile) for the Slither will be required).

# Guidelines for using Ethereum precompiles in Hedera:
1. Hedera supports ED25519 accounts, ecrecover works correctly only for ECSDA accounts. This must be noted during potential
   contract migration (Slither detector placed in this repository can be used to check for ecrecover usage in the contract to
   migrate). It must be noted that OpenZeppelin - most widely used Solidity library, contains smart contracts using ecrecover,
   ones that will not be compatibile with Headera, and are listed below 
    - ERC20Wrapper
    - ERC2771Forwarder
    - ERC721Wrapper
    - ERC20Permit
    - governance/utils/Votes
    - Utils: EIP712Verifier, cryptography/ECDSA, SignatureChecker
2. There are precompiles which may be missing from Hedera EVM that are present in current EVM version.
   For example Cancun-related updates are yet to be implemented as for end of April 2024.
3. When using the Hedera Token Service it is important to check if the token is
   [associated](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/associate-tokens-to-an-account) with the receiving account.
