# Hedera Smart Contract Bytecode Analyzer

This Python script analyzes the bytecode of Smart Contracts on the Hedera network.

## Requirements

- Python 3.6 or higher
- `requests` library
- `evmdasm` library

To install the required Python libraries, run:

```bash
pip install requests evmdasm
```

## Usage

The script can be run from the command line with the following arguments:

- `contract_id`: The ID of the smart contract whose bytecode you want to analyze.
- `--previewnet`: Optional flag to use the Previewnet Mirror Node URL.
- `--testnet`: Optional flag to use the Testnet Mirror Node URL.

If no network flag is specified, the script defaults to using the Mainnet Mirror Node URL.

### Basic Command

```bash
python detect_token_creation_with_secp_key.py <contract_id>
```

### Examples

1. **Analyze a Contract on Mainnet**

    ```bash
    python detect_token_creation_with_secp_key.py 0.0.123456
    ```

2. **Analyze a Contract on Testnet**

    ```bash
    python detect_token_creation_with_secp_key.py 0.0.123456 --testnet
    ```

3. **Analyze a Contract on Previewnet**

    ```bash
    python detect_token_creation_with_secp_key.py 0.0.123456 --previewnet
    ```

## Features

The script performs the following checks on the smart contract bytecode:

- **External Calls Detection**: Identifies if there are any calls to external addresses.
- **Specific Address Usage**: Checks for the usage of Hedera addresses 0x167.
- **Function Selector Usage**: Detects if any of the token creating functions selectors are used.
    
    | Detected function                                                                                                                                                                                                                               | Selector   |
    |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
    | createFungibleToken((string,string,address,string,bool,int64,bool,(uint256,(bool,address,bytes,bytes,address))[],(int64,address,int64)),int64,int32)                                                                                            | 0x0fb65bf3 |
    | createFungibleTokenWithCustomFees((string,string,address,string,bool,int64,bool,(uint256,(bool,address,bytes,bytes,address))[],(int64,address,int64)),int64,int32,(int64,address,bool,bool,address)[],(int64,int64,int64,int64,bool,address)[]) | 0x2af0c59a |
    | createNonFungibleToken((string,string,address,string,bool,int64,bool,(uint256,(bool,address,bytes,bytes,address))[],(int64,address,int64)))                                                                                                     | 0xea83f293 |
    | createNonFungibleTokenWithCustomFees((string,string,address,string,bool,int64,bool,(uint256,(bool,address,bytes,bytes,address))[],(int64,address,int64)),(int64,address,bool,bool,address)[],(int64,int64,int64,address,bool,address)[])        | 0xabb54eb5 |

- **Parameter Usage**: Identifies if the parameter value equal to the enum KeyValueType.SECP256K1 was used.

## Output

Upon successful execution, the script will output the detection results directly to the console. It will indicate whether
there is a chance that the Smart Contract will call one of the HTS Token Creating functions using SECP256K1 key.

If the contract ID provided does not exist or has no bytecode, the script will inform the user accordingly.
